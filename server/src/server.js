import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { setupRecurringJobs } from './jobs/recurringJobs.js';

const startServer = async () => {
  try {
    await connectDB();
    setupRecurringJobs();
    app.listen(env.PORT, () => {
      console.log(`SpendWise server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
