import express from 'express';

const router = express.Router();

import authController from '../controllers/authController.js';
import protect from '../middleware/auth.js';

router.post('/register',authController.register);

router.post('/login', authController.login);

router.post('/refresh', authController.refreshToken);

router.post('/logout', protect, authController.logout);

router.get('/profile', protect, authController.getProfile);

export default router;
