import express from 'express';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/add', upload.single('image'), addProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
