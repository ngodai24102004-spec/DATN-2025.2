import express from 'express';
import { AuthController } from '../modules/auth/auth.controller.js';

const router = express.Router();

router.post('/register', AuthController.registerWithBuilding);
router.post('/login', AuthController.login);

export default router;