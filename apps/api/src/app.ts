import cors from 'cors';
import express from 'express';

import apiRouter from './routers/index.js';

const app = express();

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

export default app;
