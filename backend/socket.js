import { Server } from 'socket.io';

let io;
// Room presence registry: roomId -> Map(socketId -> { socketId, userId, name, role })
const roomPresence = new Map();

const getRoomPresenceStatus = (roomId) => {
  const usersMap = roomPresence.get(roomId);
  if (!usersMap || usersMap.size === 0) {
    return { organizerLive: false, listerLive: false, users: [] };
  }

  const usersList = Array.from(usersMap.values());
  const organizerLive = usersList.some((u) => u.role === 'organizer');
  const listerLive = usersList.some((u) => u.role === 'lister');

  return {
    organizerLive,
    listerLive,
    users: usersList.map((u) => ({ name: u.name, role: u.role, userId: u.userId })),
  };
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production origin in build step
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Join a specific negotiation room with user identity details
    socket.on('join_room', (data) => {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      const user = typeof data === 'object' ? data?.user : null;

      if (!roomId) return;

      socket.join(roomId);
      socket.currentRoomId = roomId;

      if (!roomPresence.has(roomId)) {
        roomPresence.set(roomId, new Map());
      }

      const userInfo = {
        socketId: socket.id,
        userId: user?.id || user?._id || socket.id,
        name: user?.name || 'Guest User',
        role: user?.role || 'organizer',
      };

      roomPresence.get(roomId).set(socket.id, userInfo);
      console.log(`[SOCKET] ${userInfo.name} (${userInfo.role}) joined room: ${roomId}`);

      // Broadcast live presence status to everyone in room
      const presenceStatus = getRoomPresenceStatus(roomId);
      io.to(roomId).emit('presence_update', presenceStatus);
    });

    // Handle structured negotiation actions ONLY (OFFER, COUNTER_OFFER, ACCEPT, REJECT)
    socket.on('send_negotiation_action', (data) => {
      const allowedActions = ['OFFER', 'COUNTER_OFFER', 'ACCEPT', 'REJECT'];
      const actionType = allowedActions.includes(data.actionType) ? data.actionType : 'OFFER';

      const payload = {
        sender: data.sender || 'Anonymous',
        role: data.role || 'organizer',
        actionType,
        offeredPrice: data.offeredPrice ? Number(data.offeredPrice) : null,
        note: data.note || '',
        timestamp: new Date().toISOString(),
      };

      // Broadcast structured action to all clients in the room
      io.to(data.roomId).emit('receive_negotiation_action', payload);
      // Legacy compatibility handler
      io.to(data.roomId).emit('receive_message', {
        ...payload,
        message: `${payload.sender} sent ${actionType} action`,
      });
    });

    // Legacy handler route redirecting to structured protocol
    socket.on('send_message', (data) => {
      const payload = {
        sender: data.sender || 'Anonymous',
        role: data.role || 'organizer',
        actionType: data.actionType || (data.offeredPrice ? 'OFFER' : 'OFFER'),
        offeredPrice: data.offeredPrice ? Number(data.offeredPrice) : null,
        note: data.message || data.note || '',
        timestamp: new Date().toISOString(),
      };

      io.to(data.roomId).emit('receive_negotiation_action', payload);
      io.to(data.roomId).emit('receive_message', payload);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      if (socket.currentRoomId && roomPresence.has(socket.currentRoomId)) {
        const roomId = socket.currentRoomId;
        roomPresence.get(roomId).delete(socket.id);
        const presenceStatus = getRoomPresenceStatus(roomId);
        io.to(roomId).emit('presence_update', presenceStatus);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};