import express from 'express';
import { AuthController } from '../modules/auth/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', verifyToken, AuthController.getProfile);

export default router;