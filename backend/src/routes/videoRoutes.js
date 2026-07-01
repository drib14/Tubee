import express from 'express';
import { getHomeFeed, getVideoById, searchVideos, getShorts, toggleLikeVideo, toggleDislikeVideo, toggleWatchLater } from '../controllers/videoController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/feed', getHomeFeed);
router.get('/shorts', getShorts);
router.get('/search', searchVideos);
router.get('/:id', getVideoById);
router.post('/:id/like', protect, toggleLikeVideo);
router.post('/:id/dislike', protect, toggleDislikeVideo);
router.post('/:id/watchlater', protect, toggleWatchLater);

export default router;
