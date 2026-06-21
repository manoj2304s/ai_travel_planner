import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity {
    id: string;
    description: string;
}

export interface IItineraryDay {
    day: number;
    activities: IActivity[];
}

export interface IBudgetEstimate {
    flights: number;
    accommodation: number;
    food: number;
    activities: number;
    total: number;
}

export interface IHotel {
    name: string;
    tier: 'Budget' | 'Mid Range' | 'Luxury';
}

export interface ITrip extends Document {
    userId: mongoose.Types.ObjectId;
    destination: string;
    days: number;
    budget: 'Low' | 'Medium' | 'High';
    interests: string[];
    itinerary: IItineraryDay[];
    budgetEstimate: IBudgetEstimate;
    hotels: IHotel[];
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
    id: { type: String, required: true },
    description: { type: String, required: true },
});

const ItineraryDaySchema = new Schema<IItineraryDay>({
    day: { type: Number, required: true },
    activities: [ActivitySchema],
});

const BudgetEstimateSchema = new Schema<IBudgetEstimate>({
    flights: { type: Number, required: true },
    accommodation: { type: Number, required: true },
    food: { type: Number, required: true },
    activities: { type: Number, required: true },
    total: { type: Number, required: true },
});

const HotelSchema = new Schema<IHotel>({
    name: { type: String, required: true },
    tier: { type: String, enum: ['Budget', 'Mid Range', 'Luxury'], required: true },
});

const TripSchema = new Schema<ITrip>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        destination: { type: String, required: true, trim: true },
        days: { type: Number, required: true, min: 1, max: 30 },
        budget: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
        interests: [{ type: String }],
        itinerary: [ItineraryDaySchema],
        budgetEstimate: BudgetEstimateSchema,
        hotels: [HotelSchema],
    },
    { timestamps: true }
);

export default mongoose.model<ITrip>('Trip', TripSchema);