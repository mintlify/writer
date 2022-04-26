import mongoose from 'mongoose';

const { Schema } = mongoose;

const DocSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: String },
  email: { type: String },
  output: { type: String },
  prompt: { type: String, required: true },
  language: { type: String },
  timeToGenerate: { type: Number },
  timeToCall: { type: Number },
  source: { type: String },
  feedbackId: { type: String },
  feedback: { type: Number },
  isPreview: { type: Boolean },
  hasAcceptedPreview: { type: Boolean },
  isExplained: { type: Boolean },
  docFormat: { type: String },
  commentFormat: { type: String },
  kind: { type: String },
  isSelection: { type: Boolean },
  promptId: { type: String },
  actualLanguage: { type: String }
});

const Doc = mongoose.model('Doc', DocSchema, 'docs');

export default Doc;
