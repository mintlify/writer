import axios, { AxiosResponse } from 'axios';
import { CommentPosition } from 'constants/enums';
import { CURSOR_MARKER, EMPTY_PROMPT } from 'constants/values';
import { OpenAPICall, CustomComponent } from './prompt';
import { DocstringPrompt } from './docs';
import dotenv from 'dotenv';
dotenv.config();

export const GPT_COMPLETIONS = 'https://api.openai.com/v1/chat/completions';
export const GPT_MODEL = 'gpt-3.5-turbo';

export const OPENAI_AUTHORIZATION = {
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
  },
};

export type OpenAIResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};

export const makeCodexCall = (
  call: OpenAPICall,
  code: string,
  languageCommented: string,
  custom?: CustomComponent
): Promise<AxiosResponse<OpenAIResponse>> => {
  const {
    systemRoleContent,
    userRoleContent,
    stop,
    temperature,
    maxTokens,
    engineEndpoint,
    model,
  } = call;
  return axios.post(
    engineEndpoint,
    {
      model,
      messages: [
        {
          role: 'system',
          content: systemRoleContent,
        },
        { role: 'user', content: userRoleContent(code, languageCommented, custom) },
      ],
      temperature,
      max_tokens: maxTokens,
      stop,
    },
    OPENAI_AUTHORIZATION
  );
};

export const sanityCheck = (response: string): string => {
  if (!response) return response;

  const trimmed = response.trim();
  const removedQuotes = trimmed.replace(/^["'](.+(?=["']$))["']$/, '$1');
  const withoutItIs = removedQuotes.replace(/^it is /gim, '');
  const upperCaseFirstCharacter = withoutItIs.charAt(0).toUpperCase() + withoutItIs.slice(1);
  return upperCaseFirstCharacter;
};

/**
 * Get the first valid summary from multiple responses.
 * @param {string[]} responses - A list of responses
 * @returns The summary of the first response that is not empty.
 */
export const getSummaryFromMultipleResponses = (...responses: string[]): string => {
  for (const response of responses) {
    const sanifiedResponse = sanityCheck(response);
    if (sanifiedResponse) {
      return sanifiedResponse;
    }
  }

  // Use marker to indicate that no summary was found and identify location for cursor placement
  return CURSOR_MARKER;
};

export const chooseDocstringPrompt = (docstringPrompts: DocstringPrompt[]): DocstringPrompt => {
  for (const docstringPrompt of docstringPrompts) {
    const sanifiedDocstring = sanityCheck(docstringPrompt.docstring);
    if (sanifiedDocstring) {
      return { docstring: sanifiedDocstring, promptId: docstringPrompt.promptId };
    }
  }

  // Use marker to indicate that no summary was found and identify location for cursor placement
  return EMPTY_PROMPT;
};

export const getLocationAndRemoveMarker = (docstring: string, position: CommentPosition) => {
  const markerIndex = docstring.indexOf(CURSOR_MARKER);
  if (markerIndex === -1) {
    return {
      docstring,
    };
  }

  const upToIndex = docstring.substring(0, markerIndex);
  const specialPositionIncrement = position === CommentPosition.BelowStartLine ? 1 : 0;
  return {
    cursorMarker: {
      line: upToIndex.split('\n').length - 1 + specialPositionIncrement,
      character: Number.MAX_SAFE_INTEGER,
      message: 'Unable to generate summary',
    },
    docstring: docstring.replace(CURSOR_MARKER, ''),
  };
};

export const formatReturnExplained = (returnExplained: string | null): string => {
  if (!returnExplained) return '';

  const trimmed = returnExplained.trim();
  const withoutIntro = trimmed.replace(
    /^(the function|it is|the function is)\s(returns|returning)\s/i,
    ''
  );
  return withoutIntro;
};
