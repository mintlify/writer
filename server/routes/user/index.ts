import express from 'express';
import axios from 'axios';
import User, { UserType } from 'models/writer/User';
import { identify } from 'services/segment';
import { getCustomerPortalSession, getPremiumCheckoutSession } from 'services/stripe';
import { Plan } from 'routes/webhooks';
import Team from 'models/writer/Team';

type Tokens = {
  access_token: string;
  refresh_token: string;
};

type AuthInfo = {
  email: string;
  given_name: string;
  family_name: string;
  name: string;
  picture: string;
};

const userRouter = express.Router();

const signInOrSignUp = async (userId, authInfo: AuthInfo, refreshToken): Promise<UserType> => {
  const foundUser = await User.findOne({ email: authInfo.email });
  if (foundUser) {
    return foundUser;
  }

  const email = authInfo.email;
  const givenName = authInfo.given_name;
  const familyName = authInfo.family_name;
  const name = authInfo.name;

  const newUser = new User({
    userId,
    email,
    createdAt: new Date(),
    givenName,
    familyName,
    name,
    picture: authInfo.picture,
    refreshToken,
  });

  await newUser.save();
  identify(userId, {
    email: authInfo.email,
  });

  return newUser;
};

userRouter.post('/code', async (req, res) => {
  const { code, userId, uriScheme } = req.body;
  try {
    const redirectScheme = uriScheme || 'vscode';
    const { data: tokens }: { data: Tokens } = await axios.post(
      `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
      {
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: `https://mintlify.com/start/${redirectScheme}`,
      }
    );

    const { access_token, refresh_token } = tokens;
    const { data: authInfo }: { data: AuthInfo } = await axios.get(
      `${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (authInfo?.email == null) {
      return res.status(402).send({ error: 'Invalid user token' });
    }

    const user = await signInOrSignUp(userId, authInfo, refresh_token);
    const isUpgraded = user.plan === Plan.Premium;

    return res.status(200).send({
      email: authInfo.email,
      isUpgraded,
    });
  } catch (error) {
    return res.status(401).send({
      error,
    });
  }
});

userRouter.get('/checkout', async (req, res) => {
  const { email, scheme } = req.query as { email: string; scheme: string };
  const session = await getPremiumCheckoutSession(email, scheme);
  res.redirect(session.url);
});

userRouter.get('/portal', async (req, res) => {
  const { email, scheme } = req.query as { email: string; scheme: string };
  const session = await getCustomerPortalSession(email, scheme);
  res.redirect(session.url);
});

userRouter.get('/status', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(200).send({
      status: 'unauthenticated',
    });
  }

  const userPromise = User.findOne({ email });
  const teamPromise = await Team.findOne({ members: email });
  const [user, team] = await Promise.all([userPromise, teamPromise]);

  let status = 'community';
  if (!user) {
    status = 'unaccounted';
  } else if (user.plan === Plan.Premium) {
    status = 'team';
  } else if (team != null) {
    status = 'member';
  }
  return res.status(200).send({
    status,
  });
});

export default userRouter;
