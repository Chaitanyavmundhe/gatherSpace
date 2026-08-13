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
import Profile from "./pages/Profile";
import VenueDiscovery from "./pages/VenueDiscovery";
import CreateVenue from "./pages/CreateVenue";
import EditVenue from "./pages/EditVenue";
import MyVenues from "./pages/MyVenues";
import BookingCheckout from "./pages/BookingCheckout";
import NegotiationChat from "./pages/NegotiationChat";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/venues" element={<VenueDiscovery />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={["lister"]} />}>
              <Route path="/create-venue" element={<CreateVenue />} />
              <Route path="/edit-venue/:venueId" element={<EditVenue />} />
              <Route path="/my-venues" element={<MyVenues />} />
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
