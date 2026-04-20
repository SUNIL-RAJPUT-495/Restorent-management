import express from 'express';
import { 
  loginAdmin, 
  seedAdmin, 
  getProfile, 
  updateProfile, 
  updatePassword, 
  registerStaff, 
  getAllStaff 
} from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/seed', seedAdmin);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, updatePassword);

// Staff management (Admin only)
router.post('/register-staff', protect, adminOnly, registerStaff);
router.get('/staff', protect, adminOnly, getAllStaff);

export default router;
