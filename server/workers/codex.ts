import throng from 'throng';
import 'services/mongoose';
import { workers, workQueue, MAX_JOBS_PER_WORKER } from 'workers';
import { checkShowFeedbackStatus, getDocument } from 'routes/writer/helpers';

const startCodexWorker = () => {
  workQueue.process(MAX_JOBS_PER_WORKER, async (job) => {
    const body = job.data;
    const [documentInfo, showFeedbackData] = await Promise.all([getDocument(body), checkShowFeedbackStatus(body.userId)]);
    const shouldShowFeedback = showFeedbackData.shouldShowFeedback && documentInfo.cursorMarker == null;
    const shouldShowShare = showFeedbackData.shouldShowShare;
    return {
      ...documentInfo,
      shouldShowFeedback,
      shouldShowShare
    };
  });
}

throng({ workers, start: startCodexWorker });