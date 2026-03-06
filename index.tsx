
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { PWAProvider } from './contexts/PWAContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExchangeRateProvider } from './contexts/ExchangeRateContext';

const container = document.getElementById('root');

if (!container) {
    throw new Error("Could not find root element to mount to");
}

const root = createRoot(container);

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <PWAProvider>
                <AuthProvider>
                    <ThemeProvider>
                        <ExchangeRateProvider>
                            <PreferencesProvider>
                                <NotificationProvider>
                                    <App />
                                </NotificationProvider>
                            </PreferencesProvider>
                        </ExchangeRateProvider>
                    </ThemeProvider>
                </AuthProvider>
            </PWAProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
