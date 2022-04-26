import mongoose, { ObjectId } from 'mongoose';

const { Schema } = mongoose;

export type TeamType = {
  _id: ObjectId,
  admin: string,
  members: string[],
  createdAt: Date,
}

const TeamSchema = new Schema({
  admin: { type: String, required: true },
  members: { type: [String], required: true, default: [] },
  createdAt: { type: Date, default: Date.now }
})

const Team = mongoose.model<TeamType>('Team', TeamSchema, 'teams');

export default Team;
