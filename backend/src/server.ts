import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://ai-travel-planner-xi-tawny.vercel.app'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Trao API is running' });
});

mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    });

export default app;