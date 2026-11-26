import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App.jsx';
import './ui.css';

createRoot(document.getElementById('ui')).render(
  <MotionConfig reducedMotion="user">
    <App />
  </MotionConfig>,
);
