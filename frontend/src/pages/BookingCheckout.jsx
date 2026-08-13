import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  ShieldCheck,
  AlertCircle,
  Banknote,
  CheckCircle2,
  IndianRupee,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import { useAuth } from '../context/AuthContext';

export default function BookingCheckout() {
  const { venueId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(null);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await API.get(`/venues/${venueId}`);
        setVenue(res.data.data);
      } catch (err) {
        console.error('Error fetching venue details:', err);
      }
    };
    fetchVenue();
  }, [venueId]);

  const handleSelectDates = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setError('');
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysCount = calculateDays();
  const pricePerDay = venue?.pricePerDay || 0;
  const grandTotal = daysCount * pricePerDay;

  const handleOfflineBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please select both Check-in and Check-out dates on the calendar.');
      return;
    }

    if (daysCount <= 0) {
      setError('Check-out date must be after Check-in date.');
      return;
    }

    setLoading(true);

    try {
      const res = await API.post('/bookings', {
        venueId,
        startDate,
        endDate,
        paymentMethod: 'cash_offline',
      });

      setReservationSuccess({
        bookingId: res.data.data._id,
        venueTitle: venue?.title || 'Venue Space',
        startDate,
        endDate,
        days: daysCount,
        totalPrice: grandTotal,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking reservation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 p-6 flex justify-center items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Venue Info & Calendar Selection */}
        <div className="md:col-span-7 space-y-5">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/venues')}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Venues
              </button>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-4 h-4" /> ACID Protected
              </span>
            </div>

            {venue && (
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
                  {venue.title}
                </h1>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {venue.description}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-gray-700">
                  <span>Capacity: {venue.capacity} guests</span>
                  <span className="text-emerald-600 flex items-center font-mono font-bold">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {venue.pricePerDay.toLocaleString('en-IN')}/day
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Color-Coded Date Availability Calendar */}
          <AvailabilityCalendar
            venueId={venueId}
            startDate={startDate}
            endDate={endDate}
            onSelectDates={handleSelectDates}
          />
        </div>

        {/* Right Column: Reservation & Offline Cash Payment Info */}
        <div className="md:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-5">
            <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              Offline Cash Reservation
            </h2>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {reservationSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <h3 className="font-extrabold text-base">Space Reserved!</h3>
                </div>

                <p className="text-xs text-emerald-900 leading-relaxed">
                  Your dates are locked. Please pay <strong>₹{reservationSuccess.totalPrice.toLocaleString('en-IN')}</strong> in cash to the venue lister upon arrival/check-in.
                </p>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs font-mono space-y-1 text-gray-700">
                  <div>Ref ID: {reservationSuccess.bookingId}</div>
                  <div>Dates: {reservationSuccess.startDate} to {reservationSuccess.endDate}</div>
                  <div>Status: <span className="text-amber-600 font-bold">Unpaid (Cash Pending)</span></div>
                </div>

                <p className="text-[11px] text-gray-500">
                  The lister will click <strong>"Mark Payment Done"</strong> in their dashboard upon receiving cash to issue your receipt.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/venues')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Return to Discovery
                </button>
              </div>
            ) : (
              <form onSubmit={handleOfflineBooking} className="space-y-4">
                {/* Selected Dates Display */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/80 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Check-in</span>
                    <span className="font-mono font-bold text-gray-800">
                      {startDate || 'Not selected'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Check-out</span>
                    <span className="font-mono font-bold text-gray-800">
                      {endDate || 'Not selected'}
                    </span>
                  </div>
                </div>

                {/* Offline Payment Banner */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Offline Cash Collection:</strong>
                    Payment will be collected directly by the venue lister in cash. The receipt will be generated when the lister marks payment done.
                  </div>
                </div>

                {/* Price Calculation Summary */}
                <div className="border-t pt-3 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Rate per day:</span>
                    <span className="font-mono font-semibold">₹{pricePerDay.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-mono font-semibold">{daysCount} day(s)</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono text-emerald-600">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !startDate || !endDate || daysCount <= 0}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Confirming Reservation...' : `Confirm Reservation (Pay ₹${grandTotal.toLocaleString('en-IN')} Offline Cash)`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}