import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setHome } from './controllers/homeController';
import { connectRedis } from './redis';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.post('/set-home', setHome);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
