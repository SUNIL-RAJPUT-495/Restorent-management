import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from './src/models/Admin.js';
import Product from './src/models/Product.js';
import Table from './src/models/Table.js';
import Ingredient from './src/models/Ingredient.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing
    await Admin.deleteMany();
    await Product.deleteMany();
    await Table.deleteMany();
    await Ingredient.deleteMany();
    
    // Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Admin seeded: admin@gmail.com / admin123');

    // Ingredients
    const ingredients = [
      { name: 'Mozzarella Cheese', unit: 'kg', stock: 18, threshold: 25, costPerUnit: 9.5, supplier: 'SafeDairy' },
      { name: 'Tomato Sauce', unit: 'L', stock: 64, threshold: 20, costPerUnit: 3.2, supplier: 'FreshFarms' },
      { name: 'Truffle Oil', unit: 'L', stock: 4, threshold: 5, costPerUnit: 48, supplier: 'GourmetEU' },
      { name: 'Pasta (Dry)', unit: 'kg', stock: 42, threshold: 15, costPerUnit: 2.8, supplier: 'ItaliaSrl' },
    ];
    const createdIngredients = await Ingredient.insertMany(ingredients);
    console.log('Ingredients seeded');

    // Products
    const products = [
      { 
        name: 'Margherita Pizza', 
        category: 'Main Course', 
        price: 14.0, 
        cost: 4.2, 
        recipe: [
          { ingredientId: createdIngredients[0]._id, quantity: 0.15 },
          { ingredientId: createdIngredients[1]._id, quantity: 0.1 }
        ] 
      },
      { name: 'Iced Latte', category: 'Drinks', price: 5.0, cost: 1.5 },
      { name: 'Garlic Bread', category: 'Starters', price: 6.0, cost: 2.0 },
      { name: 'Chocolate Brownie', category: 'Desserts', price: 8.0, cost: 3.0 },
    ];
    await Product.insertMany(products);
    console.log('Products seeded');

    // Tables
    const tables = [
      { number: '1', status: 'vacant', capacity: 2 },
      { number: '2', status: 'vacant', capacity: 4 },
      { number: '3', status: 'occupied', capacity: 4, guests: 3, occupiedSince: new Date() },
      { number: '4', status: 'vacant', capacity: 6 },
      { number: '5', status: 'vacant', capacity: 4 },
    ];
    await Table.insertMany(tables);
    console.log('Tables seeded');

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
