import ytSearch from 'yt-search';
import Video from '../models/Video.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';

// Helper to generate deterministic subscriber count based on channel name
const getDeterministicSubs = (name) => {
  if (!name) return '150K';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const value = Math.abs(hash % 980) + 15; // 15 to 995
  if (value > 900) return `${(value / 100).toFixed(1)}M`;
  return `${value}K`;
};

// Search videos - queries YouTube search results exclusively
export const searchVideos = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    let ytResults = [];
    let ytChannels = [];
    try {
      const r = await ytSearch(q);
      
      // Parse YT Channels if present
      if (r.channels && r.channels.length > 0) {
        ytChannels = r.channels.slice(0, 3).map(ch => ({
          _id: ch.id || ch.url.split('/').pop(),
          type: 'channel',
          name: ch.name,
          handle: ch.url.split('/').pop() || ch.name.toLowerCase().replace(/\s+/g, ''),
          avatar: ch.image,
          description: `YouTube Creator with ${ch.videoCount || 10} uploads`,
          subscribersCount: `${ch.subscribers || getDeterministicSubs(ch.name)} subscribers`,
          isYouTubeChannel: true
        }));
      }

      // Parse YT Videos
      ytResults = r.videos.slice(0, 15).map(v => ({
        _id: v.videoId,
        type: 'video',
        title: v.title,
        description: `YouTube video upload by ${v.author.name}`,
        videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        thumbnailUrl: v.thumbnail || v.image,
        duration: v.seconds,
        views: v.views || 1024,
        likes: Math.round((v.views || 1024) * 0.05),
        dislikes: 0,
        isYouTubeVideo: true,
        youtubeVideoId: v.videoId,
        youtubeChannelTitle: v.author.name,
        youtubeChannelId: v.author.url.split('/').pop() || v.author.name,
        youtubeChannelAvatar: v.author.image || '',
        youtubeSubscribersCount: `${getDeterministicSubs(v.author.name)} subscribers`,
        createdAt: v.ago || 'Uploaded recently'
      }));
    } catch (e) {
      console.error('YouTube search failed:', e.message);
    }

    // Merge lists (channels first)
    const results = [
      ...ytChannels,
      ...ytResults
    ];
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feed for home screen - dynamic YouTube content
export const getHomeFeed = async (req, res) => {
  try {
    let ytFeed = [];
    try {
      const searchTopics = ['lofi chill beats', 'coffee shop coding session', 'nextjs tutorial', 'web dev portfolio'];
      const randomTopic = searchTopics[Math.floor(Math.random() * searchTopics.length)];
      
      const r = await ytSearch(randomTopic);
      ytFeed = r.videos.slice(0, 20).map(v => ({
        _id: v.videoId,
        title: v.title,
        description: `YouTube video by ${v.author.name}`,
        videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        thumbnailUrl: v.thumbnail || v.image,
        duration: v.seconds,
        views: v.views || 50000,
        likes: Math.round((v.views || 50000) * 0.04),
        dislikes: 0,
        isYouTubeVideo: true,
        youtubeVideoId: v.videoId,
        youtubeChannelTitle: v.author.name,
        youtubeChannelId: v.author.url.split('/').pop() || v.author.name,
        youtubeChannelAvatar: v.author.image || '',
        createdAt: v.ago || '1 year ago'
      }));
    } catch (e) {
      console.error('YouTube home feed fetch failed:', e.message);
    }

    res.status(200).json(ytFeed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single video by ID (looks up metadata directly from YouTube search)
export const getVideoById = async (req, res) => {
  const { id } = req.params;

  try {
    try {
      const queryResult = await ytSearch({ videoId: id });
      if (queryResult) {
        return res.status(200).json({
          _id: queryResult.videoId,
          title: queryResult.title,
          description: queryResult.description || `YouTube video upload by ${queryResult.author.name}`,
          videoUrl: queryResult.url,
          thumbnailUrl: queryResult.thumbnail || queryResult.image,
          duration: queryResult.seconds,
          views: queryResult.views || 100000,
          likes: Math.round((queryResult.views || 100000) * 0.06),
          dislikes: 0,
          isYouTubeVideo: true,
          youtubeVideoId: queryResult.videoId,
          youtubeChannelTitle: queryResult.author.name,
          youtubeChannelId: queryResult.author.url.split('/').pop() || queryResult.author.name,
          youtubeChannelAvatar: queryResult.author.image || '',
          createdAt: queryResult.ago || 'Uploaded to YouTube'
        });
      }
    } catch (ytError) {
      // Fallback placeholder data if YouTube fetch fails
      return res.status(200).json({
        _id: id,
        title: 'YouTube Stream',
        description: 'A YouTube stream embedded directly into Tubee.',
        videoUrl: `https://www.youtube.com/watch?v=${id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        duration: 360,
        views: 9999,
        likes: 232,
        dislikes: 0,
        isYouTubeVideo: true,
        youtubeVideoId: id,
        youtubeChannelTitle: 'YouTube Content Creator',
        youtubeChannelId: 'youtube',
        createdAt: 'Recently'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new video (Upload metadata from frontend)
export const createVideo = async (req, res) => {
  const { title, description, videoUrl, thumbnailUrl, duration, category, tags, location } = req.body;

  if (!title || !videoUrl || !thumbnailUrl) {
    return res.status(400).json({ message: 'Title, video URL, and thumbnail URL are required' });
  }

  try {
    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) {
      return res.status(400).json({ message: 'You must create a channel before uploading videos' });
    }

    const video = await Video.create({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration: duration || 0,
      category: category || 'Coffee',
      tags: tags || [],
      channel: channel._id,
      isYouTubeVideo: false,
      location: location || null
    });

    // Send WebSocket notification to all channel subscribers
    const io = req.app.get('io');
    if (io) {
      try {
        const { activeSockets } = await import('../server.js');
        const channelDetails = await Channel.findById(channel._id);
        const subs = channelDetails.subscribers || [];
        
        subs.forEach(subId => {
          const socketId = activeSockets.get(subId.toString());
          if (socketId) {
            io.to(socketId).emit('new-video', {
              videoId: video._id,
              videoTitle: video.title,
              channelName: channelDetails.name,
              channelId: channelDetails._id
            });
          }
        });
      } catch (wsError) {
        console.error('Socket notification broadcast failed:', wsError.message);
      }
    }

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Video Like
export const toggleLikeVideo = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    const likeIndex = user.likedVideos.indexOf(id);
    const dislikeIndex = user.dislikedVideos.indexOf(id);

    let isLiked = false;

    if (likeIndex === -1) {
      // Add like
      user.likedVideos.push(id);
      isLiked = true;
      // Remove dislike if present
      if (dislikeIndex !== -1) {
        user.dislikedVideos.splice(dislikeIndex, 1);
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          await Video.findByIdAndUpdate(id, { $inc: { dislikes: -1 } });
        }
      }
      // Increment likes count for local videos
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Video.findByIdAndUpdate(id, { $inc: { likes: 1 } });
      }
    } else {
      // Remove like
      user.likedVideos.splice(likeIndex, 1);
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Video.findByIdAndUpdate(id, { $inc: { likes: -1 } });
      }
    }

    await user.save();
    res.status(200).json({ isLiked, likedCount: user.likedVideos.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Video Dislike
export const toggleDislikeVideo = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    const likeIndex = user.likedVideos.indexOf(id);
    const dislikeIndex = user.dislikedVideos.indexOf(id);

    let isDisliked = false;

    if (dislikeIndex === -1) {
      // Add dislike
      user.dislikedVideos.push(id);
      isDisliked = true;
      // Remove like if present
      if (likeIndex !== -1) {
        user.likedVideos.splice(likeIndex, 1);
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          await Video.findByIdAndUpdate(id, { $inc: { likes: -1 } });
        }
      }
      // Increment dislikes count for local videos
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Video.findByIdAndUpdate(id, { $inc: { dislikes: 1 } });
      }
    } else {
      // Remove dislike
      user.dislikedVideos.splice(dislikeIndex, 1);
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Video.findByIdAndUpdate(id, { $inc: { dislikes: -1 } });
      }
    }

    await user.save();
    res.status(200).json({ isDisliked, dislikedCount: user.dislikedVideos.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Watch Later list
export const toggleWatchLater = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    const index = user.watchLater.indexOf(id);
    let isAdded = false;

    if (index === -1) {
      user.watchLater.push(id);
      isAdded = true;
    } else {
      user.watchLater.splice(index, 1);
    }

    await user.save();
    res.status(200).json({ isAdded, watchLaterList: user.watchLater });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Log video watch history
export const logHistory = async (req, res) => {
  const { videoId, progress } = req.body;
  const userId = req.user._id;

  if (!videoId) {
    return res.status(400).json({ message: 'Video ID is required' });
  }

  try {
    const user = await User.findById(userId);
    
    // Check if video is already in history, update it or push new entry
    const existingIndex = user.history.findIndex(h => h.videoId === videoId);

    if (existingIndex !== -1) {
      user.history[existingIndex].watchedAt = new Date();
      user.history[existingIndex].progress = progress || 0;
    } else {
      user.history.push({ videoId, progress: progress || 0 });
    }

    // Limit history length to 100 entries
    if (user.history.length > 100) {
      user.history.shift();
    }

    await user.save();
    res.status(200).json(user.history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync download record to user database list
export const syncDownload = async (req, res) => {
  const { videoId } = req.body;
  const userId = req.user._id;

  if (!videoId) {
    return res.status(400).json({ message: 'Video ID is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user.downloads.includes(videoId)) {
      user.downloads.push(videoId);
      await user.save();
    }
    res.status(200).json({ success: true, downloads: user.downloads });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove download record from user database list
export const unsyncDownload = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    user.downloads = user.downloads.filter(d => d !== id);
    await user.save();
    res.status(200).json({ success: true, downloads: user.downloads });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve synced downloads from DB (populates metadata details)
export const getSyncedDownloads = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    const downloadIds = user.downloads || [];
    
    // Split into local database IDs and YouTube IDs
    const localVideoIds = downloadIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/));
    const ytVideoIds = downloadIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));

    const localVids = await Video.find({ _id: { $in: localVideoIds } }).populate('channel');
    
    const ytVids = await Promise.all(ytVideoIds.map(async id => {
      try {
        const queryResult = await ytSearch({ videoId: id });
        if (queryResult) {
          return {
            _id: queryResult.videoId,
            title: queryResult.title,
            description: queryResult.description || `YouTube video`,
            videoUrl: queryResult.url,
            thumbnailUrl: queryResult.thumbnail || queryResult.image,
            duration: queryResult.seconds,
            views: queryResult.views || 100000,
            likes: Math.round((queryResult.views || 100000) * 0.05),
            isYouTubeVideo: true,
            youtubeVideoId: queryResult.videoId,
            youtubeChannelTitle: queryResult.author.name,
            youtubeChannelId: queryResult.author.url.split('/').pop() || queryResult.author.name,
            createdAt: queryResult.ago || 'Uploaded to YouTube'
          };
        }
      } catch (err) {}
      
      return {
        _id: id,
        title: 'Offline YouTube Video',
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        duration: 320,
        isYouTubeVideo: true,
        youtubeVideoId: id,
        youtubeChannelTitle: 'YouTube Creator',
        createdAt: 'Uploaded to YouTube'
      };
    }));

    const allDownloads = [
      ...localVids.map(v => ({
        _id: v._id,
        title: v.title,
        description: v.description,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration,
        views: v.views,
        likes: v.likes,
        channel: v.channel,
        isYouTubeVideo: false,
        location: v.location,
        createdAt: v.createdAt
      })),
      ...ytVids
    ];

    res.status(200).json(allDownloads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
