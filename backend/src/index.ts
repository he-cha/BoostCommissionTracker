
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';

// Load environment variables from .env file
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



import commissionRoutes from './routes/commissionRoutes';
import authRoutes from './routes/authRoutes';
import uploadedFileRoutes from './routes/uploadedFileRoutes';
app.use('/api/commissions', commissionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/uploaded-files', uploadedFileRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Backend is running!' });
});


const PORT = process.env.PORT || 5000;

import { cleanupIMEIsBackground } from './cleanupIMEIsBackground';

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Run cleanup job every 24 hours
    setInterval(() => {
      cleanupIMEIsBackground().catch(err => console.error('[CLEANUP ERROR]', err));
    }, 24 * 60 * 60 * 1000);
    // Optionally, run once at startup
    cleanupIMEIsBackground().catch(err => console.error('[CLEANUP ERROR]', err));
  });
});
