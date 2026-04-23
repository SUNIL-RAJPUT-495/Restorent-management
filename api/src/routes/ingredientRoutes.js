import express from 'express';
import {
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient
} from '../controllers/ingredientController.js';

const router = express.Router();

router.get('/', getIngredients);
router.post('/add', addIngredient);
router.put('/:id', updateIngredient);
router.delete('/:id', deleteIngredient);

export default router;
