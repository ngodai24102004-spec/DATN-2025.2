import express from 'express';
import { AuthController } from '../modules/auth/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/request-register', AuthController.requestRegistration);
router.post('/send-otp', AuthController.sendOtp);
router.post('/handle-approval', verifyToken, AuthController.handleApproval);
router.get('/pending-users', verifyToken, AuthController.getPendingUsers);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.put('/users/:id/lock', verifyToken, AuthController.toggleLockStatus);
router.get('/profile', verifyToken, AuthController.getProfile);
router.put('/profile/name', verifyToken, AuthController.updateProfileName);
router.put('/change-password', verifyToken, AuthController.changePassword);
router.get('/building-admins', verifyToken, AuthController.getBuildingAdmins);
router.delete('/users/:id', verifyToken, AuthController.deleteUser);
router.put('/users/:id', verifyToken, AuthController.updateUserByAdmin);
router.post('/add-manager', verifyToken, AuthController.addManagerToBuilding);


export default router;