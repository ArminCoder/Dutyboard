import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { OrgProvider } from './app/OrgContext';
import { RoleProvider } from './app/RoleContext';
import { StoreProvider } from './app/store';
import { AppRoutes } from './app/routes';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OrgProvider>
      <RoleProvider>
        <StoreProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </StoreProvider>
      </RoleProvider>
    </OrgProvider>
  </StrictMode>,
);
