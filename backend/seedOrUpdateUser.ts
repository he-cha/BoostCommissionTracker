import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const seedOrUpdateUser = async () => {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to DB:', mongoose.connection.name);
  const username = 'Catina';
  const password = 'Courtyard2001$';
  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ username });
  if (!existing) {
    await User.create({ username, password: hashedPassword });
    console.log('User seeded');
  } else {
    existing.password = hashedPassword;
    await existing.save();
    console.log('User password updated');
  }
  mongoose.disconnect();
};

seedOrUpdateUser();
