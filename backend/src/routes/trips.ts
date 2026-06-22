import { Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Trip from '../models/Trip';
import {
  buildTripPrompt,
  buildRegenerateDayPrompt,
  callGemini,
  parseLLMResponse,
  LLMTripResponse,
  LLMRegenerateDayResponse,
} from '../services/llm';
import verifyToken, { AuthRequest } from '../middleware/verifyToken';

const router = Router();

// All trip routes are protected
router.use(verifyToken);

// GET /api/trips — get all trips for logged in user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trips = await Trip.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.status(200).json({ trips });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/trips/:id — get single trip
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }
    res.status(200).json({ trip });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/trips — create new trip + generate itinerary
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { destination, days, budget, interests } = req.body;

    if (!destination || !days || !budget || !interests) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const prompt = buildTripPrompt({ destination, days, budget, interests });
    const raw = await callGemini(prompt);
    const parsed = parseLLMResponse<LLMTripResponse>(raw);

    const trip = await Trip.create({
      userId: req.user!.id,
      destination,
      days,
      budget,
      interests,
      itinerary: parsed.itinerary,
      budgetEstimate: parsed.budget,
      hotels: parsed.hotels,
    });

    res.status(201).json({ trip });
  } catch (err) {
    console.error('Trip creation error:', err);
    res.status(500).json({ message: 'Failed to generate itinerary' });
  }
});

// PATCH /api/trips/:id/day/:dayNum — add or remove activity on a day
router.patch('/:id/day/:dayNum', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    const dayNum = parseInt(Array.isArray(req.params.dayNum) ? req.params.dayNum[0] : req.params.dayNum);
    const { action, activityDescription, activityId } = req.body;

    const dayIndex = trip.itinerary.findIndex((d) => d.day === dayNum);
    if (dayIndex === -1) {
      res.status(404).json({ message: 'Day not found' });
      return;
    }

    if (action === 'add') {
      trip.itinerary[dayIndex].activities.push({
        id: uuidv4(),
        description: activityDescription,
      });
    } else if (action === 'remove') {
      trip.itinerary[dayIndex].activities = trip.itinerary[dayIndex].activities.filter(
        (a) => a.id !== activityId
      );
    } else {
      res.status(400).json({ message: 'action must be add or remove' });
      return;
    }

    await trip.save();
    res.status(200).json({ trip });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/trips/:id/regenerate-day — regenerate a specific day with context awareness
router.post('/:id/regenerate-day', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    const { dayNum, instruction } = req.body;
    if (!dayNum || !instruction) {
      res.status(400).json({ message: 'dayNum and instruction are required' });
      return;
    }

    const dayIndex = trip.itinerary.findIndex((d) => d.day === dayNum);
    if (dayIndex === -1) {
      res.status(404).json({ message: 'Day not found' });
      return;
    }

    const prompt = buildRegenerateDayPrompt(
      {
        destination: trip.destination,
        days: trip.days,
        budget: trip.budget,
        interests: trip.interests,
      },
      dayNum,
      instruction,
      trip.itinerary.map((d) => ({
        day: d.day,
        activities: d.activities.map((a) => ({ id: a.id, description: a.description })),
      }))
    );

    const raw = await callGemini(prompt);
    const parsed = parseLLMResponse<LLMRegenerateDayResponse>(raw);

    trip.itinerary[dayIndex].activities = parsed.activities;
    await trip.save();

    res.status(200).json({ trip });
  } catch (err) {
    console.error('Regenerate day error:', err);
    res.status(500).json({ message: 'Failed to regenerate day' });
  }
});

// DELETE /api/trips/:id — delete a trip
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }
    res.status(200).json({ message: 'Trip deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;