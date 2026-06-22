'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';

interface Activity {
  id: string;
  description: string;
  _id: string;
}

interface ItineraryDay {
  day: number;
  activities: Activity[];
  _id: string;
}

interface BudgetEstimate {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
}

interface Hotel {
  name: string;
  tier: 'Budget' | 'Mid Range' | 'Luxury';
  _id: string;
}

interface Trip {
  _id: string;
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  itinerary: ItineraryDay[];
  budgetEstimate: BudgetEstimate;
  hotels: Hotel[];
  createdAt: string;
}

const tierColor: Record<string, string> = {
  Budget: 'text-green-400 bg-green-400/10 border-green-400/20',
  'Mid Range': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Luxury: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

export default function TripPage() {
  const { id } = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [newActivity, setNewActivity] = useState<Record<number, string>>({});
  const [regenerating, setRegenerating] = useState<number | null>(null);
  const [regenInstruction, setRegenInstruction] = useState<Record<number, string>>({});
  const [showRegenInput, setShowRegenInput] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const res = await api.get(`/trips/${id}`);
      setTrip(res.data.trip);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (dayNum: number) => {
    const description = newActivity[dayNum]?.trim();
    if (!description) return;

    try {
      const res = await api.patch(`/trips/${id}/day/${dayNum}`, {
        action: 'add',
        activityDescription: description,
      });
      setTrip(res.data.trip);
      setNewActivity((prev) => ({ ...prev, [dayNum]: '' }));
    } catch {
      alert('Failed to add activity');
    }
  };

  const handleRemoveActivity = async (dayNum: number, activityId: string) => {
    try {
      const res = await api.patch(`/trips/${id}/day/${dayNum}`, {
        action: 'remove',
        activityId,
      });
      setTrip(res.data.trip);
    } catch {
      alert('Failed to remove activity');
    }
  };

  const handleRegenerateDay = async (dayNum: number) => {
    const instruction = regenInstruction[dayNum]?.trim();
    if (!instruction) return;

    setRegenerating(dayNum);
    try {
      const res = await api.post(`/trips/${id}/regenerate-day`, {
        dayNum,
        instruction,
      });
      setTrip(res.data.trip);
      setShowRegenInput((prev) => ({ ...prev, [dayNum]: false }));
      setRegenInstruction((prev) => ({ ...prev, [dayNum]: '' }));
    } catch {
      alert('Failed to regenerate day');
    } finally {
      setRegenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading itinerary...</p>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Trao</h1>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-white">{trip.destination}</h2>
            <span className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2.5 py-1 rounded-full">
              {trip.budget}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            {trip.days} days · {trip.interests.join(', ')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Itinerary — left 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            {trip.itinerary.map((day) => (
              <div
                key={day._id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
              >
                {/* Day header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Day {day.day}</h3>
                  <button
                    onClick={() =>
                      setShowRegenInput((prev) => ({ ...prev, [day.day]: !prev[day.day] }))
                    }
                    className="text-xs text-gray-500 hover:text-blue-400 transition"
                  >
                    ↻ Regenerate
                  </button>
                </div>

                {/* Regenerate input */}
                {showRegenInput[day.day] && (
                  <div className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={regenInstruction[day.day] || ''}
                      onChange={(e) =>
                        setRegenInstruction((prev) => ({ ...prev, [day.day]: e.target.value }))
                      }
                      placeholder="e.g. more outdoor activities"
                      className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      onClick={() => handleRegenerateDay(day.day)}
                      disabled={regenerating === day.day}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-lg transition"
                    >
                      {regenerating === day.day ? 'Generating...' : 'Go'}
                    </button>
                  </div>
                )}

                {/* Activities */}
                <ul className="space-y-2 mb-4">
                  {day.activities.map((activity) => (
                    <li
                      key={activity._id}
                      className="flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span className="text-gray-300 text-sm">{activity.description}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveActivity(day.day, activity.id)}
                        className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition shrink-0"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Add activity */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newActivity[day.day] || ''}
                    onChange={(e) =>
                      setNewActivity((prev) => ({ ...prev, [day.day]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAddActivity(day.day)}
                    placeholder="Add an activity..."
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    onClick={() => handleAddActivity(day.day)}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-3 py-2 rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar — right 1/3 */}
          <div className="space-y-4">
            {/* Budget */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Budget Estimate</h3>
              <div className="space-y-2">
                {[
                  { label: 'Flights', value: trip.budgetEstimate.flights },
                  { label: 'Accommodation', value: trip.budgetEstimate.accommodation },
                  { label: 'Food', value: trip.budgetEstimate.food },
                  { label: 'Activities', value: trip.budgetEstimate.activities },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-300">${value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-800 pt-2 mt-2 flex justify-between text-sm font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-blue-400">${trip.budgetEstimate.total}</span>
                </div>
              </div>
            </div>

            {/* Hotels */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Recommended Hotels</h3>
              <div className="space-y-3">
                {trip.hotels.map((hotel) => (
                  <div key={hotel._id} className="flex items-start justify-between gap-2">
                    <span className="text-gray-300 text-sm">{hotel.name}</span>
                    <span
                      className={`text-xs border px-2 py-0.5 rounded-full shrink-0 ${tierColor[hotel.tier]}`}
                    >
                      {hotel.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}