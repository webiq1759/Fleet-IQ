
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Car, Users, CalendarClock, Map, History,
  Wallet, BarChart3, Shield, LifeBuoy, Settings as SettingsIcon, Menu, X, Loader2,
  MessageSquare, Lock, Home, Heart as HeartIcon, Compass, ChevronRight, User, Gift
} from 'lucide-react';
import { AddFleetModal } from '../components/AddFleetModal';
import { AddCrewModal } from '../components/AddCrewModal';
import { AddBookingModal } from '../components/AddBookingModal';
import { AddDispatchModal } from '../components/AddDispatchModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { EditBookingModal } from '../components/EditBookingModal';
import { AddFinanceEntryModal } from '../components/AddFinanceEntryModal';
import { SavedAssetsModal } from '../components/SavedAssetsModal';
import { StatusModal } from '../components/StatusModal';
import { CustomAlertModal } from '../components/CustomAlertModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { Asset, CrewMember, Booking, BookingStatus } from '../types';
import { Overview } from './dashboard/Overview';
import { FleetRegistry } from './dashboard/FleetRegistry';
import { CrewRegistry } from './dashboard/CrewRegistry';
import { BookingsList } from './dashboard/BookingsList';
import { BookingsCalendar } from '../components/BookingsCalendar';
import { Dispatch } from './dashboard/Dispatch';
import { LiveTracking } from './dashboard/LiveTracking';
import { Finance } from './dashboard/Finance';
import { Reports } from './dashboard/Reports';
import { Team } from './dashboard/Team';
import { Support } from './dashboard/Support';
import { Messages } from './dashboard/Messages';
import { Settings } from './dashboard/Settings';
import { SectionPlaceholder } from './dashboard/SectionPlaceholder';
import { supabase } from '../supabaseClient';
import { Button } from '../components/Button';
import { AccountMenuModal } from '../components/AccountMenuModal';


const MENU_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, id: 'overview' },
  { label: 'Messages', icon: MessageSquare, id: 'messages' },
  { label: 'Fleet Registry', icon: Car, id: 'registry' },
  { label: 'Crew', icon: Users, id: 'crew' },
  { label: 'Dispatch', icon: CalendarClock, id: 'dispatch' },
  { label: 'Live Tracking', icon: Map, id: 'tracking' },
  { label: 'Bookings', icon: History, subItems: [{ label: 'List View', id: 'bookings' }, { label: 'Calendar View', id: 'calendar' }] },
  { label: 'Finance', icon: Wallet, id: 'finance' },
  { label: 'Reports', icon: BarChart3, id: 'reports' },
  { label: 'Team', icon: Shield, id: 'team' },
  { label: 'Support', icon: LifeBuoy, id: 'support' },
  { label: 'Account', icon: User, id: 'settings' },
];

import { useNotification } from '../contexts/NotificationContext';

export const Dashboard = ({ onSwitchMode }: { onSwitchMode: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, unreadMessageCount } = useNotification();
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('dashboard_active_tab') || 'overview';
  });

  useEffect(() => {
    localStorage.setItem('dashboard_active_tab', activeTab);
  }, [activeTab]);

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ Bookings: false });
  const [deleteCrewId, setDeleteCrewId] = useState<string | null>(null);
  const [isDeletingCrew, setIsDeletingCrew] = useState(false);

  const [isAddFleetModalOpen, setIsAddFleetModalOpen] = useState(false);
  const [editingFleet, setEditingFleet] = useState<Asset | null>(null);

  // New State for Edit Booking
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

  const [isAddCrewModalOpen, setIsAddCrewModalOpen] = useState(false);
  const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);
  const [isAddDispatchModalOpen, setIsAddDispatchModalOpen] = useState(false);
  const [isAddFinanceEntryModalOpen, setIsAddFinanceEntryModalOpen] = useState(false);

  const [myFleets, setMyFleets] = useState<Array<Asset & { status: string; earnings: number }>>([]);
  const [myCrew, setMyCrew] = useState<CrewMember[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };
  const [myExpenses, setMyExpenses] = useState<any[]>([]); // New State for Expenses

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    data?: {
      assetTitle: string;
      crewName: string;
      pickupDate: string;
      pickupTime: string;
    };
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [isLoadingFleets, setIsLoadingFleets] = useState(true);
  const [isLoadingGeneric, setIsLoadingGeneric] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [teamRole, setTeamRole] = useState<'Dispatcher' | 'Accountant' | null>(null);

  // Role-gated navigation — derived synchronously from teamRole
  const ROLE_SECTIONS: Record<string, string[]> = {
    Dispatcher: ['overview', 'messages', 'registry', 'crew', 'dispatch', 'tracking', 'bookings', 'calendar'],
    Accountant: ['overview', 'finance', 'reports'],
  };
  const allowedSections = teamRole ? ROLE_SECTIONS[teamRole] : null;
  const filteredMenuItems = allowedSections
    ? MENU_ITEMS.filter(item => {
      if (item.id) return allowedSections.includes(item.id);
      if (item.subItems) return item.subItems.some((sub: any) => allowedSections.includes(sub.id));
      return false;
    })
    : MENU_ITEMS;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      checkAccess(session);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAccess(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check URL for action parameter to auto-open Add Fleet modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add_fleet') {
      setActiveTab('registry');
      setIsAddFleetModalOpen(true);

      // Clean up the URL without triggering a reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, hasAccess]);

  const checkAccess = async (session: any) => {
    if (session?.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, linked_owner_id, team_role')
          .eq('id', session.user.id)
          .single();

        // Team member: linked to an owner's workspace
        if (profile?.linked_owner_id) {
          setHasAccess(true);
          const role = profile.team_role as 'Dispatcher' | 'Accountant' | null;
          setTeamRole(role);
          // Fetch the OWNER's data so the member sees the owner's workspace
          fetchDashboardData(profile.linked_owner_id);
          return;
        }

        // Regular fleet owner
        if (profile?.role === 'LISTER') {
          setHasAccess(true);
          setTeamRole(null);
          fetchDashboardData(session.user.id);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error verifying dashboard access:', error);
        setHasAccess(false);
      }
    } else {
      setHasAccess(false);
    }
  };

  const fetchDashboardData = async (uid: string) => {
    setIsLoadingFleets(true);
    try {
      await Promise.all([
        fetchFleets(uid),
        fetchCrew(uid),
        fetchBookings(uid),
        fetchTransactions(uid)
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setIsLoadingFleets(false);
    }
  };

  const fetchTransactions = async (uid: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('owner_id', uid)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    if (data) {
      setMyExpenses(data.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        date: t.date,
        category: t.category || 'Other',
        description: t.description,
        assetId: t.asset_id,
        reference: t.reference
      })));
    }
  };

  const fetchFleets = async (uid: string) => {
    const { data, error } = await supabase.from('assets').select('*').eq('owner_id', uid);
    if (data) {
      const mapped = data.map((dbAsset: any) => ({
        ...dbAsset, // Mapping logic from DB to Asset type
        id: dbAsset.id,
        title: dbAsset.title,
        type: dbAsset.type,
        price: Number(dbAsset.price),
        priceDuration: dbAsset.price_duration,
        tripDuration: dbAsset.trip_duration,
        imageUrl: dbAsset.image_url,
        location: dbAsset.location,
        country: dbAsset.country,
        state: dbAsset.state,
        coordinates: { lat: dbAsset.lat || 0, lng: dbAsset.lng || 0 },
        rating: Number(dbAsset.rating),
        reviewCount: dbAsset.review_count,
        isAvailable: dbAsset.is_available,
        description: dbAsset.description,
        features: dbAsset.features || [],
        nextServiceDate: dbAsset.next_service_date,
        specs: dbAsset.specs || { capacity: 4, crewIncluded: false },
        licensePlate: dbAsset.license_plate,
        owner: { name: 'Me', isVerified: true, type: 'COMPANY' },
        ratingCategories: {},
        reviews: [],
        crewIds: [],
        status: dbAsset.status, // Map status from DB
        earnings: 0, // Placeholder, updated in specialized Effect
        documents: dbAsset.documents || { registration: '', insurance: '' } // Ensure documents are mapped
      }));
      setMyFleets(mapped);
    }
  };

  // Map real earnings to fleets dynamically based on loaded Bookings
  useEffect(() => {
    if (myFleets.length > 0 && myBookings.length > 0) {
      setMyFleets(currentFleets => {
        // Only update if earnings logic requires changing to prevent infinite loop
        let hasChanges = false;
        const updatedFleets = currentFleets.map(fleet => {
          const fleetBookings = myBookings.filter(b => b.assetId === fleet.id && b.status === "Completed");
          const calculatedEarnings = fleetBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

          if (fleet.earnings !== calculatedEarnings) {
            hasChanges = true;
            return { ...fleet, earnings: calculatedEarnings };
          }
          return fleet;
        });

        return hasChanges ? updatedFleets : currentFleets;
      });
    }
  }, [myBookings]);

  const fetchCrew = async (uid: string) => {
    // Assuming 'crew' table exists, logic remains same
    console.log("Fetching Crew for Owner:", uid);
    const { data, error } = await supabase.from('crew_members').select('*').eq('owner_id', uid);

    if (error) {
      console.error("Error fetching crew:", error);
      return;
    }

    console.log("Raw Crew Data:", data);

    if (data) {
      const mappedCrew = data.map((c: any) => ({
        id: c.id,
        ownerId: c.owner_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        whatsapp_number: c.whatsapp_number,
        role: c.role,
        assetType: c.asset_type,
        licenseNumber: c.license_number,
        licenseType: c.license_type || 'Standard License',
        status: c.status,
        avatarUrl: c.avatar_url,
        yearsExperience: c.years_experience,
        expiryDate: c.expiry_date,
        assignedAssetId: c.assigned_asset_id,
        assignedAssetIds: c.assigned_asset_ids, // New mapping
        documents: c.documents
      }));
      setMyCrew(mappedCrew);
    } else {
      setMyCrew([]);
    }
  };

  const fetchBookings = async (uid: string) => {
    // USE SECURE RPC FUNCTION to bypass RLS complexity
    console.log("Fetching bookings for owner:", uid);
    const { data, error } = await supabase.rpc('get_owner_bookings', { p_owner_id: uid });

    console.log("RPC Response:", { data, error });

    if (error) {
      console.error("Error fetching bookings via RPC:", error);
      // Fallback to old method if RPC fails (e.g. script not run yet)
      return;
    }

    if (data) {
      const mappedBookings = data.map((b: any) => ({
        id: b.id,
        bookingCode: b.booking_code,
        clientName: b.client_name || 'Guest User',
        clientAvatar: b.client_avatar,
        clientId: b.client_id,
        assetId: b.asset_id,
        assetTitle: b.asset_title,
        assetImage: b.asset_image,
        pickupDate: b.start_date,
        pickupTime: b.pickup_time || '12:00 PM',
        pickupLocation: b.pickup_location,
        dropoffLocation: b.dropoff_location,
        returnDate: b.end_date,
        totalAmount: b.total_amount,
        status: b.status as BookingStatus,
        paymentStatus: b.payment_status || 'Pending',
        requestedOn: b.created_at,
        assignedCrewId: b.assigned_crew_id,
        guests: b.metadata?.guests || 1 // Extract guest count
      }));
      setMyBookings(mappedBookings);
    }
  };

  const handleOpenAddFleet = () => {
    setEditingFleet(null);
    setIsAddFleetModalOpen(true);
  };

  const handleSaveFleet = (fleet: Partial<Asset>) => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) fetchFleets(data.user.id);
    });
    setIsAddFleetModalOpen(false);
    setEditingFleet(null);
    setActiveTab('registry');
  };

  const handleDeleteFleet = async (id: string) => {
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;

      setMyFleets(prev => prev.filter(f => f.id !== id));
      showAlert('Success', 'Asset deleted successfully.', 'success');
    } catch (error: any) {
      console.error('Delete failed:', error);
      showAlert('Delete Failed', 'Failed to delete asset: ' + error.message, 'error');
    }
  };

  const handleEditFleet = (id: string) => {
    const assetToEdit = myFleets.find(f => f.id === id);
    if (assetToEdit) {
      setEditingFleet(assetToEdit);
      setIsAddFleetModalOpen(true);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      // We use 'Cancelled' status instead of hard delete for records
      const { error } = await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id);
      if (error) throw error;

      // Refresh list
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) fetchBookings(data.user.id);
      });
      showAlert('Booking Cancelled', 'The booking has been successfully cancelled.', 'success');
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      showAlert('Cancellation Failed', 'Failed to cancel booking', 'error');
    }
  };

  const handleEditBooking = (id: string) => {
    setEditingBookingId(id);
  };

  const handleUpdateBooking = async (id: string, updates: Partial<Booking>) => {
    try {
      const updatePayload: any = { status: updates.status };
      if (updates.paymentStatus !== undefined) {
        updatePayload.payment_status = updates.paymentStatus;
      }

      const { error } = await supabase.from('bookings').update(updatePayload).eq('id', id);

      if (error) throw error;

      // Optimistic update
      setMyBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatePayload } : b));

    } catch (error) {
      console.error("Error updating booking:", error);
      showAlert('Update Failed', "Failed to update booking status.", 'error');
    }
  };

  const handleSaveBooking = async (booking: Partial<Booking>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Map to DB columns
      const dbBooking = {
        client_name: booking.clientName,
        asset_id: booking.assetId,
        asset_title: booking.assetTitle,
        asset_image: booking.assetImage,
        start_date: booking.pickupDate,
        pickup_time: booking.pickupTime,
        end_date: booking.returnDate,
        total_amount: booking.totalAmount,
        status: booking.status,
        payment_status: booking.paymentStatus,
        booking_code: `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        metadata: { guests: 1 } // Default metadata
      };

      const { error } = await supabase.from('bookings').insert(dbBooking);

      if (error) throw error;

      fetchBookings(user.id);
      setIsAddBookingModalOpen(false);
      showAlert('Booking Saved', 'Your offline booking was successfully recorded.', 'success');
    } catch (error: any) {
      console.error('Error saving booking:', error);
      showAlert('Save Failed', 'Failed to save booking: ' + error.message, 'error');
    }
  };

  const handleAssignCrew = async (bookingId: string, crewId: string) => {
    try {
      const { error } = await supabase.from('bookings').update({
        assigned_crew_id: crewId, // Fixed column name
        status: 'Assigned'
      }).eq('id', bookingId);

      if (error) throw error;

      // Optimistic update
      setMyBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Assigned', assignedCrewId: crewId } : b));

      // Show Success Modal
      const booking = myBookings.find(b => b.id === bookingId);
      const crew = myCrew.find(c => c.id === crewId);
      if (booking && crew) {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Dispatch Successful',
          message: 'Crew has been assigned and the asset is ready for deployment.',
          data: {
            assetTitle: booking.assetTitle,
            crewName: crew.name,
            pickupDate: booking.pickupDate,
            pickupTime: booking.pickupTime
          }
        });
      }

    } catch (error: any) {
      console.error('Error assigning crew:', error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Assignment Failed',
        message: error.message || 'Could not assign crew member. Please ensure the asset is available and try again.'
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    handleUpdateBooking(id, { status });
  };

  const handleAcceptBooking = async (id: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: 'Pending Payment' }).eq('id', id);
      if (error) throw error;
      setMyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Pending Payment' as BookingStatus } : b));

      const booking = myBookings.find(b => b.id === id);
      if (booking && booking.clientId) {

        // 1. In-App Notification
        await supabase.from('notifications').insert({
          user_id: booking.clientId,
          title: 'Booking Request Accepted 🎉',
          message: `The owner has accepted your request for ${booking.assetTitle}. Please proceed to payment to secure your dates.`,
          type: 'booking',
          link: '/account/trips'
        });

        // 2. Email Notification
        const { data: client } = await supabase.from('profiles').select('email').eq('id', booking.clientId).single();
        if (client?.email) {
          await supabase.functions.invoke('send-email', {
            body: { to: client.email, template: 'booking_accepted', data: { assetName: booking.assetTitle } }
          });
        }
      }
    } catch (error: any) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking');
    }
  };

  const handleRejectBooking = async (id: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: 'Rejected' }).eq('id', id);
      if (error) throw error;
      setMyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Rejected' as BookingStatus } : b));

      const booking = myBookings.find(b => b.id === id);
      if (booking && booking.clientId) {

        // 1. In-App Notification
        await supabase.from('notifications').insert({
          user_id: booking.clientId,
          title: 'Booking Request Declined',
          message: `The owner has declined your request for ${booking.assetTitle}. Your calendar dates have been freed.`,
          type: 'booking'
        });

        // 2. Email Notification
        const { data: client } = await supabase.from('profiles').select('email').eq('id', booking.clientId).single();
        if (client?.email) {
          await supabase.functions.invoke('send-email', {
            body: { to: client.email, template: 'booking_rejected', data: { assetName: booking.assetTitle } }
          });
        }
      }
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking');
    }
  };



  const handleDeleteCrew = (id: string) => {
    setDeleteCrewId(id);
  };

  const confirmDeleteCrew = async () => {
    if (!deleteCrewId) return;
    setIsDeletingCrew(true);
    try {
      const { error } = await supabase.from('crew_members').delete().eq('id', deleteCrewId);
      if (error) throw error;
      setMyCrew(prev => prev.filter(c => c.id !== deleteCrewId));
      setDeleteCrewId(null);
    } catch (error: any) {
      console.error('Error deleting crew:', error);
      alert('Failed to delete crew member');
    } finally {
      setIsDeletingCrew(false);
    }
  };

  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);

  const handleEditCrew = (id: string) => {
    const crew = myCrew.find(c => c.id === id);
    if (crew) {
      setSelectedCrew(crew);
      setIsAddCrewModalOpen(true);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview bookings={myBookings} fleets={myFleets} crew={myCrew} onNavigate={setActiveTab} />;
      case 'messages':
        return <Messages />;
      case 'registry':
        return <FleetRegistry fleets={myFleets} onDelete={handleDeleteFleet} onEdit={handleEditFleet} isLoading={isLoadingFleets} />;
      case 'crew':
        return <CrewRegistry
          crew={myCrew}
          onDelete={handleDeleteCrew}
          onEdit={handleEditCrew}
          availableFleets={myFleets}
        />;
      case 'bookings':
        return <BookingsList bookings={myBookings} crew={myCrew} onUpdateStatus={handleUpdateStatus} onDelete={handleDeleteBooking} onEdit={handleEditBooking} onAccept={handleAcceptBooking} onReject={handleRejectBooking} onInvoice={() => { }} isLoading={isLoadingGeneric} onAddBooking={() => setIsAddBookingModalOpen(true)} />;
      case 'calendar':
        return <BookingsCalendar bookings={myBookings} />;
      case 'dispatch':
        return <Dispatch bookings={myBookings} fleets={myFleets} crew={myCrew} onUpdateStatus={handleUpdateStatus} onAssignCrew={handleAssignCrew} />;
      case 'tracking':
        return <LiveTracking fleets={myFleets} bookings={myBookings} />;
      case 'finance':
        return <Finance bookings={myBookings} expenses={myExpenses} />;
      case 'reports':
        return <Reports bookings={myBookings} fleets={myFleets} />;
      case 'team':
        return <Team />;
      case 'support':
        return <Support />;
      case 'settings':
        return <Settings />;
      default:
        const activeItem = MENU_ITEMS.find(i => i.id === activeTab);
        return activeItem ? <SectionPlaceholder title={activeItem.label} icon={activeItem.icon} /> : null;
    }
  };

  const renderHeaderAction = () => {
    if (activeTab === 'messages' || activeTab === 'tracking' || activeTab === 'reports' || activeTab === 'team' || activeTab === 'support' || activeTab === 'settings') {
      return null;
    }
    if (activeTab === 'crew') {
      return (
        <button
          onClick={() => setIsAddCrewModalOpen(true)}
          className="px-4 py-2 bg-slate-900 dark:bg-red-600 text-white rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-red-700 transition-colors"
        >
          Add Crew Member
        </button>
      );
    }
    if (activeTab === 'bookings') {
      return (
        <button
          onClick={() => setIsAddBookingModalOpen(true)}
          className="px-4 py-2 bg-slate-900 dark:bg-red-600 text-white rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-red-700 transition-colors"
        >
          Add Bookings
        </button>
      );
    }
    if (activeTab === 'dispatch') {
      return (
        <button
          onClick={() => setIsAddDispatchModalOpen(true)}
          className="px-4 py-2 bg-slate-900 dark:bg-red-600 text-white rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-red-700 transition-colors"
        >
          Add New Dispatch
        </button>
      );
    }
    if (activeTab === 'finance') {
      return (
        <button
          onClick={() => setIsAddFinanceEntryModalOpen(true)}
          className="px-4 py-2 bg-slate-900 dark:bg-red-600 text-white rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-red-700 transition-colors"
        >
          Add New Entry
        </button>
      );
    }
    return (
      <button
        onClick={handleOpenAddFleet}
        className="px-4 py-2 bg-slate-900 dark:bg-red-600 text-white rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-red-700 transition-colors"
      >
        Add New Fleet
      </button>
    );
  };

  if (hasAccess === null) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
  }

  if (hasAccess === false) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Lister Dashboard Access Restricted</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
          This area is reserved for registered fleet owners. You must submit a lister application and be verified to access these tools.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Marketplace
          </Button>
          <Button onClick={() => window.location.href = '#/onboarding'}>
            Apply to List Fleet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-16 bottom-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 transform flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:block
      `}>
        <div className="flex flex-col h-full overflow-y-auto py-6 px-4">
          <div className="space-y-1 flex-1">
            {filteredMenuItems.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if (item.subItems) {
                      setExpandedMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                    } else if (item.id) {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${!item.subItems && activeTab === item.id
                    ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <div className="relative">
                    <item.icon className={`w-5 h-5 mr-3 ${!item.subItems && activeTab === item.id ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                    {item.id === 'messages' && unreadMessageCount > 0 && (
                      <span className="absolute -top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                    )}
                  </div>
                  {item.label}
                  {item.subItems && (
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${expandedMenus[item.label] ? 'rotate-90' : ''}`} />
                  )}
                </button>
                {item.subItems && expandedMenus[item.label] && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map(subItem => (
                      <button
                        key={subItem.id}
                        onClick={() => { setActiveTab(subItem.id); setIsSidebarOpen(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === subItem.id ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/10 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'}`}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Referral Promotional Banner (Inside Menu List, pinned to bottom) */}
          <div className="mt-auto pt-6 px-1">
            <div
              className="bg-gradient-to-br from-red-600 to-orange-500 rounded-xl p-3 text-white relative overflow-hidden group cursor-pointer shadow-md shadow-red-500/20"
              onClick={() => {
                setActiveTab('settings');
                setIsSidebarOpen(false);
              }}
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2"></div>

              {/* Reduced height content (horizontal layout) */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-none text-white mb-0.5">Refer a friend</h4>
                    <p className="text-[10px] text-white/90 leading-none">Earn credits for invites.</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>

        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Mobile Header Removed */}

        <div className={`${activeTab === 'messages' ? 'p-0 lg:p-8' : 'p-6 lg:p-8'}`}>
          {activeTab !== 'reports' && activeTab !== 'team' && activeTab !== 'support' && activeTab !== 'settings' && activeTab !== 'messages' && (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white capitalize">
                {activeTab === 'calendar' ? 'Bookings Calendar' : MENU_ITEMS.find(i => i.id === activeTab)?.label || activeTab}
              </h1>
              <div className="flex gap-3">
                {renderHeaderAction()}
              </div>
            </div>
          )}

          {renderContent()}
        </div>
      </main>

      <AccountMenuModal
        isOpen={isAccountMenuOpen}
        onClose={() => setIsAccountMenuOpen(false)}
        onNavigate={setActiveTab}
        onSwitchMode={() => {
          onSwitchMode();
          navigate('/');
        }}
        activeTab={activeTab}
      />

      <AddFleetModal
        isOpen={isAddFleetModalOpen}
        onClose={() => setIsAddFleetModalOpen(false)}
        onSuccess={handleSaveFleet}
        initialData={editingFleet}
      />

      <AddBookingModal
        isOpen={isAddBookingModalOpen}
        onClose={() => setIsAddBookingModalOpen(false)}
        onAdd={handleSaveBooking}
        availableAssets={myFleets}
        existingBookings={myBookings}
      />

      <AddCrewModal
        isOpen={isAddCrewModalOpen}
        onClose={() => {
          setIsAddCrewModalOpen(false);
          setSelectedCrew(null);
        }}
        onAdd={(newCrew) => {
          setMyCrew(prev => {
            const exists = prev.find(c => c.id === newCrew.id);
            if (exists) {
              return prev.map(c => c.id === newCrew.id ? newCrew : c);
            }
            return [...prev, newCrew];
          });
          fetchCrew((newCrew as any).ownerId);
        }}
        availableAssets={myFleets}
        initialData={selectedCrew}
      />

      {
        editingBookingId && myBookings.find(b => b.id === editingBookingId) && (
          <EditBookingModal
            isOpen={!!editingBookingId}
            onClose={() => setEditingBookingId(null)}
            booking={myBookings.find(b => b.id === editingBookingId)!}
            onUpdate={handleUpdateBooking}
          />
        )
      }

      <SavedAssetsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
      />

      <AddFinanceEntryModal
        isOpen={isAddFinanceEntryModalOpen}
        onClose={() => setIsAddFinanceEntryModalOpen(false)}
        onAdd={async (entry) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('transactions').insert({
              owner_id: user.id,
              type: entry.type,
              amount: parseFloat(entry.amount),
              date: entry.date,
              category: entry.category || 'Other',
              description: entry.description,
              asset_id: entry.assetId || null,
              reference: entry.reference || null
            });

            if (error) throw error;

            // Refresh transactions from DB
            fetchTransactions(user.id);
            setIsAddFinanceEntryModalOpen(false);
          } catch (err: any) {
            console.error('Failed to save finance entry:', err);
            showAlert('Save Failed', err.message || 'Could not save the entry.', 'error');
          }
        }}
        fleets={myFleets}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteCrewId}
        onClose={() => setDeleteCrewId(null)}
        onConfirm={confirmDeleteCrew}
        title="Remove Crew Member?"
        description="This action cannot be undone. The crew member will be permanently removed from your registry and unassigned from any assets."
        isDeleting={isDeletingCrew}
      />

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 lg:hidden px-6 py-3 safe-bottom">
        <div className="flex items-center justify-between">
          {/* Overview (Home) */}
          <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'overview' ? 'text-red-600 dark:text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500'}`}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Messages */}
          <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'messages' ? 'text-red-600 dark:text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500'}`}>
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </div>
            <span className="text-[10px] font-medium">Messages</span>
          </button>

          {/* Saved */}
          <button onClick={() => setIsSavedModalOpen(true)} className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors">
            <HeartIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Saved</span>
          </button>

          {/* Bookings */}
          <button onClick={() => setActiveTab('bookings')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'bookings' ? 'text-red-600 dark:text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500'}`}>
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">Bookings</span>
          </button>

          {/* Account (Opens Menu) */}
          <button onClick={() => setIsAccountMenuOpen(true)} className={`flex flex-col items-center gap-1 transition-colors ${isAccountMenuOpen ? 'text-red-600 dark:text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500'}`}>
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>
      </div>
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        data={statusModal.data}
      />
      <CustomAlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div >
  );
};
