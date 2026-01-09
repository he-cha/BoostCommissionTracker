import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const seedUser = async () => {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const username = 'Catina';
  const password = 'Courtyard2001$';
  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ username });
  if (!existing) {
    await User.create({ username, password: hashedPassword });
    console.log('User seeded');
  } else {
    console.log('User already exists');
  }
  mongoose.disconnect();
};

seedUser();
