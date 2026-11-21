import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';
import { ThemeProvider } from './app/context/ThemeContext.jsx';
import { OpacityProvider } from './app/context/OpacityContext.jsx';
import ClockAlerts from './features/clock/ClockAlerts.jsx';
import { ClockProvider } from './features/clock/ClockSession.jsx';
import './app/App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <OpacityProvider>
        <ClockProvider>
          <App />
          <ClockAlerts />
        </ClockProvider>
      </OpacityProvider>
    </ThemeProvider>
  </React.StrictMode>
);
