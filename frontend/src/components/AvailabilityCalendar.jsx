import { useState, useEffect } from "react";
import API from "../api/axios";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

export default function AvailabilityCalendar({
  venueId,
  startDate,
  endDate,
  onSelectDates,
}) {
  const [occupiedDates, setOccupiedDates] = useState(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venueId) return;

    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/bookings/venue/${venueId}/availability`);
        const bookings = res.data.data || [];
        const dateSet = new Set();

        bookings.forEach((b) => {
          let curr = new Date(b.startDate);
          const end = new Date(b.endDate);
          while (curr <= end) {
            const formatted = curr.toISOString().split("T")[0];
            dateSet.add(formatted);
            curr.setDate(curr.getDate() + 1);
          }
        });

        setOccupiedDates(dateSet);
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [venueId]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Calculate calendar days for display month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dateStr) => {
    if (occupiedDates.has(dateStr)) return;

    if (!startDate || (startDate && endDate)) {
      onSelectDates(dateStr, "");
    } else if (startDate && !endDate) {
      if (new Date(dateStr) < new Date(startDate)) {
        onSelectDates(dateStr, "");
      } else {
        // Check if any occupied dates lie between startDate and dateStr
        let hasOccupiedInRange = false;
        let curr = new Date(startDate);
        const end = new Date(dateStr);
        while (curr <= end) {
          if (occupiedDates.has(curr.toISOString().split("T")[0])) {
            hasOccupiedInRange = true;
            break;
          }
          curr.setDate(curr.getDate() + 1);
        }

        if (hasOccupiedInRange) {
          alert("Selected range contains occupied dates. Please select an unoccupied date range.");
          onSelectDates(dateStr, "");
        } else {
          onSelectDates(startDate, dateStr);
        }
      }
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <span>Venue Availability Calendar</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border hover:bg-gray-50 text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-700 min-w-[110px] text-center font-mono">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border hover:bg-gray-50 text-gray-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-gray-400">
          Loading venue reservation calendar...
        </div>
      ) : (
        <>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 uppercase">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(year, month, dayNum);
              // Normalize timezone string
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isPast = dateStr < todayStr;
              const isOccupied = occupiedDates.has(dateStr);

              const isStart = startDate === dateStr;
              const isEnd = endDate === dateStr;
              const inRange =
                startDate &&
                endDate &&
                dateStr >= startDate &&
                dateStr <= endDate;

              let btnClass = "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold";

              if (isPast) {
                btnClass = "bg-gray-100 text-gray-300 border-transparent cursor-not-allowed";
              } else if (isOccupied) {
                btnClass = "bg-red-500 text-white font-bold border-red-600 cursor-not-allowed shadow-xs";
              } else if (isStart || isEnd) {
                btnClass = "bg-indigo-600 text-white font-extrabold ring-2 ring-indigo-400";
              } else if (inRange) {
                btnClass = "bg-indigo-100 text-indigo-900 border-indigo-200 font-bold";
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast || isOccupied}
                  onClick={() => handleDateClick(dateStr)}
                  className={`h-9 rounded-lg border text-xs flex flex-col items-center justify-center transition relative ${btnClass}`}
                  title={
                    isOccupied
                      ? `Occupied / Reserved date (${dateStr})`
                      : `Available date (${dateStr})`
                  }
                >
                  <span>{dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* Color Legend Bar */}
          <div className="pt-2 border-t flex flex-wrap items-center justify-between text-[11px] text-gray-600 gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-md bg-red-500 inline-block"></span>
              <strong className="text-red-700">RED:</strong> Occupied
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
              <strong className="text-emerald-700">GREEN:</strong> Available
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block"></span>
              <strong className="text-indigo-700">BLUE:</strong> Selected
            </span>
          </div>
        </>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg">
        <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span>
          Click an <strong>Available (GREEN)</strong> date to select check-in, then click a second date for check-out.
        </span>
      </div>
    </div>
  );
}
