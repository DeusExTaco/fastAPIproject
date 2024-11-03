import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from "@material-tailwind/react";
import './index.css';
import './App.css';

// Override Material Tailwind defaults
const themeConfig = {
  container: {
    padding: '0',
    margin: '0',
    maxWidth: 'none',
  }
};

const root = document.getElementById('root');
// Remove any inline styles that might have been added
if (root) {
  root.style.cssText = '';
}

ReactDOM.createRoot(root as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider value={themeConfig}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);