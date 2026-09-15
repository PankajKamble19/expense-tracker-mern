import express from 'express';
import { login, logout, register, getCurrentUser, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getCurrentUser);
router.post('/change-password', protect, changePassword);

export default router;
