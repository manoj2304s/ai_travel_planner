'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';

const INTERESTS = ['Food', 'Culture', 'Adventure', 'Shopping', 'Nature', 'History', 'Nightlife', 'Art'];
const BUDGETS = ['Low', 'Medium', 'High'];

export default function NewTripPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    destination: '',
    days: 3,
    budget: 'Medium',
    interests: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async () => {
    if (!form.destination.trim()) {
      setError('Please enter a destination');
      return;
    }
    if (form.interests.length === 0) {
      setError('Please select at least one interest');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/trips', form);
      router.push(`/trips/${res.data.trip._id}`);
    } catch {
      setError('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Trao</h1>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
            ← Back
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Plan a new trip</h2>
          <p className="text-gray-400 text-sm mt-1">Fill in the details and AI will generate your itinerary</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Destination */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Destination</label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
              placeholder="e.g. Tokyo, Paris, Bali"
            />
          </div>

          {/* Number of Days */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Number of days — <span className="text-white font-medium">{form.days}</span>
            </label>
            <input
              type="range"
              min={1}
              max={14}
              value={form.days}
              onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) })}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1 day</span>
              <span>14 days</span>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Budget</label>
            <div className="flex gap-3">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setForm({ ...form, budget: b })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                    form.budget === b
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm border transition ${
                    form.interests.includes(interest)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 text-sm transition"
          >
            {loading ? 'Generating your itinerary...' : 'Generate Itinerary →'}
          </button>

          {loading && (
            <p className="text-center text-gray-500 text-xs">
              This may take a few seconds while AI plans your trip
            </p>
          )}
        </div>
      </div>
    </div>
  );
}