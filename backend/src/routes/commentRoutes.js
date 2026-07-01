import express from 'express';
import { getComments, createComment } from '../controllers/commentController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/:videoId', getComments);
router.post('/', protect, createComment);

export default router;
