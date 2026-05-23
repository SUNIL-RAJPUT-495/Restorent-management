import Product from '../models/Product.js';
import { getFullImageUrl, deleteImageFile } from '../utils/imageUrl.js';

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    const formatted = products.map(p => {
      const doc = p.toObject();
      doc.image = getFullImageUrl(req, doc.image);
      return doc;
    });
    res.json(formatted);
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
    const doc = createdProduct.toObject();
    doc.image = getFullImageUrl(req, doc.image);
    res.status(201).json(doc);
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
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.image) {
        deleteImageFile(oldProduct.image);
      }
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
      const doc = product.toObject();
      doc.image = getFullImageUrl(req, doc.image);
      res.json(doc);
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
      if (product.image) {
        deleteImageFile(product.image);
      }
      res.json({ message: 'Product deleted' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
