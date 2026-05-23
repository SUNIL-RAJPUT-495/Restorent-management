import Setting from '../models/Setting.js';
import Admin from '../models/Admin.js';

// GET /api/settings — fetch the one-and-only settings document
export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    
    // If no settings, create them
    if (!settings) {
      settings = new Setting({});
    }

    // Migration logic: If settings are empty, try to pull from Admin (fallback for split)
    if (!settings.restaurantName || !settings.phone) {
      const admin = await Admin.findOne({ role: 'admin' });
      if (admin) {
        if (!settings.restaurantName) settings.restaurantName = admin.name || '';
        if (!settings.location) settings.location = admin.location || '';
        if (!settings.description) settings.description = admin.description || '';
        if (!settings.logo) settings.logo = admin.logo || '';
        if (!settings.phone) settings.phone = admin.phone || '';
        if (!settings.gstNo) settings.gstNo = admin.gstNo || '';
        if (!settings.fssaiNo) settings.fssaiNo = admin.fssaiNo || '';
        if (settings.cgst === 2.5 && admin.cgst !== undefined) settings.cgst = admin.cgst;
        if (settings.sgst === 2.5 && admin.sgst !== undefined) settings.sgst = admin.sgst;
        await settings.save();
      }
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings — update the settings document
export const updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    const settingsData = { ...req.body };

    if (req.file) {
      settingsData.logo = `/uploads/${req.file.filename}`;
    }

    // Cast cgst and sgst from string to Number if present
    if (settingsData.cgst !== undefined) {
      settingsData.cgst = parseFloat(settingsData.cgst) || 0;
    }
    if (settingsData.sgst !== undefined) {
      settingsData.sgst = parseFloat(settingsData.sgst) || 0;
    }

    if (!settings) {
      settings = new Setting(settingsData);
    } else {
      Object.assign(settings, settingsData);
    }
    const saved = await settings.save();
    res.json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
