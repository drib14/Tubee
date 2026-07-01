import express from 'express';
import { getTrendingChannels, toggleSubscribe, getChannelDetail } from '../controllers/channelController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/trending', getTrendingChannels);
router.get('/:idOrHandle', getChannelDetail);
router.post('/:channelId/subscribe', protect, toggleSubscribe);

export default router;
