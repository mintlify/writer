import Queue from 'bull';

// For concurrency through workers
export const MAX_JOBS_PER_WORKER = 50;
export const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const workers = process.env.WEB_CONCURRENCY || 2;
export const workQueue = new Queue('work', REDIS_URL, process.env.NODE_ENV === 'production'
  ? {
    redis: {
      tls: {
        rejectUnauthorized: false,
      },
    }
  }
  : undefined
);