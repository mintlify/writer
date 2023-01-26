import express from 'express';
import Team from 'models/writer/Team';
import User from 'models/writer/User';
import { Plan } from 'routes/webhooks';
import { track } from 'services/segment';

const teamRouter = express.Router();

type TeamRequestBody = {
  userId: string,
  fromEmail: string,
  toEmail: string,
  shouldCreateTeam?: boolean,
}

teamRouter.get('/', async (req, res) => {
  try {
    const { email } = req.body;
    const team = await Team.findOne({ $or: [
      {admin: email},
      {members: email},
    ] });

    if (team == null) {
      return res.send({
        admin: email,
        members: [],
      })
    }

    const admin = team.admin;
    const registeredMembers = await User.find({ email: { $in: team.members } });
    const registeredMembersEmails = registeredMembers.map((member) => member.email);

    const members = team.members.map((member) => {
      return {
        email: member,
        isInvitePending: !registeredMembersEmails.includes(member),
      }
    })

    return res.send({
      admin,
      members
    });
  }
  catch {
    return res.status(400).send({
      error: 'Cannot fetch team',
    })
  }
})

teamRouter.post('/invite', async (req: { body: TeamRequestBody }, res) => {
  const { userId, fromEmail, toEmail, shouldCreateTeam } = req.body;

  try {
    if (fromEmail === toEmail) {
      throw 'Cannot add yourself'
    }

    if (!toEmail) {
      throw 'Missing email input';
    }

    if (fromEmail && shouldCreateTeam) {
      const user = await User.findOne({email: fromEmail});
      if (user?.plan !== Plan.Premium) {
        throw 'You can only invite others on a premium account';
      }

      const team = await Team.findOne({ admin: fromEmail });
      if (team != null) {
        const teamSize = team.members.length;
        if (team.members.includes(toEmail)) {
          throw 'Member already invited to the team'
        }

        if (teamSize >= 2) {
          throw 'Cannot have more than 3 members in team';
        }
      }

      await Team.findOneAndUpdate({ admin: fromEmail }, { admin: fromEmail, $push: { members: toEmail } }, { upsert: true, new: true });
    }

    if (userId != null && shouldCreateTeam === false) {
      track(userId, 'Inviting without premium plan', {
        email: fromEmail
      })
    }

    res.status(200).end();
  }
  catch (error) {
    console.log(error);
    res.status(400).send({ error });
  }
});

teamRouter.delete('/invite', async (req: { body: TeamRequestBody }, res) => {
  const { fromEmail, toEmail } = req.body;

  try {
    await Team.findOneAndUpdate({ admin: fromEmail }, { $pull: { members: toEmail } });
    res.status(200).end();
  }
  catch {
    res.status(400).send({ error: 'Error removing invite. Try again later' });
  }
});

export default teamRouter;