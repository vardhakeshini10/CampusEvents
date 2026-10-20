
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = 'admin@campusevents.com';
    const password = 'AdminDemo123';

    let admin = await User.findOne({ email });

    if (admin) {
      admin.role = 'admin';
      admin.password = await bcrypt.hash(password, 10);
      await admin.save();
      console.log('Existing account updated to admin.');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      admin = await User.create({
        name: 'CampusEvents Admin',
        email,
        password: hashedPassword,
        role: 'admin'
      });

      console.log('Admin account created successfully.');
    }

    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Admin setup failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
