import express from 'express';
import { getSynopsis, getTreeSitterProgram } from 'parsing/index';

const playgroundRouter = express.Router();

export const adminMiddleware = async (req, res, next) => {
  const { accessKey } = req.body;

  if (accessKey !== process.env.ADMIN_ACCESS_KEY) {
    return res.status(401).send({
      error: 'Invalid access key'
    })
  }
  next();
}

playgroundRouter.use(adminMiddleware);
playgroundRouter.post('/mints/:mode', async (req, res) => {
  const { mode } = req.params;
  const { code, languageId, context } = req.body;

  if (mode === 'ast') {
    const tree = await getTreeSitterProgram(code, languageId);
    return res.status(200).send({ ast: tree.root });
  } else if (mode === 'synopsis') {
    const synopsis = getSynopsis(code, languageId, context);
    return res.status(200).send({ synopsis });
  }

  return res.end();
});

export default playgroundRouter;
