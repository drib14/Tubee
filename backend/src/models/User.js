import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String, default: '' },
  googleId: { type: String, default: '' },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', default: null },
  likedVideos: [{ type: String }],
  dislikedVideos: [{ type: String }],
  watchLater: [{ type: String }],
  history: [{
    videoId: { type: String },
    watchedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);
