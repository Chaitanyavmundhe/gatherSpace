import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  ShieldCheck,
  AlertCircle,
  CreditCard,
  QrCode,
  Building,
  Printer,
  CheckCircle,
  IndianRupee,
  Calendar as CalendarIcon,
  ArrowLeft,
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
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

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

  // Compute Days & Pricing
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
  const subtotal = daysCount * pricePerDay;
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + taxAmount;

  const handleBookingAndPayment = async (e) => {
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
        paymentMethod,
      });

      const responseReceipt = res.data.receipt || {
        receiptId: `REC-${res.data.data._id.toString().slice(-6).toUpperCase()}`,
        transactionId: res.data.data.transactionId || `TXN-${Date.now()}`,
        bookingId: res.data.data._id,
        venueTitle: venue?.title || 'Venue Reservation',
        organizerName: user?.name || 'Valued Customer',
        organizerEmail: user?.email || '',
        startDate,
        endDate,
        days: daysCount,
        pricePerDay,
        subtotal,
        taxAmount,
        totalPrice: res.data.data.totalPrice || grandTotal,
        paymentMethod,
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
      };

      setReceipt(responseReceipt);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking or Payment transaction failed.');
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

        {/* Right Column: Checkout Summary & Payment Form */}
        <div className="md:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-5">
            <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Reservation & Payment
            </h2>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookingAndPayment} className="space-y-4">
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

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Select Payment Option
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      paymentMethod === 'credit_card'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={paymentMethod === 'credit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Credit / Debit Card</span>
                    </div>
                    <CreditCard className="w-4 h-4 text-gray-500" />
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      paymentMethod === 'upi'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Instant UPI / QR Code</span>
                    </div>
                    <QrCode className="w-4 h-4 text-gray-500" />
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      paymentMethod === 'net_banking'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="net_banking"
                        checked={paymentMethod === 'net_banking'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Net Banking</span>
                    </div>
                    <Building className="w-4 h-4 text-gray-500" />
                  </label>
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
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Taxes & Fees (5%):</span>
                  <span className="font-mono font-semibold">₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-600">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !startDate || !endDate || daysCount <= 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Processing Payment...' : `Pay ₹${grandTotal.toLocaleString('en-IN')} & Confirm`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Official Payment Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-6 h-6" />
                <h3 className="font-extrabold text-lg text-gray-900">Payment Successful</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full font-mono">
                PAID & RESERVED
              </span>
            </div>

            <div id="payment-receipt" className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 font-mono text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Receipt Ref:</span>
                  <span className="font-bold text-gray-900">{receipt.receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-bold text-indigo-600">{receipt.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date & Time:</span>
                  <span>{new Date(receipt.paidAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="uppercase font-bold">{receipt.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider text-gray-400">
                  Reservation Details
                </h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-bold text-gray-900">{receipt.venueTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organizer:</span>
                  <span className="font-semibold text-gray-800">{receipt.organizerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in / Check-out:</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {receipt.startDate} to {receipt.endDate} ({receipt.days} days)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-3 font-mono">
                <div className="flex justify-between text-gray-600">
                  <span>Daily Rate:</span>
                  <span>₹{pricePerDay.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes (5%):</span>
                  <span>₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-gray-900 border-t pt-2">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600">₹{(receipt.totalPrice || grandTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print / Save Receipt
              </button>
              <button
                type="button"
                onClick={() => navigate('/venues')}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition text-center"
              >
                Done & View Venues
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}