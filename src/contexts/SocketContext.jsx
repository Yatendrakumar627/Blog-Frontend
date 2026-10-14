import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import { notifications } from '@mantine/notifications';
import { IconMessage } from '@tabler/icons-react';
import api from '../api/axios';

export const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const { user } = useAuthStore();
  const socketRef = React.useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/chat/unread-count');
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  useEffect(() => {
    const userId = user?._id;
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const getSocketUrl = () => {
      let url = import.meta.env.VITE_API_URL;
      if (!url) {
        url = import.meta.env.PROD
          ? 'https://blog-backend-1-5enc.onrender.com'
          : 'http://localhost:5100';
      }
      return url.replace(/\/$/, '').replace('/api', '');
    };

    if (!socketRef.current) {
      const socketUrl = getSocketUrl();
      const newSocket = io(socketUrl, {
        withCredentials: true,
        autoConnect: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    const activeSocket = socketRef.current;

    const handleConnect = () => {
      activeSocket.emit('join', userId);
      fetchUnreadCount();
    };

    const handleNewMessage = (message) => {
      if (window.location.pathname !== '/chat') {
        notifications.show({
          title: `Message from ${message.sender?.displayName || message.sender?.username}`,
          message: message.text,
          icon: <IconMessage size={16} />,
          color: 'pink',
          onClick: () => window.location.href = '/chat'
        });
        setUnreadCount(prev => prev + 1);
        setHasNewMessage(true);
      }
    };

    if (activeSocket.connected) {
      handleConnect();
    } else {
      activeSocket.on('connect', handleConnect);
    }

    activeSocket.on('new_message', handleNewMessage);

    return () => {
      activeSocket.off('connect', handleConnect);
      activeSocket.off('new_message', handleNewMessage);
    };
  }, [user?._id, fetchUnreadCount]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      unreadCount, 
      setUnreadCount, 
      fetchUnreadCount,
      hasNewMessage,
      setHasNewMessage 
    }}>
      {children}
    </SocketContext.Provider>
  );
};
