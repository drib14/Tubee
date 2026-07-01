import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  isYouTubeVideo: { type: Boolean, default: false },
  youtubeVideoId: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);
