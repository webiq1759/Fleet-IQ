import React, { useState } from 'react';
import { Booking, BookingStatus, Asset, CrewMember, AssetType } from '../../types';
import { Clock, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface DispatchProps {
   bookings: Booking[];
   fleets: Asset[];
   crew: CrewMember[];
   onUpdateStatus: (id: string, newStatus: BookingStatus) => void;
   onAssignCrew: (bookingId: string, crewId: string) => void;
}

export const Dispatch: React.FC<DispatchProps> = ({ bookings, fleets, crew, onUpdateStatus, onAssignCrew }) => {
   const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);

   // Filter for bookings that are New, Paid, or Assigned
   const dispatchQueue = bookings.filter(b => b.status === 'New' || b.status === 'Paid' || b.status === 'Assigned');
   const activeTrips = bookings.filter(b => b.status === 'Trip' || b.status === 'Ongoing');

   const getAssetType = (assetId: string) => {
      return fleets.find(f => f.id === assetId)?.type;
   };

   const getAvailableCrew = (booking: Booking) => {
      const type = getAssetType(booking.assetId);

      const requestedStart = new Date(`${booking.pickupDate}T${booking.pickupTime || '00:00:00'}`);
      const requestedEnd = new Date(`${booking.returnDate}T23:59:59`); // Assume end of day for return

      return crew.filter(c => {
         // 1. Basic Status Check
         if (c.status !== 'Active') return false;
         // 2. Asset Type Mismatch
         if (type && c.assetType !== type) return false;

         // 3. Availability/Overlap Check
         const hasConflict = bookings.some(b => {
            // Only check bookings where this crew member is assigned
            if (b.assignedCrewId !== c.id) return false;

            // Ignore Cancelled or Completed bookings (unless we want to enforce rest periods, but keep simple for now)
            if (b.status === 'Cancelled' || b.status === 'Completed' || b.status === 'New' || b.status === 'Paid') return false;

            // Ignore the booking itself if we are re-assigning (though UI might not allow re-assigning easily here)
            if (b.id === booking.id) return false;

            // Check Overlap
            const existingStart = new Date(`${b.pickupDate}T${b.pickupTime || '00:00:00'}`);
            const existingEnd = new Date(`${b.returnDate}T23:59:59`);

            return (requestedStart <= existingEnd) && (requestedEnd >= existingStart);
         });

         return !hasConflict;
      });
   };

   const handleCrewSelect = (bookingId: string, crewId: string) => {
      onAssignCrew(bookingId, crewId);
      setAssigningBookingId(null);
   };

   return (
      <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300 pb-24 md:pb-0">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Dispatch Queue */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[500px] md:h-[600px]">
               <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-xl">
                  <div>
                     <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dispatch Queue</h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400">Bookings waiting for assignment</p>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-900 dark:text-white font-bold text-sm">
                     {dispatchQueue.length}
                  </span>
               </div>

               <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                  {dispatchQueue.length > 0 ? dispatchQueue.map(booking => (
                     <div key={booking.id} className="p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900 transition-colors bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 md:w-10 md:h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                 <img src={booking.assetImage} alt={booking.assetTitle} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{booking.assetTitle}</h4>
                                 <span className="text-xs text-slate-500 dark:text-slate-400">ID: {booking.id.substring(0, 8)}...</span>
                              </div>
                           </div>
                           <span className={`text-[10px] md:text-xs px-2 py-1 rounded-full font-medium ${booking.assignedCrewId || getAssetType(booking.assetId) === AssetType.CONVOY ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                              }`}>
                              {getAssetType(booking.assetId) === AssetType.CONVOY ? 'Convoy Crew' : (booking.assignedCrewId ? 'Assigned' : 'Unassigned')}
                           </span>
                        </div>

                        {/* Renter Header Added Here */}
                        <div className="flex items-center gap-2 mb-3 mt-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                           <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                              {booking.clientAvatar ? (
                                 <img src={booking.clientAvatar} alt={booking.clientName} className="w-full h-full object-cover" />
                              ) : (
                                 <span className="text-[10px] font-bold text-slate-500">{booking.clientName?.charAt(0).toUpperCase() || 'R'}</span>
                              )}
                           </div>
                           <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {booking.clientName || 'Renter'}
                           </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                           <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {booking.pickupDate}
                           </div>
                           <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {booking.pickupTime}
                           </div>
                        </div>

                        <div className="flex gap-2">
                           {assigningBookingId === booking.id ? (
                              <div className="flex flex-col gap-2 w-full">
                                 <select
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs py-2 px-2 text-slate-900 dark:text-white h-10"
                                    onChange={(e) => {
                                       if (e.target.value) handleCrewSelect(booking.id, e.target.value);
                                    }}
                                    defaultValue=""
                                 >
                                    <option value="" disabled>Select Crew Member...</option>
                                    {getAvailableCrew(booking).length > 0 ? (
                                       getAvailableCrew(booking).map(c => (
                                          <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                       ))
                                    ) : (
                                       <option value="" disabled>No available crew for this asset type</option>
                                    )}
                                 </select>
                                 <button
                                    onClick={() => setAssigningBookingId(null)}
                                    className="text-xs text-red-500 hover:text-red-600 underline text-center py-1"
                                 >
                                    Cancel
                                 </button>
                              </div>
                           ) : (
                              <>
                                 {!booking.assignedCrewId && getAssetType(booking.assetId) !== AssetType.CONVOY ? (
                                    <button
                                       onClick={() => setAssigningBookingId(booking.id)}
                                       className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 md:py-2 rounded-md text-xs font-bold hover:opacity-90 transition-opacity"
                                    >
                                       Assign Crew
                                    </button>
                                 ) : (

                                    <button
                                       onClick={
                                          () => {
                                             if (booking.assignedCrewId || getAssetType(booking.assetId) === AssetType.CONVOY) {
                                                onUpdateStatus(booking.id, 'Trip');
                                             } else {
                                                alert("Cannot dispatch: No crew member assigned to this booking.");
                                             }
                                          }}
                                       disabled={!booking.assignedCrewId && getAssetType(booking.assetId) !== AssetType.CONVOY}
                                       className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${booking.assignedCrewId || getAssetType(booking.assetId) === AssetType.CONVOY
                                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                          }`}
                                    >
                                       {booking.assignedCrewId || getAssetType(booking.assetId) === AssetType.CONVOY ? 'Dispatch Asset' : 'Crew Required'}
                                    </button>
                                 )}
                              </>
                           )}
                        </div>
                     </div>
                  )) : (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <CheckCircle className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">All cleared! No pending dispatches.</p>
                     </div>
                  )}
               </div>
            </div>

            {/* Active Trips / Live Map Placeholder */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[500px] md:h-[600px]">
               <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 rounded-t-xl">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Operations</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Real-time status of deployed assets</p>
               </div>
               <div className="flex-1 p-4 relative bg-slate-100 dark:bg-slate-950/50">
                  {/* Mock Map Background */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                  {activeTrips.length > 0 ? (
                     <div className="space-y-3 relative z-10">
                        {activeTrips.map(trip => (
                           <div key={trip.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={`w-2 h-2 rounded-full ${trip.status === 'Ongoing' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                 <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{trip.assetTitle}</h4>
                                    <p className="text-xs text-slate-500">Client: {trip.clientName}</p>
                                 </div>
                              </div>
                              <button
                                 onClick={() => onUpdateStatus(trip.id, trip.status === 'Trip' ? 'Ongoing' : 'Awaiting Confirmation')}
                                 className="text-xs font-medium text-blue-600 hover:underline"
                              >
                                 {trip.status === 'Trip' ? 'Start Service' : 'Complete'}
                              </button>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <MapPin className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">No active trips currently.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div >
   );
};