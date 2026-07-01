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

// Search videos - merges local uploads and YouTube search results
export const searchVideos = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    // 1. Search local channels
    const localChannels = await Channel.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { handle: { $regex: q, $options: 'i' } }
      ]
    });

    const formattedLocalChannels = localChannels.map(ch => ({
      _id: ch._id,
      type: 'channel',
      name: ch.name,
      handle: ch.handle,
      avatar: ch.avatar,
      description: ch.description || 'Tubee Content Creator',
      subscribersCount: `${ch.subscribersCount} subscribers`,
      isYouTubeChannel: false
    }));

    // 2. Search local videos
    const localVideos = await Video.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    }).populate('channel');

    const formattedLocal = localVideos.map(vid => ({
      _id: vid._id,
      type: 'video',
      title: vid.title,
      description: vid.description,
      videoUrl: vid.videoUrl,
      thumbnailUrl: vid.thumbnailUrl,
      duration: vid.duration,
      views: vid.views,
      likes: vid.likes,
      dislikes: vid.dislikes,
      category: vid.category,
      channel: vid.channel,
      isYouTubeVideo: false,
      location: vid.location,
      createdAt: vid.createdAt
    }));

    // 3. Search YouTube
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
        youtubeSubscribersCount: `${getDeterministicSubs(v.author.name)} subscribers`,
        createdAt: v.ago || 'Uploaded recently'
      }));
    } catch (e) {
      console.error('YouTube search failed:', e.message);
    }

    // Merge lists (channels first, local items prioritized)
    const results = [
      ...formattedLocalChannels,
      ...ytChannels,
      ...formattedLocal,
      ...ytResults
    ];
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feed for home screen - merges local content and dynamic aesthetic/programming YouTube content
export const getHomeFeed = async (req, res) => {
  try {
    // 1. Retrieve all local uploads
    const localVideos = await Video.find().populate('channel').sort({ createdAt: -1 });
    const formattedLocal = localVideos.map(vid => ({
      _id: vid._id,
      title: vid.title,
      description: vid.description,
      videoUrl: vid.videoUrl,
      thumbnailUrl: vid.thumbnailUrl,
      duration: vid.duration,
      views: vid.views,
      likes: vid.likes,
      dislikes: vid.dislikes,
      category: vid.category,
      channel: vid.channel,
      isYouTubeVideo: false,
      location: vid.location,
      createdAt: vid.createdAt
    }));

    // 2. Fetch default trending video topics (Lofi coding, tech, coffee)
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
        createdAt: v.ago || '1 year ago'
      }));
    } catch (e) {
      console.error('YouTube home feed fetch failed:', e.message);
    }

    // Merge and shuffle slightly
    const blendedFeed = [...formattedLocal, ...ytFeed];
    res.status(200).json(blendedFeed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single video by ID (can be custom DB object ID or YouTube video ID)
export const getVideoById = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if ID is a Mongo object ID
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      const localVid = await Video.findById(id).populate('channel');
      if (!localVid) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      // Increment local views
      localVid.views += 1;
      await localVid.save();
      
      return res.status(200).json({
        _id: localVid._id,
        title: localVid.title,
        description: localVid.description,
        videoUrl: localVid.videoUrl,
        thumbnailUrl: localVid.thumbnailUrl,
        duration: localVid.duration,
        views: localVid.views,
        likes: localVid.likes,
        dislikes: localVid.dislikes,
        category: localVid.category,
        channel: localVid.channel,
        isYouTubeVideo: false,
        location: localVid.location,
        createdAt: localVid.createdAt
      });
    } else {
      // Fetch single video metadata from YouTube search
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
      category: category || 'General',
      tags: tags || [],
      channel: channel._id,
      isYouTubeVideo: false,
      location: location || null
    });

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
