import mongoose, { ObjectId } from 'mongoose';

const { Schema } = mongoose;

export type UserType = {
  _id: ObjectId,
  email: string,
  createdAt: Date,
  lastLoginAt: Date,
  refreshToken: string,
  plan: string,
  stripeCustomerId: string,
}

const UserSchema = new Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  refreshToken: { type: String, required: true },
  givenName: { type: String },
  familyName: { type: String },
  name: { type: String },
  picture: { type: String },
  plan: { type: String },
  stripeCustomerId: { type: String },
})

const User = mongoose.model<UserType>('User', UserSchema, 'users');

export default User;
