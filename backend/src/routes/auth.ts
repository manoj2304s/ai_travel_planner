import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'Email already registered' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, passwordHash });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;