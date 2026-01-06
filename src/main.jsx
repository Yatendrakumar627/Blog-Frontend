import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';
import App from './App.jsx'
import { SocketProvider } from './contexts/SocketContext'

import './GlobalOverrides.css';

const theme = createTheme({
  primaryColor: 'blue',
  focusStyles: 'never',
});

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <MantineProvider defaultColorScheme="auto" theme={theme} colorSchemeManager={colorSchemeManager}>
        <Notifications
          position="top-right"
          autoClose={4000}
          limit={5}
          styles={{
            root: {
              // Disable any audio/sound related styles
            }
          }}
        />
        <App />
      </MantineProvider>
    </SocketProvider>
  </StrictMode>,
)
