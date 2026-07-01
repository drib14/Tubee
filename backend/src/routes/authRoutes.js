import express from 'express';
import { googleLogin, refreshToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/google', googleLogin);
router.post('/refresh', refreshToken);

export default router;
