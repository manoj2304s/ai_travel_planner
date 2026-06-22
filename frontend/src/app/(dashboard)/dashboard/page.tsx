'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { getUser, logout } from '../../lib/auth';

interface Trip {
  _id: string;
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get('/trips');
      setTrips(res.data.trips);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/trips/${id}`);
      setTrips(trips.filter((t) => t._id !== id));
    } catch {
      alert('Failed to delete trip');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Trao</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">Hey, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Trips</h2>
            <p className="text-gray-400 text-sm mt-1">Plan and manage your AI-generated itineraries</p>
          </div>
          <Link
            href="/trips/new"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            + New Trip
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-gray-500 text-sm">Loading trips...</div>
        ) : trips.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-2xl p-16 text-center">
            <p className="text-gray-500 text-sm">No trips yet.</p>
            <Link
              href="/trips/new"
              className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block transition"
            >
              Plan your first trip →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <div
                key={trip._id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold text-lg">{trip.destination}</h3>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                    {trip.budget}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-1">{trip.days} days</p>
                <p className="text-gray-500 text-xs mb-4">
                  {trip.interests.join(', ')}
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <Link
                    href={`/trips/${trip._id}`}
                    className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium py-2 rounded-lg transition"
                  >
                    View Itinerary
                  </Link>
                  <button
                    onClick={() => handleDelete(trip._id)}
                    className="text-red-500 hover:text-red-400 text-xs transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}