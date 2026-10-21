import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { connectDB } from './db';
import { getJWTSecret } from './middleware/auth';
import { runBackfillExistingMonthNumbers } from './controllers/commissionController';
import { cleanupIMEIsBackground } from './cleanupIMEIsBackground';

getJWTSecret(); // Fail before opening a port when authentication is misconfigured.
const PORT = process.env.PORT || 5000;
connectDB().then(async () => {
  if (process.env.RUN_MAINTENANCE_JOBS === 'true') {
    await runBackfillExistingMonthNumbers();
    await cleanupIMEIsBackground();
    setInterval(() => cleanupIMEIsBackground().catch(err => console.error('Cleanup failed', err)), 86400000);
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(() => { console.error('Backend startup failed'); process.exitCode = 1; });
