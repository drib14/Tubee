import ytSearch from 'yt-search';
import User from '../models/User.js';

// Helper to generate deterministic subscriber count based on channel name
const getDeterministicSubs = (name) => {
  if (!name) return '150K';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const value = Math.abs(hash % 980) + 15;
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

    const results = [...ytChannels, ...ytResults];
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
      ytFeed = r.videos.slice(0, 24).map(v => ({
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

// Get Shorts vertical video feeds
export const getShorts = async (req, res) => {
  try {
    let ytShorts = [];
    try {
      const r = await ytSearch('#shorts coding lofi');
      ytShorts = r.videos
        .filter(v => v.seconds <= 65)
        .slice(0, 16)
        .map(v => ({
          _id: v.videoId,
          title: v.title,
          videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
          thumbnailUrl: v.thumbnail || v.image,
          duration: v.seconds,
          views: v.views || 25000,
          likes: Math.round((v.views || 25000) * 0.08),
          dislikes: 0,
          isYouTubeVideo: true,
          youtubeVideoId: v.videoId,
          youtubeChannelTitle: v.author.name,
          youtubeChannelId: v.author.url.split('/').pop() || v.author.name,
          youtubeChannelAvatar: v.author.image || '',
          createdAt: v.ago || 'Uploaded recently'
        }));
    } catch (e) {
      console.error('YouTube shorts fetch failed:', e.message);
    }

    res.status(200).json(ytShorts);
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
        youtubeChannelTitle: 'YouTube Creator',
        youtubeChannelId: 'youtube',
        createdAt: 'Recently'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle like for watch history bookmarks
export const toggleLikeVideo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { id } = req.params;

    const likedIndex = user.likedVideos.indexOf(id);
    if (likedIndex === -1) {
      user.likedVideos.push(id);
      // Remove from dislikes if present
      const dislikedIndex = user.dislikedVideos.indexOf(id);
      if (dislikedIndex !== -1) user.dislikedVideos.splice(dislikedIndex, 1);
    } else {
      user.likedVideos.splice(likedIndex, 1);
    }

    await user.save();
    res.status(200).json({ likedVideos: user.likedVideos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle dislike
export const toggleDislikeVideo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { id } = req.params;

    const dislikedIndex = user.dislikedVideos.indexOf(id);
    if (dislikedIndex === -1) {
      user.dislikedVideos.push(id);
      // Remove from likes if present
      const likedIndex = user.likedVideos.indexOf(id);
      if (likedIndex !== -1) user.likedVideos.splice(likedIndex, 1);
    } else {
      user.dislikedVideos.splice(dislikedIndex, 1);
    }

    await user.save();
    res.status(200).json({ dislikedVideos: user.dislikedVideos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle watch later
export const toggleWatchLater = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { id } = req.params;

    const idx = user.watchLater.indexOf(id);
    if (idx === -1) {
      user.watchLater.push(id);
    } else {
      user.watchLater.splice(idx, 1);
    }

    await user.save();
    res.status(200).json({ watchLater: user.watchLater });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
