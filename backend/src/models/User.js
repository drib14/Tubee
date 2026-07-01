import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  videoId: { type: String, required: true }, // Can be custom video MongoDB ID or YouTube Video ID
  watchedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 } // In seconds
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  googleId: { type: String, required: true, unique: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  watchLater: [{ type: String }], // Array of videoId strings
  likedVideos: [{ type: String }],
  dislikedVideos: [{ type: String }],
  history: [historySchema]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
