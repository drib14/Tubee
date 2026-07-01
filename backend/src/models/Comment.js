import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  video: { type: String, required: true }, // MERN ID or YouTube video ID
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  isSupporter: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);
