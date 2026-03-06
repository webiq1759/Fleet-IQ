import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AssetDetails } from './view/AssetDetails';
import { Dashboard } from './view/Dashboard';
import { Marketplace } from './view/Marketplace'; // Assuming Marketplace is a component
import { RenterDashboard } from './view/RenterDashboard';
import { HelpCenter } from './view/HelpCenter';
import { ListerOnboarding } from './view/ListerOnboarding';
import { BookingSuccess } from './view/BookingSuccess';
import { PublicBookingPage } from './view/PublicBookingPage';
import { AuthenticationPage } from './view/AuthenticationPage';
import { ResetPassword } from './view/ResetPassword';
import { DeveloperDocs } from './view/DeveloperDocs';
import { ListerAgreement } from './view/ListerAgreement';
import { AcceptInvite } from './view/AcceptInvite';
import { supabase } from './supabaseClient';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './view/PrivacyPolicy';
import { TermsOfService } from './view/TermsOfService';
import { SolanaWalletProvider } from './contexts/SolanaWalletProvider';
import { ScrollToTop } from './components/ScrollToTop';

import { useLocation } from 'react-router-dom';

const MainLayout = ({ userMode, toggleMode }: { userMode: 'RENTER' | 'LISTER', toggleMode: () => void }) => {
  const location = useLocation();

  return (
    <>
      <Navbar mode={userMode} onSwitchMode={toggleMode} />
      <div className="flex-grow">
        <Routes>
          <Route
            path="/"
            index
            element={userMode === 'RENTER' ? <Marketplace /> : <Dashboard onSwitchMode={toggleMode} />}
          />
          <Route path="/assets/:id" element={<AssetDetails />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/lister-agreement" element={<ListerAgreement />} />
          {/* Renter Dashboard Routes (Trips, Settings etc) */}
          <Route path="/account/*" element={<RenterDashboard />} />

          <Route path="/booking/success" element={<BookingSuccess />} />

          {/* Public Booking Page Route */}
          <Route path="/book/:slug" element={<PublicBookingPage />} />

          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

          {/* Developer Documentation Route */}
          <Route path="/developer" element={<DeveloperDocs />} />

          {/* Explicitly catch index.html or empty paths and force root */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {/* Footer is hidden on portal pages (Account Dashboard) and Lister Dashboard */}
      {(!location.pathname.startsWith('/account')) &&
        (!(userMode === 'LISTER' && location.pathname === '/')) &&
        <Footer />}
    </>
  );
};
export default function App() {
  const [userMode, setUserMode] = useState<'RENTER' | 'LISTER'>('RENTER');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('role, linked_owner_id')
            .eq('id', session.user.id)
            .single();

          // If they are a verified LISTER or a Team Member, treat them as a lister
          if (data?.role === 'LISTER' || data?.linked_owner_id) {
            const savedMode = localStorage.getItem('fleet_iq_user_mode');
            // Auto switch team members to LISTER view if there's no saved preference or if they are a team member
            if (savedMode === 'LISTER' || data?.linked_owner_id) setUserMode('LISTER');
          }
        }
      } catch (e) {
        console.error("Error checking role:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkRole();
  }, []);

  // Prevent rendering incorrect view while checking role
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"></div>;
  }

  const toggleMode = () => {
    const newMode = userMode === 'RENTER' ? 'LISTER' : 'RENTER';
    setUserMode(newMode);
    localStorage.setItem('fleet_iq_user_mode', newMode);
  };

  const handleLogin = async () => {
    // Verify lister status from database on login
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, linked_owner_id')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'LISTER' || profile?.linked_owner_id) {
        // Optional: Auto switch or stay in renter
        if (profile?.linked_owner_id) {
          setUserMode('LISTER');
          localStorage.setItem('fleet_iq_user_mode', 'LISTER');
        }
      }
    }
  };

  return (
    <SolanaWalletProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
          <AuthModalProvider onLogin={handleLogin}>
            <Routes>
              {/* Onboarding Route (No Navbar/Footer) */}
              <Route path="/login" element={<AuthenticationPage initialView="login" />} />
              <Route path="/signup" element={<AuthenticationPage initialView="signup" />} />
              <Route path="/onboarding" element={<ListerOnboarding />} />

              {/* Main App Routes - use /* to allow nested matching */}
              <Route path="/*" element={<MainLayout userMode={userMode} toggleMode={toggleMode} />} />
            </Routes>
          </AuthModalProvider>
        </div>
      </Router>
    </SolanaWalletProvider>
  );
}
