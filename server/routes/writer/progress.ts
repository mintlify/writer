import express from 'express';
import { potentiallyReplaceLanguageId } from 'parsing/helpers';
import { getProgress } from 'parsing/progress';

const progressRouter = express.Router();

export type ProgressIndicator = 'Functions' | 'Methods' | 'Classes' | 'Types';

export type Progress = {
  current: number;
  total: number;
  breakdown: Record<ProgressIndicator, { current: number, total: number }>;
}

type ProgressRequestBody = {
  file: string;
  languageId: string;
  types?: ProgressIndicator[];
  fileName?: string;
}

progressRouter.post('/', async (req: { body: ProgressRequestBody }, res) => {
  const { file, types, languageId, fileName } = req.body;

  try {
    const newLanguageId = potentiallyReplaceLanguageId(fileName, languageId);
    const progress = await getProgress(file, newLanguageId, types);
    res.status(200).send(progress);
  }
  catch {
    res.status(400).send({ error: 'Could not get progress' });
  }
})

export default progressRouter;