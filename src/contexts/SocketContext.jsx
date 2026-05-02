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
  const [hasNewMessage, setHasNewMessage] = useState(false); // New state for "new activity" indicator
  const { user } = useAuthStore();

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/chat/unread-count');
      setUnreadCount(data.count);
      // We don't set hasNewMessage to true here because these are "old" unread messages
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

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
        autoConnect: false,
      });

      newSocket.on('connect', () => {
        newSocket.emit('join', user._id);
        fetchUnreadCount();
      });

      newSocket.on('new_message', (message) => {
        // Only show notification and set indicator if NOT on the chat page
        if (window.location.pathname !== '/chat') {
          notifications.show({
            title: `Message from ${message.sender?.displayName || message.sender?.username}`,
            message: message.text,
            icon: <IconMessage size={16} />,
            color: 'pink',
            onClick: () => window.location.href = '/chat'
          });
          setUnreadCount(prev => prev + 1);
          setHasNewMessage(true); // Flag that a TRULY new message arrived
        }
      });

      newSocket.on('disconnect', () => {
      });

      setSocket(newSocket);

      // Delay connection slightly to avoid React Strict Mode immediate mount/unmount cycle
      // which causes the "WebSocket is closed before the connection is established" warning.
      const connectTimer = setTimeout(() => {
        newSocket.connect();
      }, 50);

      return () => {
        clearTimeout(connectTimer);
        newSocket.off('new_message');
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user, fetchUnreadCount]);

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
