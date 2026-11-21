import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';
import { ThemeProvider } from './app/context/ThemeContext.jsx';
import { OpacityProvider } from './app/context/OpacityContext.jsx';
import { PowerProvider } from './app/context/PowerContext.jsx';
import './app/App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <OpacityProvider>
        <PowerProvider>
          <App />
        </PowerProvider>
      </OpacityProvider>
    </ThemeProvider>
  </React.StrictMode>
);
