import express from 'express';
import { createChannel, getChannel, updateChannel, toggleSubscribe } from '../controllers/channelController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createChannel);
router.get('/:idOrHandle', getChannel);
router.put('/', protect, updateChannel);
router.post('/:channelId/subscribe', protect, toggleSubscribe);

export default router;
