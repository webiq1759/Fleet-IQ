import React, { createContext, useContext, useState } from 'react';
import { AuthModal } from '../components/AuthModal';

interface AuthModalContextType {
    openAuthModal: (view?: 'login' | 'signup') => void;
    closeAuthModal: () => void;
    isOpen: boolean;
    view: 'login' | 'signup';
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode; onLogin?: () => void }> = ({ children, onLogin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'login' | 'signup'>('login');

    const openAuthModal = (initialView: 'login' | 'signup' = 'login') => {
        setView(initialView);
        setIsOpen(true);
    };

    const closeAuthModal = () => {
        setIsOpen(false);
    };

    const handleLoginSuccess = () => {
        if (onLogin) {
            onLogin();
        }
        // AuthModal handles closing itself, but we can ensure state is updated if needed
        // In AuthModal.tsx: onLogin(); onClose();
        // So onClose will be called by AuthModal
    };

    return (
        <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen, view }}>
            {children}
            <AuthModal
                isOpen={isOpen}
                onClose={closeAuthModal}
                initialView={view}
                onLogin={handleLoginSuccess}
            />
        </AuthModalContext.Provider>
    );
};

export const useAuthModal = () => {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
};
