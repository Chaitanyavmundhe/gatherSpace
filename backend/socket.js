import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production origin in build step
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Join a specific negotiation room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`[SOCKET] User ${socket.id} joined room: ${roomId}`);
    });

    // Handle incoming chat negotiation message
    socket.on('send_message', (data) => {
      // Broadcast message to everyone in the specific room
      io.to(data.roomId).emit('receive_message', {
        sender: data.sender,
        message: data.message,
        offeredPrice: data.offeredPrice,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
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