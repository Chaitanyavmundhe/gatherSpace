import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, ShieldCheck } from "lucide-react";

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Both fields are optional — send whatever the user has typed,
      // even if one is left blank (blank phone just clears it).
      await updateProfile({ name, phone });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 p-6 flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full space-y-4"
      >
        <div className="flex items-center gap-2 text-indigo-600 mb-2">
          <User className="w-6 h-6" />
          <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
        </div>

        {error && (
          <p className="text-sm bg-red-50 text-red-600 p-2.5 rounded-lg">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm bg-emerald-50 text-emerald-700 p-2.5 rounded-lg">
            {success}
          </p>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Name{" "}
            <span className="normal-case font-normal text-gray-400">
              (optional)
            </span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-8 pr-2.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Your name"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Phone Number{" "}
            <span className="normal-case font-normal text-gray-400">
              (optional)
            </span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-8 pr-2.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        {/* Read-only info for context — email and role can't be changed here */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail className="w-3.5 h-3.5" />
            {user?.email}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            Role: <span className="font-medium uppercase">{user?.role}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition mt-2 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
