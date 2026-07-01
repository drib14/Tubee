import mongoose from 'mongoose';

const playlistVideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  thumbnailUrl: { type: String },
  duration: { type: Number, default: 0 },
  channelTitle: { type: String }
});

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videos: [playlistVideoSchema],
  isPrivate: { type: Boolean, default: false }
}, { timestamps: true });

const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;
