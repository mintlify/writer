import express from 'express';
import Doc from 'models/writer/Doc';
import { track } from 'services/segment';
import { checkIfUserShouldAuthenticate } from 'routes/writer/helpers';
import { getCode } from 'parsing';
import { workQueue } from 'workers';
import { potentiallyReplaceLanguageId } from 'parsing/helpers';

const docsRouter = express.Router();

docsRouter.post('/write/v3', checkIfUserShouldAuthenticate, async (req, res) => {
  try {
    const { fileName, languageId } = req.body;
    const newLanguageId = potentiallyReplaceLanguageId(fileName, languageId);
    const body = {
      ...req.body,
      isSelection: true,
      // Update depending on filename
      languageId: newLanguageId,
    }
    const job = await workQueue.add(body);
    res.status(200).json({ id: job.id })
  } catch (error) {
    res.status(400).json({ error });
  }
});

docsRouter.post('/write/v3/no-selection', checkIfUserShouldAuthenticate, async (req, res) => {
  try {
    const { languageId, context, location, line, fileName } = req.body;
    const newLanguageId = potentiallyReplaceLanguageId(fileName, languageId);
    const code = await getCode(context, languageId, location, line);
    const body = {
      ...req.body,
      code,
      isSelection: false,
      languageId: newLanguageId
    }
    const job = await workQueue.add(body);
    res.status(200).json({ id: job.id })
  } catch (error) {
    res.status(400).json({ error });
  }
});

docsRouter.get('/worker/:id', async (req, res) => {
  const { id } = req.params;
  const job = await workQueue.getJob(id);
  
  if (job === null) {
    res.status(404).end();
  } else {
    const state = await job.getState();
    let data;
    if (state === 'completed') {
      data = await job.finished();
    }
    const reason = job.failedReason;
    res.json({ id, state, reason, data });
  }
});

docsRouter.post('/feedback', async (req, res) => {
  try {
    const { id, feedback } = req.body;
    const { userId, language, docFormat, commentFormat, kind, promptId } = await Doc.findOneAndUpdate({ feedbackId: id }, { feedback });

    const feedbackProperties = {
      language,
      docFormat,
      commentFormat,
      kind,
      promptId
    }

    if (feedback > 0) {
      track(userId, 'Positive Feedback', feedbackProperties);
    } else if (feedback < 0) {
      track(userId, 'Negative Feedback', feedbackProperties);
    }
    res.status(200).end();
  } catch (error) {
    res.status(400).end();
  }
});

docsRouter.post('/intro', async (req, res) => {
  try {
    const { id, purpose } = req.body;
    const { userId } = await Doc.findOne({ feedbackId: id });
    track(userId, 'Intro Survey', {
      purpose
    });
    res.status(200).end();
  } catch (error) {
    res.status(400).end();
  }
});

docsRouter.post('/intro/discover', async (req, res) => {
  try {
    const { id, source } = req.body;
    const { userId } = await Doc.findOne({ feedbackId: id });
    track(userId, 'Intro Discover', {
      source
    });
    res.status(200).end();
  } catch (error) {
    res.status(400).end();
  }
});

export default docsRouter;