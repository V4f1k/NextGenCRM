import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import './i18n/config' // Temporarily disabled for Docker - DO NOT UNCOMMENT
import App from './App.tsx'

console.log('main.tsx is loading...');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('React app rendered');
} else {
  console.error('Root element not found!');
}
