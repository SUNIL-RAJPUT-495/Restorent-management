import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', upload.single('logo'), updateSettings);

export default router;
