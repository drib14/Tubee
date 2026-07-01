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

    const channel = await Channel.create({
      name,
      handle: cleanHandle,
      description,
      avatar: avatar || req.user.avatar,
      banner: banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80', // Default coffee-styled brown gradient banner
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
  const { name, description, avatar, banner } = req.body;

  try {
    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) {
      return res.status(404).json({ message: 'No channel found for this user' });
    }

    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (avatar) channel.avatar = avatar;
    if (banner) channel.banner = banner;

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
