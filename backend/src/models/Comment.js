import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  video: { type: String, required: true }, // Can be custom video MongoDB ID or YouTube Video ID
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  isSupporter: { type: Boolean, default: false }, // Paymongo contribution badge
  channelSupported: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  repliedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
