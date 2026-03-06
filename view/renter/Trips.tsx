import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Download, AlertCircle, FileText, Trash2, User as UserIcon, History, Loader2, MapPin, CreditCard, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { DashboardSkeleton } from '../../components/DashboardSkeleton';
import { supabase } from '../../supabaseClient';
import { initializeNombaPayment } from '../../utils/nomba';
import { Booking } from '../../types';
import { CancelBookingModal } from '../../components/CancelBookingModal';
import { ScheduledTripModal } from '../../components/ScheduledTripModal';
import { PaymentSelectionModal } from '../../components/PaymentSelectionModal';
import { ConfirmTripModal } from '../../components/ConfirmTripModal';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { MoreVertical } from 'lucide-react';

export const Trips = () => {
  const { formatPrice } = usePreferences();
  const { usdToNgnRate } = useExchangeRate();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedBookingForConfirm, setSelectedBookingForConfirm] = useState<Booking | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

  const [isScheduledModalOpen, setIsScheduledModalOpen] = useState(false);
  const [selectedScheduledTrip, setSelectedScheduledTrip] = useState<Booking | null>(null);

  const handleOpenScheduledModal = (trip: Booking) => {
    setSelectedScheduledTrip(trip);
    setIsScheduledModalOpen(true);
  };

  const handleOpenConfirmModal = (trip: Booking) => {
    setSelectedBookingForConfirm(trip);
    setIsConfirmModalOpen(true);
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setTrips([]);
        return;
      }

      // Fetch bookings with asset details and owner info
      // We assume 'assets' has 'owner_id' and we can fetch profile from there if relation exists, 
      // or we fetch owner_id and then separate query if needed. 
      // For now, let's try to get owner_id from assets.
      const { data, error } = await supabase
        .from('bookings')
        .select(`
                *,
                assets (
                  title,
                  image_url,
                  owner_id
                ),
                crew_members (*)
              `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch owner profiles separately to ensure we get names
        const ownerIds = [...new Set(data.map((b: any) => b.assets?.owner_id).filter(Boolean))];
        let ownersMap: Record<string, any> = {};

        if (ownerIds.length > 0) {
          const { data: owners } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, accepts_solana, solana_wallet_address')
            .in('id', ownerIds);

          if (owners) {
            ownersMap = owners.reduce((acc: any, owner: any) => {
              acc[owner.id] = owner;
              return acc;
            }, {});
          }
        }

        const mappedTrips: Booking[] = data.map((b: any) => {
          console.log('Processing booking:', b.id, 'Crew raw:', b.crew_members);
          const assetOwnerId = b.assets?.owner_id;
          const ownerProfile = assetOwnerId ? ownersMap[assetOwnerId] : null;

          // Helper to extract crew data safely
          const crewDataRaw = Array.isArray(b.crew_members) ? b.crew_members[0] : b.crew_members;

          const crew = crewDataRaw ? {
            name: crewDataRaw.name || crewDataRaw.full_name || 'Driver',
            phone: crewDataRaw.phone || crewDataRaw.phone_number || '',
            photo: crewDataRaw.photo || crewDataRaw.photo_url || crewDataRaw.avatar_url || null
          } : undefined;

          console.log('Mapped crew for', b.id, ':', crew);

          return {
            id: b.id,
            bookingCode: b.booking_code, // Ensure this exists in DB or generate
            clientId: b.client_id,
            clientName: user.user_metadata?.full_name || 'Me',
            crew: crew,
            assetId: b.asset_id,
            assetTitle: b.assets?.title || 'Unknown Asset',
            assetImage: b.assets?.image_url || '',
            pickupDate: b.start_date || b.pickup_date, // Handle legacy or correct column
            pickupTime: b.pickup_time,
            returnDate: b.end_date || b.return_date,
            pickupLocation: b.pickup_location,
            dropoffLocation: b.dropoff_location,
            guests: b.guest_count || b.metadata?.guests || 1, // Access metadata for guests
            totalAmount: b.total_amount,
            paymentStatus: b.payment_status,
            status: b.status,
            requestedOn: new Date(b.created_at).toISOString().split('T')[0],
            owner: ownerProfile ? {
              id: ownerProfile.id,
              name: ownerProfile.full_name,
              avatar_url: ownerProfile.avatar_url,
              acceptsSolana: ownerProfile.accepts_solana,
              solanaWalletAddress: ownerProfile.solana_wallet_address
            } : undefined
          };
        });
        setTrips(mappedTrips);
      }
    } catch (err) {
      console.error("Error fetching trips:", err);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = (trip: Booking) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice - ${trip.bookingCode || trip.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #e11d48; }
            .invoice-title { font-size: 32px; font-weight: bold; text-align: right; }
            .section { margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: 500; }
            table { w-full; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FleetIQ</div>
            <div class="invoice-title">INVOICE</div>
          </div>
          
          <div class="grid section">
            <div>
              <div class="label">Billed To</div>
              <div class="value">${trip.clientName}</div>
            </div>
            <div style="text-align: right;">
              <div class="label">Invoice #</div>
              <div class="value">${trip.bookingCode || trip.id.substring(0, 8).toUpperCase()}</div>
              <div class="label" style="margin-top: 10px;">Date</div>
              <div class="value">${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="label">Trip Details</div>
            <div class="grid">
              <div>
                <div class="label">Asset</div>
                <div class="value">${trip.assetTitle}</div>
              </div>
               <div>
                <div class="label">Provided By</div>
                <div class="value">${trip.owner?.name || trip.owner?.full_name || 'Fleet Owner'}</div>
              </div>
            </div>
            <div class="grid" style="margin-top: 15px;">
              <div>
                <div class="label">Pickup</div>
                <div class="value">${trip.pickupLocation || 'N/A'}</div>
                <div class="value" style="font-size: 14px; color: #666;">${trip.pickupDate} @ ${trip.pickupTime}</div>
              </div>
               <div>
                <div class="label">Dropoff</div>
                <div class="value">${trip.dropoffLocation || 'N/A'}</div>
                <div class="value" style="font-size: 14px; color: #666;">${trip.returnDate}</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rental Charge (${trip.assetTitle})</td>
                <td style="text-align: right;">${formatPrice(trip.totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total: ${formatPrice(trip.totalAmount)}
          </div>

          <div style="margin-top: 50px; text-align: center; color: #999; font-size: 12px;">
            Thank you for choosing FleetIQ.
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const handleConfirmTrip = async (booking: Booking) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.rpc('confirm_trip_completion', { p_booking_id: booking.id });

      if (error) throw error;

      // Fetch owner email for notification
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, assets(*)')
        .eq('id', booking.id)
        .single();

      if (bookingData?.assets?.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email, full_name, company_name')
          .eq('id', bookingData.assets.owner_id)
          .single();

        if (ownerProfile?.email) {
          await supabase.functions.invoke('send-email', {
            body: {
              to: ownerProfile.email,
              template: 'trip_completed',
              data: {
                ownerName: ownerProfile.company_name || ownerProfile.full_name || 'Fleet Owner',
                assetName: booking.assetTitle,
                bookingId: booking.id,
                renterName: booking.clientName
              }
            }
          });
        }
      }

      fetchTrips();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to confirm trip completion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializePayment = async (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    setIsPaymentModalOpen(true);
  };

  const handleMessageOwner = async (booking: Booking) => {
    try {
      if (!booking.owner?.id) {
        alert("Owner information not available for this trip.");
        return;
      }
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: exactConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('asset_id', booking.assetId)
        .or(`and(participant_a.eq.${user.id},participant_b.eq.${booking.owner.id}),and(participant_a.eq.${booking.owner.id},participant_b.eq.${user.id})`)
        .limit(1);

      let conversationId = exactConv && exactConv.length > 0 ? exactConv[0].id : null;

      if (!conversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            participant_a: user.id,
            participant_b: booking.owner.id,
            asset_id: booking.assetId,
            last_message: `Hello, I have a question regarding my booking ${booking.bookingCode || booking.id.substring(0, 8)}.`,
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();
        conversationId = newConv?.id;
      }

      navigate('/account/messages');
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat with the owner.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCancelModal = (booking: Booking) => {
    setSelectedBookingForCancel(booking);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (bookingId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Update Booking Status
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      // 2. Notify Fleet Owner (Send Message)
      const booking = trips.find(t => t.id === bookingId);
      if (booking?.owner?.id) {
        // Find existing conversation or create new one
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('asset_id', booking.assetId)
          .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
          .or(`participant_a.eq.${booking.owner.id},participant_b.eq.${booking.owner.id}`) // Note: logic might act up if not perfect syntax, but `or` helps.
          .maybeSingle();

        let conversationId = existingConv?.id;

        if (!conversationId) {
          // Create conversation
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              participant_a: user.id,
              participant_b: booking.owner.id,
              asset_id: booking.assetId,
              last_message: `Trip Cancelled`,
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();
          conversationId = newConv?.id;
        }

        if (conversationId) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: `TRIP CANCELLED: The booking ${booking.bookingCode || bookingId.substring(0, 8)} has been cancelled by the renter.\nReason: ${reason || 'No reason provided.'}`
          });
        }
      }

      // Optimistic update
      setTrips(prev => prev.map(t => t.id === bookingId ? { ...t, status: 'Cancelled' } : t));

      // Notify user success (optional, modal closes anyway)
      setIsCancelModalOpen(false); // Close modal on success
      setSelectedBookingForCancel(null); // Clear selected booking

    } catch (error) {
      console.error("Error cancelling trip:", error);
      alert("Failed to cancel trip.");
    }
  };

  const handleExportTransactions = () => {
    // Filter only paid/completed trips for transaction history
    const paidTrips = trips.filter(t => ['Paid', 'Completed', 'Trip', 'Ongoing', 'Assigned'].includes(t.status));

    if (paidTrips.length === 0) {
      alert("No paid transactions found to export.");
      return;
    }

    const headers = ["Reference ID", "Asset", "Date", "Amount (USD)", "Status"];
    const rows = paidTrips.map(t => [
      t.bookingCode || t.id.substring(0, 8),
      `"${t.assetTitle}"`,
      new Date(t.requestedOn).toLocaleDateString(),
      t.totalAmount,
      t.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fleet_iq_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bookings</h1>
          <p className="text-slate-500 dark:text-slate-400">View your past and upcoming journeys</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              className="pl-9 pr-4 py-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleExportTransactions}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export History</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton type="table" count={5} />
      ) : (
        <div className="bg-white dark:bg-slate-900 md:rounded-xl md:border md:border-slate-100 md:dark:border-slate-800 md:overflow-hidden md:shadow-sm -mx-4 sm:mx-0">

          {/* Mobile View (Cards) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {trips.length > 0 ? trips.map((trip) => (
              <div key={trip.id} className="p-4 bg-white dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">

                {/* Header: Asset & Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                      <img src={trip.assetImage} alt={trip.assetTitle} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{trip.assetTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        #{trip.bookingCode || trip.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300`}>
                    {trip.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date & Time</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-red-500" />
                      <span>{new Date(trip.pickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {trip.pickupTime}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatPrice(trip.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-2">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center justify-center">
                      <MoreVertical className="w-5 h-5" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 bottom-full mb-2 w-48 origin-bottom-right divide-y divide-slate-100 dark:divide-slate-700/50 rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="px-1 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleOpenScheduledModal(trip)}
                                className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                              >
                                View Details
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleMessageOwner(trip)}
                                className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                              >
                                <MessageSquare className="w-4 h-4 mr-2 opacity-70" />
                                Message Owner
                              </button>
                            )}
                          </Menu.Item>
                          {trip.status === 'Pending Payment' && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleInitializePayment(trip)}
                                  disabled={isProcessingPayment === trip.id}
                                  className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'text-red-500'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors`}
                                >
                                  {isProcessingPayment === trip.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Pay Now
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          {trip.status === 'Awaiting Confirmation' && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleOpenConfirmModal(trip)}
                                  disabled={isLoading}
                                  className={`${active ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500' : 'text-green-600'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-bold transition-colors`}
                                >
                                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Confirm Complete
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handlePrintInvoice(trip)}
                                className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                              >
                                <FileText className="w-4 h-4 mr-2 opacity-70" />
                                Invoice
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                        {['Pending', 'New', 'Pending Payment', 'Awaiting Approval', 'Assigned'].includes(trip.status) && (
                          <div className="px-1 py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleOpenCancelModal(trip)}
                                  className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500' : 'text-red-600 dark:text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2 opacity-70" />
                                  Cancel Trip
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        )}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>

              </div>
            )) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <History className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium">No bookings found</p>
              </div>
            )}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Asset Details</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Locations</th>
                  <th className="px-6 py-4">Guests</th>
                  <th className="px-6 py-4">Total Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trips.length > 0 ? trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Asset Details */}
                    <td className="px-6 py-4 max-w-[250px]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                          <img src={trip.assetImage} alt={trip.assetTitle} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate" title={trip.assetTitle}>{trip.assetTitle}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate" title={trip.bookingCode || trip.id}>
                            #{trip.bookingCode || trip.id.substring(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {trip.owner?.avatar_url ? (
                          <img src={trip.owner.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="Owner" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                            {(trip.owner?.full_name || trip.owner?.name || 'F').charAt(0)}
                          </div>
                        )}
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {trip.owner?.full_name || trip.owner?.name || 'Fleet Owner'}
                        </span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center text-xs font-medium">
                          <Calendar className="w-3 h-3 mr-1.5 text-slate-400" />
                          {new Date(trip.pickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex items-center text-xs">
                          <Clock className="w-3 h-3 mr-1.5 text-slate-400" />
                          {trip.pickupTime}
                        </div>
                      </div>
                    </td>

                    {/* Locations (Pickup / Dropoff) */}
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={trip.pickupLocation || 'Pickup Location'}>
                            {trip.pickupLocation || 'Pickup Location'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={trip.dropoffLocation || 'Dropoff Location'}>
                            {trip.dropoffLocation || trip.pickupLocation || 'Dropoff Location'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Guests */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        {trip.guests || 1}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {formatPrice(trip.totalAmount)}
                    </td>

                    {/* Status & Calendar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Always show View Details button for active/completed trips */}
                        {['New', 'Paid', 'Assigned', 'Trip', 'Ongoing', 'Awaiting Confirmation', 'Completed'].includes(trip.status) ? (
                          <button
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${trip.status === 'Completed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' :
                              (trip.status === 'Assigned' || trip.status === 'Ongoing' || trip.status === 'Trip') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200' :
                                trip.status === 'Awaiting Confirmation' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200' :
                                  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                              }`}
                            onClick={() => handleOpenScheduledModal(trip)}
                            title="View Trip Details"
                          >
                            <Calendar className="w-3 h-3" />
                            {trip.status}
                          </button>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${trip.status === 'Cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}>
                            {trip.status}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-6 py-4 text-right">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 top-10 mt-2 w-48 origin-top-right divide-y divide-slate-100 dark:divide-slate-700/50 rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div className="px-1 py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleOpenScheduledModal(trip)}
                                    className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                  >
                                    View Details
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleMessageOwner(trip)}
                                    className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2 opacity-70" />
                                    Message Owner
                                  </button>
                                )}
                              </Menu.Item>

                              {/* Pay Now */}
                              {(trip.status === 'New' || trip.status === 'Pending Payment') && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleInitializePayment(trip)}
                                      disabled={isProcessingPayment === trip.id}
                                      className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'text-red-500'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors`}
                                    >
                                      {isProcessingPayment === trip.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                      Pay Now
                                    </button>
                                  )}
                                </Menu.Item>
                              )}

                              {/* Confirm Trip */}
                              {trip.status === 'Awaiting Confirmation' && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleOpenConfirmModal(trip)}
                                      disabled={isLoading}
                                      className={`${active ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500' : 'text-green-600'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-bold transition-colors`}
                                    >
                                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                      Confirm Complete
                                    </button>
                                  )}
                                </Menu.Item>
                              )}

                              {/* Invoice Generator */}
                              {trip.status !== 'New' && trip.status !== 'Cancelled' && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handlePrintInvoice(trip)}
                                      className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                    >
                                      <FileText className="w-4 h-4 mr-2 opacity-70" />
                                      Print Invoice
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                            </div>

                            {['Pending', 'New', 'Pending Payment', 'Awaiting Approval', 'Assigned'].includes(trip.status) && (
                              <div className="px-1 py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleOpenCancelModal(trip)}
                                      className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500' : 'text-red-600 dark:text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2 opacity-70" />
                                      Cancel Trip
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            )}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-slate-300" />
                        <p>No bookings found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        booking={selectedBookingForCancel}
      />

      <ConfirmTripModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmTrip}
        booking={selectedBookingForConfirm}
        isConfirming={isLoading}
      />

      <ScheduledTripModal
        isOpen={isScheduledModalOpen}
        onClose={() => setIsScheduledModalOpen(false)}
        onConfirmTrip={selectedScheduledTrip ? () => {
          setIsScheduledModalOpen(false);
          // Small delay to let the ScheduledTripModal close animation finish before opening ConfirmModal
          setTimeout(() => {
            handleOpenConfirmModal(selectedScheduledTrip);
          }, 150);
        } : undefined}
        isConfirming={isLoading}
        trip={selectedScheduledTrip ? {
          id: selectedScheduledTrip.id,
          assetTitle: selectedScheduledTrip.assetTitle,
          pickupDate: selectedScheduledTrip.pickupDate,
          pickupTime: selectedScheduledTrip.pickupTime,
          pickupLocation: selectedScheduledTrip.pickupLocation,
          dropoffLocation: selectedScheduledTrip.dropoffLocation,
          status: selectedScheduledTrip.status,
          crew: selectedScheduledTrip.crew
        } : null}
      />

      <PaymentSelectionModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={selectedBookingForPayment}
      />
    </div>
  );
};
