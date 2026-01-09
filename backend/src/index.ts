
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';

// Load environment variables from .env file
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());


import commissionRoutes from './routes/commissionRoutes';
import authRoutes from './routes/authRoutes';
app.use('/api/commissions', commissionRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Backend is running!' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
