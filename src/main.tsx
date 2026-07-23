import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { RoleProvider } from './app/RoleContext';
import { StoreProvider } from './app/store';
import { AppRoutes } from './app/routes';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RoleProvider>
      <StoreProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StoreProvider>
    </RoleProvider>
  </StrictMode>,
);
