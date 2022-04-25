import express from 'express';
import sha1 from 'sha1';
import rateLimit from 'express-rate-limit';
import ApiKey from 'models/writer/ApiKey';
import { DocFormat } from 'constants/enums';

// At the /v1 route
const publicRouter = express.Router();

const apiMiddleware = async (req, res, next) => {
  const key = req.get('API-KEY');
  if (key == null) {
    return res.status(401).send({ error: 'No API key provided' });
  }

  const cleanKey = key.trim();
  const hashedKey = sha1(cleanKey);
  const exists = await ApiKey.exists({ hashedKey });

  if (!exists) {
    return res.status(401).send({ error: 'Invalid API key' });
  }

  res.locals.hashedKey = hashedKey;
  next();
}

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'You have surpassed the 100 requests per 15 minutes rate limit, please try again later',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

publicRouter.post('/document', apiLimiter, apiMiddleware, async (req, res) => {
  return res.status(400).send({error: 'The Mintlify API is currently being updated. Please email hi@mintlify for urgent authorization'});
  // const { hashedKey } = res.locals;
  // const { code, commented, language, format, context } = req.body;

  // if (!code) {
  //   return res.status(400).send({error: 'No code provided'});
  // }

  // const body = {
  //   code,
  //   languageId: language,
  //   commented: commented || false,
  //   userId: hashedKey,
  //   docStyle: format || 'Auto-detect',
  //   context: context || code,
  //   source: 'api',
  // }

  // try {
  //   const { docstring } = await getDocument(body);
  //   return res.status(200).send({documentation: docstring});
  // } catch {
  //   return res.status(400).send({error: 'Error generating documentation from code'});
  // }
});

publicRouter.get('/list/languages', apiLimiter, apiMiddleware, async (_, res) => {
  const languages = ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'php', 'c', 'cpp'];
  return res.status(200).send({languages});
});

publicRouter.get('/list/formats', apiLimiter, apiMiddleware, async (_, res) => {
  const formats = [
    {
      id: DocFormat.JSDoc,
      defaultLanguages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    },
    {
      id: DocFormat.ReST,
      defaultLanguages: ['python'],
    },
    {
      id: DocFormat.DocBlock,
      defaultLanguages: ['php', 'c', 'cpp'],
    },
    {
      id: DocFormat.Google,
      defaultLanguages: [],
    }
  ];
  return res.status(200).send({formats});
});

export default publicRouter;