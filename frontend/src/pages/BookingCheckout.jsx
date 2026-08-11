import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

export default function BookingCheckout() {
  const { venueId } = useParams();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await API.post('/bookings', {
        venueId,
        startDate,
        endDate,
      });

      setSuccess(true);
      setTimeout(() => navigate('/venues'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking collision detected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 p-6 flex justify-center items-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full space-y-5">
        <div className="flex items-center gap-2 text-emerald-600">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-xl font-bold text-gray-900">ACID Reserved Checkout</h2>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Dates selected are evaluated against MongoDB session locks to guarantee zero double-booking overlaps.
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs font-semibold text-center">
            🎉 Reservation confirmed! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Check-in Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Check-out Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition"
          >
            {loading ? 'Locking Transaction...' : 'Confirm & Reserve Space'}
          </button>
        </form>
      </div>
    </div>
  );
}