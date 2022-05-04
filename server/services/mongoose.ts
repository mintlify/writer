// https://www.notion.so/mintlify/Mongoose-b0120908e4fb410e881bb0e3506b16dd#cb6ea66a0bd545cb83c88b688b76b820
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI as string;
mongoose.connect(uri);

const { connection } = mongoose;
connection.on('error', console.error.bind(console, `Connection error reported on ${console.profile}`));
connection.on('log', console.log.bind('Logging on Mongoose'));
connection.once('open', () => {
  console.log('MongoDB database connected...');
});