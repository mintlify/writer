import Stripe from 'stripe';
import dotenv from 'dotenv';
import User from 'models/writer/User';

dotenv.config();

const PriceIds = {
  dev: {
    team: 'price_1KcGymIslOV3ufr2svaasDZX',
  },
  prod: {
    team: 'price_1KcGnzIslOV3ufr2TDG9TFto',
  },
};

const teamPriceId = process.env.NODE_ENV === 'production' ? PriceIds.prod.team : PriceIds.dev.team;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

export const getPremiumCheckoutSession = async (email: string, scheme: string) => {
  const user = await User.findOne({ email });
  const customerInfo = user?.stripeCustomerId
    ? { customer: user.stripeCustomerId }
    : { customer_email: email };
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: teamPriceId,
        quantity: 1,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: 10,
        },
      },
    ],
    ...customerInfo,
    success_url: `https://mintlify.com/start/open?scheme=${scheme}&event=upgrade`,
    cancel_url: `https://mintlify.com/start/open?scheme=${scheme}`,
  });

  return session;
};

export const getCustomerPortalSession = async (email: string, scheme: string) => {
  const user = await User.findOne({ email });
  let stripeCustomerId = user?.stripeCustomerId;
  if (!stripeCustomerId) {
    const newCustomer = await stripe.customers.create({
      email,
    });

    stripeCustomerId = newCustomer.id;
    await User.updateOne({ email }, { stripeCustomerId });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `https://mintlify.com/start/open?scheme=${scheme}`,
  });

  return session;
};
