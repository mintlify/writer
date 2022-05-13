import mongoose from "mongoose";

const { Schema } = mongoose;

/* This is defining the schema for the ApiKey model. */
const ApiKeySchema = new Schema({
  hashedKey: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  purpose: { type: String },
  createdAt: { type: Date, default: Date.now },
});

/* Creating a model called ApiKey, using the ApiKeySchema, and storing it in the apikeys collection. */
const ApiKey = mongoose.model("ApiKey", ApiKeySchema, "apikeys");

export default ApiKey;
