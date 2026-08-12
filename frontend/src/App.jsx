import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VenueDiscovery from "./pages/VenueDiscovery";
import CreateVenue from "./pages/CreateVenue";
import BookingCheckout from "./pages/BookingCheckout";
import NegotiationChat from "./pages/NegotiationChat";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          <Routes>
            {/* Landing Page as Root Route */}
            <Route path="/" element={<Home />} />

            {/* Public Auth & Discovery Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/venues" element={<VenueDiscovery />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={["lister"]} />}>
              <Route path="/create-venue" element={<CreateVenue />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["organizer"]} />}>
              <Route path="/book/:venueId" element={<BookingCheckout />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["organizer", "lister"]} />
              }
            >
              <Route path="/negotiate/:roomId" element={<NegotiationChat />} />
            </Route>

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
