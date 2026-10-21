import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));



import commissionRoutes from './routes/commissionRoutes';
import authRoutes from './routes/authRoutes';
import uploadedFileRoutes from './routes/uploadedFileRoutes';
app.use('/api/commissions', commissionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/uploaded-files', uploadedFileRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Backend is running!' });
});



export default app;
