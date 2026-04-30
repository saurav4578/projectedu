import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        setConnected(true);
        console.log('🔌 Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token]);

  const joinRoom = (roomId) => {
    if (socket) socket.emit('join-room', { roomId, user });
  };

  const sendMessage = (roomId, message) => {
    if (socket) socket.emit('chat-message', { roomId, message, user });
  };

  const askQuestion = (roomId, question) => {
    if (socket) socket.emit('ask-question', { roomId, question, user });
  };

  const createPoll = (roomId, poll) => {
    if (socket) socket.emit('create-poll', { roomId, poll });
  };

  const votePoll = (roomId, pollId, option) => {
    if (socket) socket.emit('vote-poll', { roomId, pollId, option, userId: user?._id });
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinRoom, sendMessage, askQuestion, createPoll, votePoll }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
