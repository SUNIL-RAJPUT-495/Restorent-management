import Ingredient from '../models/Ingredient.js';

export const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({});
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addIngredient = async (req, res) => {
  try {
    const ingredient = new Ingredient(req.body);
    const createdIngredient = await ingredient.save();
    res.status(201).json(createdIngredient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (ingredient) {
      res.json(ingredient);
    } else {
      res.status(404).json({ message: 'Ingredient not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (ingredient) {
      res.json({ message: 'Ingredient deleted' });
    } else {
      res.status(404).json({ message: 'Ingredient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
