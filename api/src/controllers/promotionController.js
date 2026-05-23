import PromoBanner from '../models/PromoBanner.js';

const normalizeBoolean = (value) => {
  return value === true || value === "true";
};

export const getPromotions = async (req, res) => {
  try {
    const promos = await PromoBanner.find({}).populate('productId');
    res.json(promos);
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
    
    res.status(201).json(populated);
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
      res.json(promo);
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
      res.json({ message: 'Promotion deleted' });
    } else {
      res.status(404).json({ message: 'Promotion not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
