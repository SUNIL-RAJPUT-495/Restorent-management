import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    let categories = await Category.find({});
    if (categories.length === 0) {
      const defaults = ["Starters", "Main Course", "Drinks", "Desserts"];
      const created = await Category.insertMany(defaults.map(name => ({ name })));
      categories = created;
    }
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists (case-insensitive)
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ 
      name: name.trim(), 
      description: description ? description.trim() : '' 
    });
    const created = await category.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (category) {
      res.json({ message: 'Category deleted successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
