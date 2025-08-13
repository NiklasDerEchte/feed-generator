import mongoose from 'mongoose';

export const connectMongo = async (mongoUri: string) => {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);
};

// Post Schema
const postSchema = new mongoose.Schema({
  uri: { type: String, required: true, unique: true },
  cid: { type: String, required: true },
  indexedAt: { type: String, required: true },
  author: { type: String, required: false },
  record: { type: Object, required: false },
});
export const PostModel = mongoose.model('Post', postSchema);

// SubState Schema
const subStateSchema = new mongoose.Schema({
  service: { type: String, required: true, unique: true },
  cursor: { type: Number, required: true },
});
export const SubStateModel = mongoose.model('SubState', subStateSchema);
