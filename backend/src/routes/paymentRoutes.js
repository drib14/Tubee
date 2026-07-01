import express from 'express';
import { createCheckoutSession, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/checkout', protect, createCheckoutSession);
router.get('/verify/:sessionId', verifyPayment);

export default router;
