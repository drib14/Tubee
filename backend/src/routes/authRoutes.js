import express from 'express';
import { googleLogin, refreshToken, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/google', googleLogin);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);

export default router;
