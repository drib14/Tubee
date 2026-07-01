import express from 'express';
import { 
  getHomeFeed, 
  searchVideos, 
  getVideoById, 
  createVideo, 
  toggleLikeVideo, 
  toggleDislikeVideo, 
  toggleWatchLater, 
  logHistory,
  getSyncedDownloads,
  syncDownload,
  unsyncDownload
} from '../controllers/videoController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getHomeFeed);
router.get('/search', searchVideos);
router.get('/downloads', protect, getSyncedDownloads);
router.post('/downloads', protect, syncDownload);
router.delete('/downloads/:id', protect, unsyncDownload);
router.get('/:id', getVideoById);
router.post('/', protect, createVideo);
router.post('/:id/like', protect, toggleLikeVideo);
router.post('/:id/dislike', protect, toggleDislikeVideo);
router.post('/:id/watch-later', protect, toggleWatchLater);
router.post('/history', protect, logHistory);

export default router;
