import { nanoid } from 'nanoid';
import { getDocstringPrompt } from 'brain/codex/docs';
import { addComments, wrapStr } from 'brain/helpers';
import { track, trackOpen } from 'services/segment';
import { getSynopsis } from 'parsing';
import { Synopsis } from 'parsing/types';
import { CommentPosition, LogMode, CommentFormat, DocFormat } from 'constants/enums';
import { getLocationAndRemoveMarker } from 'brain/codex/helpers';
import Doc from 'models/writer/Doc';
import User from 'models/writer/User';
import { TargetLanguage } from 'services/translate';
import { Plan } from 'routes/webhooks';
import Team from 'models/writer/Team';
import { getDocFormat } from 'formatting/functions';

export type Custom = {
  template?: string;
  author?: string;
  date?: string;
  language?: TargetLanguage;
};

type Body = {
  code: string;
  languageId: string | null;
  email?: string;
  commented?: boolean;
  userId?: string;
  docStyle?: DocFormat;
  custom?: Custom;
  context?: string;
  width?: number;
  source?: string;
  // Appended
  isSelection?: boolean;
};

type EditCursorMarker = {
  line: number;
  message: string;
};

type DocstringResponse = {
  docstring: string;
  position: CommentPosition;
  feedbackId: string | null;
  preview: string | null;
  cursorMarker?: EditCursorMarker;
};

type ShowFeedbackStatus = {
  shouldShowFeedback: boolean;
  shouldShowShare?: boolean;
};

export const checkShowFeedbackStatus = async (userId: string): Promise<ShowFeedbackStatus> => {
  try {
    if (!userId) {
      return {
        shouldShowFeedback: false,
      };
    }

    const pastThreeDocsRequest = Doc.find({ userId }).sort({ timestamp: -1 }).limit(3);
    const hasIndicatedPositiveFeedbackRequest = Doc.exists({
      userId,
      feedback: 1,
    });
    const [pastThreeDocs, hasIndicatedPositiveFeedback] = await Promise.all([
      pastThreeDocsRequest,
      hasIndicatedPositiveFeedbackRequest,
    ]);
    const hasNotIndicatedPositiveFeedback = !hasIndicatedPositiveFeedback;

    const isFirstTime = pastThreeDocs.length === 0;
    const isFeedbackWithinPastThree = pastThreeDocs?.find((doc) => doc.feedback) != null;
    if (isFirstTime || isFeedbackWithinPastThree) {
      return {
        shouldShowFeedback: false,
      };
    }

    const POSSIBILITY_TO_SHOW_FEEDBACK = 0.3;
    const isWithinPossibility = Math.random() < POSSIBILITY_TO_SHOW_FEEDBACK;

    return {
      shouldShowFeedback: isWithinPossibility && hasNotIndicatedPositiveFeedback,
      shouldShowShare: hasNotIndicatedPositiveFeedback,
    };
  } catch {
    return {
      shouldShowFeedback: false,
    };
  }
};

const getCommentFormat = (
  languageId: string | null,
  synopsis: Synopsis,
  docFormat: DocFormat
): CommentFormat => {
  if (languageId === 'java' && synopsis.kind === 'class') return CommentFormat.JSDoc;
  if (
    (languageId === 'typescript' ||
      languageId === 'javascript' ||
      languageId === 'typescriptreact' ||
      languageId === 'javascriptreact' ||
      languageId === 'php' ||
      languageId === 'java' ||
      languageId === 'kotlin' ||
      languageId === 'c' ||
      languageId === 'cpp') &&
    (synopsis.kind === 'function' || synopsis.kind === 'typedef')
  ) {
    return CommentFormat.JSDoc;
  } else if (languageId === 'python' && synopsis.kind === 'function') {
    if (docFormat === DocFormat.Numpy) {
      return CommentFormat.Numpy;
    }
    return CommentFormat.PythonDocstring;
  } else if ((languageId === 'csharp' && synopsis.kind === 'function') || languageId === 'rust') {
    return CommentFormat.XML;
  } else if (languageId === 'ruby' && synopsis.kind === 'function') {
    return CommentFormat.RDoc;
  }

  return CommentFormat.Line;
};

const getPosition = (languageId: string, synopsis: Synopsis): CommentPosition => {
  if (languageId === 'python' && synopsis.kind === 'function') {
    return CommentPosition.BelowStartLine;
  }

  return CommentPosition.Above;
};

export const getDocument = async (
  body: Body,
  logMode: LogMode = LogMode.On,
  allowedKinds?: string[]
): Promise<DocstringResponse> => {
  const {
    code,
    languageId,
    email,
    commented,
    userId,
    docStyle: docStyleSelected,
    custom,
    context,
    source,
    width,
    isSelection,
  } = body;

  if (!code) {
    throw 'No code provided';
  }

  const timeBeforeGenerate = new Date();
  const synopsis = getSynopsis(code, languageId, context);
  if (
    logMode === LogMode.Preview &&
    allowedKinds != null &&
    allowedKinds.includes(synopsis.kind) === false
  ) {
    return {
      docstring: null,
      position: null,
      feedbackId: null,
      preview: null,
    };
  }

  const docFormat = getDocFormat(docStyleSelected, languageId);
  const commentFormat = getCommentFormat(languageId, synopsis, docFormat);
  const timeBeforeCodexCall = new Date();
  const docstringPrompt = await getDocstringPrompt(
    code,
    synopsis,
    languageId,
    docFormat,
    context,
    custom
  );
  const timeAfterCodexCall = new Date();
  let docstringWithMarker = docstringPrompt.docstring;
  const { promptId } = docstringPrompt;
  // Used for preview
  const preview = docstringWithMarker;
  // Add comments if necessary
  if (commented && languageId) {
    // Wrap to avoid overfill
    docstringWithMarker = wrapStr(docstringWithMarker, width);
    docstringWithMarker = addComments(docstringWithMarker, languageId, commentFormat);
  }

  const position = getPosition(languageId, synopsis);

  // Remove marker used for tracking
  const removedMarkerAndIndex = getLocationAndRemoveMarker(docstringWithMarker, position);
  const { docstring } = removedMarkerAndIndex;
  const { cursorMarker } = removedMarkerAndIndex;
  let feedbackId = null;

  if (logMode === LogMode.On || logMode === LogMode.Preview) {
    const timeAfterGenerate = new Date();
    feedbackId = nanoid();
    const doc = {
      userId,
      email,
      output: docstring,
      prompt: 'v2',
      language: languageId,
      timeToGenerate: timeAfterGenerate.getTime() - timeBeforeGenerate.getTime(),
      timeToCall: timeAfterCodexCall.getTime() - timeBeforeCodexCall.getTime(),
      source,
      feedbackId,
      isPreview: logMode === LogMode.Preview,
      // Detected based on marker
      isExplained: cursorMarker == null,
      docFormat,
      commentFormat,
      kind: synopsis.kind,
      isSelection,
      promptId,
      actualLanguage: custom?.language ?? 'English',
    };

    Doc.create(doc);
    trackOpen({
      anonymousId: userId || 'aidoc',
      event: 'Generate Doc',
      properties: doc,
    });
  }

  return {
    docstring,
    position,
    feedbackId,
    preview,
    cursorMarker,
  };
};

const MAX_DOCS_FOR_AUTH = 60;
const DAYS_PER_QUOTA_PERIOD = 30;

export const checkIfUserShouldAuthenticate = async (req, res, next) => {
  const { userId, email, source }: Body = req.body;
  if (!userId) {
    return res.status(401).send({ error: 'No userId provided' });
  }

  // TODO: Add quota for IntelliJ users
  if (source === 'intellij' || source === 'web') {
    return next();
  }

  const docsCountPromise = Doc.countDocuments({
    userId,
    timestamp: {
      $gte: new Date(Date.now() - DAYS_PER_QUOTA_PERIOD * 24 * 60 * 60 * 1000),
    },
  });
  const identifiedUserPromise = email ? User.findOne({ email }) : null;
  const existsInTeamPromise = email ? Team.exists({ members: email }) : null;
  const [docsCount, identifiedUser] = await Promise.all([
    docsCountPromise,
    identifiedUserPromise,
    existsInTeamPromise,
  ]);

  if (identifiedUser == null && docsCount > MAX_DOCS_FOR_AUTH) {
    return res.status(401).send({
      requiresAuth: true,
      message:
        "Please sign in to continue. By doing so, you agree to Mintlify's terms and conditions",
      button: '🔐 Sign in',
      error: 'Please update the extension to continue',
    });
  }

  User.updateOne({ userId }, { lastActiveAt: new Date() });
  next();
};
