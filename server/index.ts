import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import 'services/mongoose';
import functionsRouter from 'routes/functions';
import playgroundRouter from 'routes/playground';
import docsRouter from 'routes/writer';
import publicRouter from 'routes/public';
import userRouter from 'routes/user';
import progressRouter from 'routes/writer/progress';
import webhooksRouter from 'routes/webhooks';
import teamRouter from 'routes/writer/team';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const dd_options = {
  'response_code':true,
  'tags': ['app:my_app']
};

// eslint-disable-next-line
const connect_datadog = require('connect-datadog')(dd_options);

app.use(cors());
app.use(express.json({ limit: '5mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(connect_datadog);

app.set('trust proxy', 1);
app.get('/', (_, res) => {
  res.send('🌿 Welcome to the Mintlify API')
});
app.use('/functions', functionsRouter);
app.use('/playground', playgroundRouter);

// Documentation
app.use('/docs', docsRouter);
app.use('/progress', progressRouter);

// Users
app.use('/user', userRouter);
app.use('/team', teamRouter);

// Webhooks
app.use('/webhooks', webhooksRouter);

// Public API
app.use('/v1', publicRouter);

app.listen(PORT, () => {
  console.log(`Listening at PORT ${PORT}`);
});