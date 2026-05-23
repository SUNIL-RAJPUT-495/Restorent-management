import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const normalizeBoolean = (value) => {
  return value === true || value === "true";
};

export const addProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      available: req.body.available !== undefined ? normalizeBoolean(req.body.available) : true,
    };
    
    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }

    if (typeof productData.recipe === 'string') {
      try {
        productData.recipe = JSON.parse(productData.recipe);
      } catch (e) {
        console.error("Failed to parse recipe JSON:", e);
      }
    }

    const product = new Product(productData);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.available !== undefined) {
      updateData.available = normalizeBoolean(updateData.available);
    }
    
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    if (typeof updateData.recipe === 'string') {
      try {
        updateData.recipe = JSON.parse(updateData.recipe);
      } catch (e) {
        console.error("Failed to parse recipe JSON:", e);
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product) {
      res.json({ message: 'Product deleted' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
