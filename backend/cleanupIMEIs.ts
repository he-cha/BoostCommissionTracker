import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import CommissionRecord from './src/models/CommissionRecord';

async function cleanupIMEIs() {
  await mongoose.connect(process.env.MONGO_URI || '', { dbName: process.env.DB_NAME });
  const now = new Date();
  // Find all IMEIs with 6 paid months
  const imeiGroups = await CommissionRecord.aggregate([
    { $match: { monthNumber: { $in: [1,2,3,4,5,6] }, paymentReceived: true } },
    { $group: {
      _id: '$imei',
      monthsPaid: { $addToSet: '$monthNumber' },
      lastMonth6Date: {
        $max: {
          $cond: [ { $eq: ['$monthNumber', 6] }, '$paymentDate', null ]
        }
      }
    }},
    { $match: { 'monthsPaid': { $size: 6 }, lastMonth6Date: { $ne: null } } }
  ]);

  let deletedCount = 0;
  for (const group of imeiGroups) {
    const lastPaid = new Date(group.lastMonth6Date);
    if (now.getTime() - lastPaid.getTime() > 90 * 24 * 60 * 60 * 1000) {
      await CommissionRecord.deleteMany({ imei: group._id });
      deletedCount++;
      console.log(`Deleted IMEI ${group._id} (all 6 months paid, last paid: ${lastPaid.toISOString()})`);
    }
  }
  console.log(`Cleanup complete. Deleted ${deletedCount} IMEIs.`);
  await mongoose.disconnect();
}

cleanupIMEIs().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
