import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Product from './src/models/Product.js';
import PromoBanner from './src/models/PromoBanner.js';

dotenv.config();

const seedPromoBanner = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Path to the generated image
    const imagePath = 'C:\\Users\\sunil shekhawat\\.gemini\\antigravity-ide\\brain\\ffdf069b-4164-4141-bebb-16db21e65c8a\\pizza_promo_banner_1779464007994.png';
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found at path: ${imagePath}`);
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    console.log('Image successfully converted to Base64 (length:', base64Image.length, ')');

    // Find Margherita Pizza product
    let pizza = await Product.findOne({ name: 'Margherita Pizza' });
    if (!pizza) {
      console.log('Margherita Pizza product not found in database. Creating a new one...');
      pizza = await Product.create({
        name: 'Margherita Pizza',
        category: 'Main Course',
        price: 14.0,
        cost: 4.2,
        available: true
      });
      console.log('Created Margherita Pizza with ID:', pizza._id);
    } else {
      console.log('Found Margherita Pizza with ID:', pizza._id);
    }

    // Remove any existing banners for this pizza to avoid duplicates
    const deleteResult = await PromoBanner.deleteMany({ productId: pizza._id });
    console.log(`Deleted ${deleteResult.deletedCount} existing promo banner(s) for Margherita Pizza.`);

    // Create the new promo banner
    const promoBanner = await PromoBanner.create({
      image: base64Image,
      productId: pizza._id,
      title: 'FLAT 50% OFF',
      description: 'On delicious Margherita Pizza today!',
      active: true,
    });

    console.log('Successfully seeded 50% OFF Margherita Pizza Promotion Banner!');
    console.log('Banner Details:', {
      id: promoBanner._id,
      title: promoBanner.title,
      productId: promoBanner.productId,
      active: promoBanner.active
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding promotion banner:', error);
    process.exit(1);
  }
};

seedPromoBanner();
