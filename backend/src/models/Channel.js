import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  handle: { type: String, required: true, unique: true },
  avatar: { type: String, default: '' },
  banner: { type: String, default: 'gradient' },
  description: { type: String, default: '' },
  subscribersCount: { type: Number, default: 0 },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  socials: {
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' }
  }
}, { timestamps: true });

export default mongoose.model('Channel', channelSchema);
