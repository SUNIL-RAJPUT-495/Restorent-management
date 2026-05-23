import express from 'express';
import { getPromotions, addPromotion, updatePromotion, deletePromotion } from '../controllers/promotionController.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/', getPromotions);
router.post('/add', upload.single('image'), addPromotion);
router.put('/:id', upload.single('image'), updatePromotion);
router.delete('/:id', deletePromotion);

export default router;
