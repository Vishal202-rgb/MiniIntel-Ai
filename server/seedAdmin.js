require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('Error: ADMIN_PASSWORD environment variable is required.');
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ username: adminUsername });
    if (existingAdmin) {
      console.log(`Admin user '${adminUsername}' already exists.`);
      process.exit(0);
    }

    await User.create({
      username: adminUsername,
      password: adminPassword,
      role: 'admin'
    });

    console.log(`Admin user '${adminUsername}' created successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();
