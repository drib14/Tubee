import Channel from '../models/Channel.js';
import User from '../models/User.js';

export const createChannel = async (req, res) => {
  const { name, handle, description, avatar, banner } = req.body;

  if (!name || !handle) {
    return res.status(400).json({ message: 'Channel name and handle are required' });
  }

  try {
    // Check if user already has a channel
    const user = await User.findById(req.user._id);
    if (user.channel) {
      return res.status(400).json({ message: 'User already has a channel registered' });
    }

    // Check if handle is taken
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const handleExists = await Channel.findOne({ handle: cleanHandle });
    if (handleExists) {
      return res.status(400).json({ message: 'Channel handle is already taken' });
    }

    const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%234E342E"/><circle cx="50" cy="50" r="24" fill="%23FFFFFF"/><polygon points="43,40 62,50 43,60" fill="%234E342E"/></svg>`;

    const channel = await Channel.create({
      name,
      handle: cleanHandle,
      description,
      avatar: avatar || req.user.avatar || defaultAvatar,
      banner: banner || 'gradient',
      owner: req.user._id
    });

    // Link channel to user
    user.channel = channel._id;
    await user.save();

    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChannel = async (req, res) => {
  const { idOrHandle } = req.params;

  try {
    let channel;
    // Check if idOrHandle is a valid ObjectId
    if (idOrHandle.match(/^[0-9a-fA-F]{24}$/)) {
      channel = await Channel.findById(idOrHandle).populate('owner', 'name email avatar');
    } else {
      channel = await Channel.findOne({ handle: idOrHandle.toLowerCase() }).populate('owner', 'name email avatar');
    }

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    res.status(200).json(channel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateChannel = async (req, res) => {
  const { name, description, avatar, banner, socials } = req.body;
  const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%234E342E"/><circle cx="50" cy="50" r="24" fill="%23FFFFFF"/><polygon points="43,40 62,50 43,60" fill="%234E342E"/></svg>`;

  try {
    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) {
      return res.status(404).json({ message: 'No channel found for this user' });
    }

    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    
    if (avatar === 'delete') {
      channel.avatar = defaultAvatar;
    } else if (avatar) {
      channel.avatar = avatar;
    }

    if (banner === 'delete') {
      channel.banner = 'gradient';
    } else if (banner) {
      channel.banner = banner;
    }

    if (socials) {
      channel.socials = {
        twitter: socials.twitter !== undefined ? socials.twitter : (channel.socials?.twitter || ''),
        instagram: socials.instagram !== undefined ? socials.instagram : (channel.socials?.instagram || ''),
        github: socials.github !== undefined ? socials.github : (channel.socials?.github || ''),
        website: socials.website !== undefined ? socials.website : (channel.socials?.website || '')
      };
    }

    await channel.save();
    res.status(200).json(channel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleSubscribe = async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (channel.owner.toString() === userId.toString()) {
      return res.status(400).json({ message: 'You cannot subscribe to your own channel' });
    }

    const index = channel.subscribers.indexOf(userId);
    let isSubscribed = false;

    if (index === -1) {
      // Subscribe
      channel.subscribers.push(userId);
      channel.subscribersCount += 1;
      isSubscribed = true;
    } else {
      // Unsubscribe
      channel.subscribers.splice(index, 1);
      channel.subscribersCount = Math.max(0, channel.subscribersCount - 1);
    }

    await channel.save();
    res.status(200).json({ subscribersCount: channel.subscribersCount, isSubscribed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch trending/popular channels (both local MERN channels and scraped YouTube channels)
export const getTrendingChannels = async (req, res) => {
  try {
    const { default: ytSearch } = await import('yt-search');
    
    // 1. Fetch local creator channels
    const localChannels = await Channel.find().limit(10);

    // 2. Fetch popular creators from YouTube search to seed rich data
    const popularQueries = [
      'Lofi Girl', 
      'MrBeast', 
      'Coffee Shop Music', 
      'Coding Beats', 
      'MKBHD', 
      'Lofi Records',
      'ChilledCow',
      'The Jazz Hop Cafe'
    ];
    
    const ytChannels = [];

    for (const query of popularQueries) {
      try {
        const searchResult = await ytSearch(query);
        if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
          const video = searchResult.videos[0];
          if (video.author) {
            const authorName = video.author.name;
            const authorUrl = video.author.url;
            const authorId = authorUrl.split('/').pop() || authorName;
            
            // Avoid duplicates
            if (!ytChannels.some(c => c._id === authorId) && !localChannels.some(c => c.handle === authorId.toLowerCase())) {
              ytChannels.push({
                _id: authorId,
                name: authorName,
                handle: authorId.toLowerCase(),
                avatar: video.author.image || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80`,
                banner: 'gradient',
                description: `YouTube Content Creator ${authorName}. Sync listing on Tubee.`,
                subscribersCount: '2.4M',
                isYouTubeChannel: true
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch channel details for query: ${query}`, err.message);
      }
    }

    const combined = [
      ...localChannels.map(c => ({
        _id: c._id.toString(),
        name: c.name,
        handle: c.handle,
        avatar: c.avatar,
        banner: c.banner,
        description: c.description || 'Tubee Content Creator Studio.',
        subscribersCount: `${c.subscribersCount || 0}`,
        isYouTubeChannel: false
      })),
      ...ytChannels
    ];

    // Pad to at least 20 channels if count is short
    const targetLength = 20;
    if (combined.length < targetLength) {
      const paddingNames = [
        'Coffee Beats', 'Code & Brew', 'Latte Sessions', 'Roaster Studio', 
        'Espresso Coding', 'Chai Lofi', 'Cappuccino Lofi', 'Mocha Coding', 
        'Brown Mug Beats', 'Brown Sugar Lofi', 'Steam & Stream', 'Aromas & Lofi',
        'Filter Coffee Beats', 'Macchiato Chill', 'Java Beats', 'Dark Roast Lofi'
      ];
      
      for (let i = 0; i < paddingNames.length && combined.length < targetLength; i++) {
        const name = paddingNames[i];
        const handle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Avoid duplicate handles
        if (!combined.some(c => c.handle === handle)) {
          combined.push({
            _id: `mock-channel-${handle}`,
            name,
            handle,
            avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23${(50 + i * 4).toString(16)}3B30"/><circle cx="50" cy="50" r="24" fill="%23FFFFFF"/><polygon points="43,40 62,50 43,60" fill="%23${(50 + i * 4).toString(16)}3B30"/></svg>`,
            banner: 'gradient',
            description: `Official playlist and beats by ${name}. Cozy streams inside Tubee.`,
            subscribersCount: `${Math.floor(Math.random() * 80) + 10}K`,
            isYouTubeChannel: true
          });
        }
      }
    }

    res.status(200).json(combined.slice(0, 24));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
