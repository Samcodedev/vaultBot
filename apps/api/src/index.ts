import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import prisma from './config/db.js';
import { cronService } from './services/index.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

app.get('/health', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({
      status: 'OK',
      databaseTime: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Health check failed: ${message}`);
    res.status(500).json({
      status: 'ERROR',
      error: 'Health check failed',
    });
  }
});

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully.');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      cronService.start();
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to start server due to database connection error: ${message}`);
    process.exit(1);
  }
};

startServer();
