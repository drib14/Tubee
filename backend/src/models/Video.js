import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String },
  lat: { type: Number },
  lon: { type: Number }
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String }, // Cloudinary URL
  thumbnailUrl: { type: String }, // Cloudinary URL or YouTube URL
  duration: { type: Number, default: 0 }, // In seconds
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  tags: [{ type: String }],
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }, // Null for pure YouTube videos without local cache
  isYouTubeVideo: { type: Boolean, default: false },
  youtubeVideoId: { type: String, unique: true, sparse: true }, // Sparse unique to prevent duplicates of YouTube vids
  youtubeChannelTitle: { type: String },
  youtubeChannelId: { type: String },
  location: locationSchema
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);
export default Video;
