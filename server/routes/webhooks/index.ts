import express from 'express';
import { stripe } from 'services/stripe';
import User from 'models/writer/User';

const webhooksRouter = express.Router();

export enum Plan {
  Premium = 'premium'
}

webhooksRouter.post('/stripe', async (req, res) => {
  let data;
  let eventType;
  const webhookSecret = null
  if (webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    const signature = req.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.log('⚠️  Webhook signature verification failed.');
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  const { customer_email: email, customer: stripeCustomerId } = data.object;
  if (!email) {
    return res.end();
  }

  switch (eventType) {
    case 'checkout.session.completed':
      await User.findOneAndUpdate({ email }, { plan: Plan.Premium, stripeCustomerId });
      break;
    case 'invoice.paid':
      await User.findOneAndUpdate({ email }, { plan: Plan.Premium, stripeCustomerId });
      break;
    case 'customer.subscription.deleted':
      await User.findOneAndUpdate({ email }, { $unset : { plan: 1} });
      break;
    case 'invoice.payment_failed':
      await User.findOneAndUpdate({ email }, { $unset : { plan: 1} });
      break;
    default:
    // Unhandled event type
  }

  res.sendStatus(200);
});

export default webhooksRouter;