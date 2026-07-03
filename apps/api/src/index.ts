import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/db.js';
import logger from './utils/logger.js';
import apiRouter from './routers/index.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api', apiRouter);

app.get('/health', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({
      status: 'OK',
      databaseTime: result,
    });
  } catch (err: any) {
    logger.error(`Health check failed: ${err.message}`);
    res.status(500).json({
      status: 'ERROR',
      error: err.message,
    });
  }
});

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully.');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error(`Failed to start server due to database connection error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
