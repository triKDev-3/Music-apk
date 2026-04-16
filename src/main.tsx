import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import VConsole from 'vconsole';

// Initialise la console de debug sur mobile
if (typeof window !== 'undefined') {
  new VConsole({ theme: 'dark' });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
