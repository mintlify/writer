import express from 'express';
import { adminMiddleware } from 'routes/playground';
import ApiKey from 'models/writer/ApiKey';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

const functionsRouter = express.Router();

functionsRouter.post('/typeform', async (req, res) => {
  const { form_response } = req.body;

  const answers = form_response?.answers;

  if (answers == null) {
    return res.status(400).end();
  }

  const firstNameField = answers.find((answer) => answer.field.ref === 'd566770d2197a78b');
  const { text: firstName } = firstNameField;

  const lastNameField = answers.find(
    (answer) => answer.field.ref === '88b207c9-e0bc-4128-9159-203abc35b622'
  );
  const { text: lastName } = lastNameField;

  const emailField = answers.find((answer) => answer.field.ref === '4150e35efbf41b8a');
  const { email } = emailField;

  const purposeField = answers.find((answer) => answer.field.ref === 'd6b6724b54f245f8');
  const { text: purpose } = purposeField;

  if (!firstName || !lastName || !email) {
    return res.status(400).send('Missing name or email');
  }

  const key = uuidv4();
  const hashedKey = sha1(key);
  try {
    await ApiKey.create({
      hashedKey,
      firstName,
      lastName,
      email,
      purpose,
    });
    return res.status(200).end();
  } catch (error) {
    return res.status(400).send({ error });
  }
});

functionsRouter.post('/api', adminMiddleware, async (req, res) => {
  const { firstName, lastName, email } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).send('Missing name or email');
  }

  const key = uuidv4();
  const hashedKey = sha1(key);
  try {
    await ApiKey.create({
      hashedKey,
      firstName,
      lastName,
      email,
    });
    return res.status(200).send({ key });
  } catch (error) {
    return res.status(400).send({ error });
  }
});

export default functionsRouter;
