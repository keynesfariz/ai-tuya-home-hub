import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setHome } from './controllers/homeController';
import { connectRedis } from './redis';
import { requireAuth } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check (unprotected)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth middleware for all subsequent routes
app.use(requireAuth);

// Protected routes
app.post('/set-home', setHome);

const startServer = async () => {
  try {
    await connectRedis();
    app.listen(port, () => {
      console.log(`Tuya AI Home Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
