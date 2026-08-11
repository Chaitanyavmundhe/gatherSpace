import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

let socket;

export default function NegotiationChat() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');

  useEffect(() => {
    // Initialize Socket.io client connection over WebSocket proxy
    socket = io('http://localhost:5050');

    // Protocol Handshake & Room Join
    socket.emit('join_room', roomId);

    // Incoming Event Listener
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    socket.emit('send_message', {
      roomId,
      sender: user?.name || 'Anonymous User',
      message: inputMessage,
      offeredPrice: offeredPrice ? Number(offeredPrice) : null,
    });

    setInputMessage('');
    setOfferedPrice('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md border border-gray-100 flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center gap-2 bg-indigo-600 text-white rounded-t-xl">
          <MessageSquare className="w-5 h-5" />
          <h2 className="font-bold">Live Negotiation Room ({roomId})</h2>
        </div>

        {/* Message History Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg max-w-[80%] ${
                m.sender === user?.name ? 'bg-indigo-50 border border-indigo-100 ml-auto' : 'bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">{m.sender}</span>
                <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-gray-800">{m.message}</p>
              {m.offeredPrice && (
                <span className="inline-block mt-2 bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-mono font-bold">
                  Proposed Price: ₹{m.offeredPrice.toLocaleString('en-IN')}/day
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Messaging Input Controls */}
        <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2 items-center bg-gray-50 rounded-b-xl">
          <input
            type="number"
            placeholder="Offer (₹)"
            value={offeredPrice}
            onChange={(e) => setOfferedPrice(e.target.value)}
            className="w-28 p-2 border rounded-md text-sm bg-white focus:outline-none"
          />
          <input
            type="text"
            placeholder="Type your counter offer or message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 p-2 border rounded-md text-sm bg-white focus:outline-none"
            required
          />
          <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-md hover:bg-indigo-700 transition">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}