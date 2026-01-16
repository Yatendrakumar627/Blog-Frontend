import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const getSocketUrl = () => {
        let url = import.meta.env.VITE_API_URL;
        if (!url) {
          url = import.meta.env.PROD
            ? 'https://blog-backend-1-5enc.onrender.com'
            : 'http://localhost:5100';
        }
        return url.replace(/\/$/, '').replace('/api', '');
      };

      const socketUrl = getSocketUrl();

      const newSocket = io(socketUrl, {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        newSocket.emit('join', user._id);
        fetchUnreadCount();
      });

      newSocket.on('new_message', (message) => {
        // Only show notification if NOT on the chat page
        if (window.location.pathname !== '/chat') {
          notifications.show({
            title: `Message from ${message.sender?.displayName || message.sender?.username}`,
            message: message.text,
            icon: <IconMessage size={16} />,
            color: 'pink',
            onClick: () => window.location.href = '/chat'
          });
          setUnreadCount(prev => prev + 1);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      const fetchUnreadCount = async () => {
        try {
          const { data } = await api.get('/chat/unread-count');
          setUnreadCount(data.count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };

      setSocket(newSocket);

      return () => {
        newSocket.off('new_message');
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
