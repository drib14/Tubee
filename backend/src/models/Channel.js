import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  handle: { type: String, required: true, unique: true },
  avatar: { type: String },
  banner: { type: String },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subscribersCount: { type: Number, default: 0 }
}, { timestamps: true });

const Channel = mongoose.model('Channel', channelSchema);
export default Channel;
