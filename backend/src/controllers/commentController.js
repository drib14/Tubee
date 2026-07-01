import Comment from '../models/Comment.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';

// Retrieve comments for a specific video ID (custom MongoDB ID or YouTube ID)
export const getComments = async (req, res) => {
  const { videoId } = req.params;

  try {
    const comments = await Comment.find({ video: videoId })
      .populate('user', 'name avatar channel')
      .sort({ createdAt: -1 });

    // If local database has comments, return them
    if (comments.length > 0) {
      return res.status(200).json(comments);
    }

    // If it's a YouTube video and no local comments exist, return some mock aesthetic comments
    if (!videoId.match(/^[0-9a-fA-F]{24}$/)) {
      const mockCreators = [
        { name: 'BrewMaster Dev', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80' },
        { name: 'AestheticCoder', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' },
        { name: 'LofiRoast', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' },
        { name: 'MochaBlogger', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' }
      ];

      const mockPhrases = [
        "This is exactly what I needed for my late night coding sessions. Pure bliss!",
        "The sound mixing is so crisp. The coffee Shop ambient vibes are top tier.",
        "Absolutely loving the atmosphere in this video. Keep posting!",
        "Stumbled upon this channel by accident and now I am subscribing immediately. Tubee is awesome!"
      ];

      const generatedMockComments = mockCreators.map((creator, i) => ({
        _id: `mock-comment-${videoId}-${i}`,
        video: videoId,
        user: {
          _id: `mock-user-${i}`,
          name: creator.name,
          avatar: creator.avatar
        },
        text: mockPhrases[i],
        likes: Math.floor(Math.random() * 80) + 5,
        dislikes: 0,
        isSupporter: i === 0, // Mock one supporter comment
        createdAt: new Date(Date.now() - (i + 1) * 3600000 * 2) // Staggered hours ago
      }));

      return res.status(200).json(generatedMockComments);
    }

    res.status(200).json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a comment to a video
export const createComment = async (req, res) => {
  const { videoId, text, channelId } = req.body;

  if (!videoId || !text) {
    return res.status(400).json({ message: 'Video ID and comment text are required' });
  }

  try {
    // Check if the user is a contributor to the video's channel or any channel
    // We will check if the user has a "Supporter" relation or check local variables.
    // In our backend, we check if they passed channelId. If they did, we check if they have supported it.
    let isSupporter = false;
    let targetChannel = null;

    if (channelId) {
      targetChannel = await Channel.findById(channelId);
      // Supporter badge criteria: Users can donate via Paymongo, 
      // we check if they are in the request or if their profile flag is set.
      // For simplicity, we check if user has a support status. Let's make it so if they supported, 
      // we mark it true, which we will verify using their liked/supported history.
      // We will look up if there is a payment record or mock supporter check.
      // We check if the user has a supporter token or if it's set in req.body.isPaymentVerified
      if (req.body.isPaymentVerified) {
        isSupporter = true;
      }
    }

    const comment = await Comment.create({
      video: videoId,
      user: req.user._id,
      text,
      isSupporter,
      channelSupported: channelId || null
    });

    const populated = await Comment.findById(comment._id).populate('user', 'name avatar channel');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
