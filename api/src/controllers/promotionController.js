import PromoBanner from '../models/PromoBanner.js';
import { getFullImageUrl, deleteImageFile } from '../utils/imageUrl.js';

const normalizeBoolean = (value) => {
  return value === true || value === "true";
};

export const getPromotions = async (req, res) => {
  try {
    const promos = await PromoBanner.find({}).populate('productId');
    const formatted = promos.map(p => {
      const doc = p.toObject();
      doc.image = getFullImageUrl(req, doc.image);
      if (doc.productId && doc.productId.image) {
        doc.productId.image = getFullImageUrl(req, doc.productId.image);
      }
      return doc;
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addPromotion = async (req, res) => {
  try {
    const { productId, title, description, active } = req.body;
    
    const promoData = {
      image: req.body.image || '',
      title: title || '',
      description: description || '',
      active: active !== undefined ? normalizeBoolean(active) : true,
    };

    if (req.file) {
      promoData.image = `/uploads/${req.file.filename}`;
    }

    if (productId && productId !== 'none' && productId !== '') {
      promoData.productId = productId;
    }

    const promo = new PromoBanner(promoData);
    const created = await promo.save();
    
    // Return the created promo populated if it has a productId
    let populated = created;
    if (created.productId) {
      populated = await PromoBanner.findById(created._id).populate('productId');
    }
    
    const doc = populated.toObject();
    doc.image = getFullImageUrl(req, doc.image);
    if (doc.productId && doc.productId.image) {
      doc.productId.image = getFullImageUrl(req, doc.productId.image);
    }
    
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { image, productId, title, description, active } = req.body;
    
    const updateData = {};
    if (image !== undefined) updateData.image = image;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (active !== undefined) updateData.active = normalizeBoolean(active);
    
    if (req.file) {
      const oldPromo = await PromoBanner.findById(req.params.id);
      if (oldPromo && oldPromo.image) {
        deleteImageFile(oldPromo.image);
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    if (productId !== undefined) {
      if (productId === 'none' || productId === '') {
        updateData.$unset = { productId: 1 };
      } else {
        updateData.productId = productId;
      }
    }

    // Handing both normal updates and unset updates
    let promo;
    if (updateData.$unset) {
      // First do the unset
      await PromoBanner.findByIdAndUpdate(req.params.id, { $unset: updateData.$unset });
      delete updateData.$unset;
    }
    
    promo = await PromoBanner.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('productId');
    
    if (promo) {
      const doc = promo.toObject();
      doc.image = getFullImageUrl(req, doc.image);
      if (doc.productId && doc.productId.image) {
        doc.productId.image = getFullImageUrl(req, doc.productId.image);
      }
      res.json(doc);
    } else {
      res.status(404).json({ message: 'Promotion not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const promo = await PromoBanner.findByIdAndDelete(req.params.id);
    if (promo) {
      if (promo.image) {
        deleteImageFile(promo.image);
      }
      res.json({ message: 'Promotion deleted' });
    } else {
      res.status(404).json({ message: 'Promotion not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
