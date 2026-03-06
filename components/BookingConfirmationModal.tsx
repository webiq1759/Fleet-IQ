import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, MapPin, Clock, Calendar, Loader2, Info } from 'lucide-react';
import { Asset } from '../types';
import { Button } from './Button';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

interface BookingConfirmationModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void; // This might be deprecated if we handle logic here
   asset: Asset;
   startDate: string;
   endDate: string;
   pickupTime: string;
   dropoffTime: string;
   pickupLocation: string;
   dropoffLocation: string;
   guests: number;
   totalPrice: number;
   serviceFee: number;
   days: number;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
   isOpen,
   onClose,
   onConfirm,
   asset,
   startDate,
   endDate,
   pickupTime,
   dropoffTime,
   pickupLocation,
   dropoffLocation,
   guests,
   totalPrice,
   serviceFee,
   days
}) => {
   const { formatPrice, currency } = usePreferences();
   const { user } = useAuth();
   const { openAuthModal } = useAuthModal();
   const [isProcessing, setIsProcessing] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<boolean>(false);
   const navigate = useNavigate();

   const handleRequestBooking = async () => {
      if (!user) {
         setError("You must be logged in to book.");
         return;
      }

      setIsProcessing(true);
      setError(null);

      try {
         // Generate BK- code
         const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
         const bookingCode = `BK-${randomStr}`;

         // 0. FINAL Availability Check (Server-Side)
         // This enforces the "Thirdly" rule: Block if asset OR crew is booked.
         console.log("Checking availability with:", {
            p_asset_id: asset.id,
            p_start_date: startDate,
            p_end_date: endDate
         });

         const { data: isAvailable, error: availabilityError } = await supabase.rpc('check_asset_availability', {
            p_asset_id: asset.id,
            p_start_date: startDate,
            p_end_date: endDate
         });

         if (availabilityError) {
            console.error("Availability Check Error:", availabilityError);
            setError("Could not verify availability. Please try again.");
            setIsProcessing(false);
            return;
         }

         if (!isAvailable) {
            setError("This asset or its crew is no longer available for the selected dates.");
            setIsProcessing(false);
            return;
         }

         // 1. Create "Pending" Booking in Database
         // We create this BEFORE payment so we can track it.
         const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .insert({
               asset_id: asset.id,
               user_id: user.id,
               client_id: user.id,
               booking_code: bookingCode,
               pickup_location: pickupLocation,
               dropoff_location: dropoffLocation || pickupLocation,
               pickup_time: pickupTime,

               start_date: startDate,
               end_date: endDate,
               total_amount: totalPrice,
               currency_code: currency.code, // Phase 1 Migration: Tag the native currency explicitly
               status: 'Awaiting Approval',
               metadata: {
                  guests
               }
            })
            .select()
            .single();

         if (bookingError) {
            console.error('Booking Creation Error:', bookingError);
            alert('Failed to create booking request: ' + bookingError.message);
            setIsProcessing(false);
            return;
         }

         if (!bookingData) throw new Error("Failed to create booking record.");

         // 2. Notify the Fleet Owner & Renter
         const emailData = {
            assetName: asset.title,
            renterName: user.user_metadata?.full_name || 'Valued Customer',
            renterEmail: user.email || 'guest@fleetiq.com',
            pickupLocation: pickupLocation,
            dropoffLocation: dropoffLocation || pickupLocation,
            pickupDate: startDate,
            pickupTime: pickupTime,
            returnDate: endDate,
            amount: totalPrice
         };

         // Fetch owner email
         const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', asset.owner.id)
            .single();

         // Send to Renter
         if (user?.email) {
            await supabase.functions.invoke('send-email', {
               body: { to: user.email, template: 'booking_request', data: emailData }
            });
         }

         // Send to Owner
         if (ownerProfile?.email) {
            await supabase.functions.invoke('send-email', {
               body: { to: ownerProfile.email, template: 'booking_request', data: emailData }
            });
         }

         // 3. Show Success Screen
         setSuccess(true);
      } catch (err: any) {
         console.error(err);
         let msg = err.message || "Booking request failed.";
         setError(msg);
      } finally {
         setIsProcessing(false);
      }
   };

   if (!isOpen) return null;

   if (success) {
      return createPortal(
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center p-8">
               <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Request Sent!</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Your request has been sent to the fleet owner for approval. You won't be charged until they accept.
               </p>
               <Button fullWidth onClick={() => {
                  setSuccess(false);
                  onClose();
                  navigate('/account/trips');
               }}>
                  View My Bookings
               </Button>
            </div>
         </div>,
         document.body
      );
   }

   return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
         <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !isProcessing && onClose()}
         />

         <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-xl">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request to Rent</h2>
               <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 disabled:opacity-50"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 overflow-y-auto">
               {/* Asset Summary */}
               <div className="flex gap-4 mb-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 dark:border-slate-800">
                     <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{asset.type}</p>
                     <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">{asset.title}</h4>
                     <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                        <ShieldCheck className="w-3 h-3 mr-1 text-green-600" />
                        Hosted by {asset.owner.name}
                     </div>
                  </div>
               </div>

               <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

               {/* Trip Details */}
               <h4 className="font-bold text-slate-900 dark:text-white mb-4">Your trip</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="flex gap-3">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                           <div className="font-medium text-slate-900 dark:text-white">Dates</div>
                           <div className="text-sm text-slate-500 dark:text-slate-400">{startDate} – {endDate}</div>
                        </div>
                     </div>
                     <div className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {days} Day{days > 1 ? 's' : ''}
                     </div>
                  </div>

                  <div className="flex justify-between items-start">
                     <div className="flex gap-3">
                        <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                           <div className="font-medium text-slate-900 dark:text-white">Times</div>
                           <div className="text-sm text-slate-500 dark:text-slate-400">
                              Pickup: {pickupTime} <br />
                              Drop-off: {dropoffTime}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-between items-start">
                     <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                           <div className="font-medium text-slate-900 dark:text-white">Locations</div>
                           <div className="text-sm text-slate-500 dark:text-slate-400">
                              Pickup: {pickupLocation || 'Not specified'} <br />
                              Drop-off: {dropoffLocation || 'Same as pickup'}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-between items-start">
                     <div>
                        <div className="font-medium text-slate-900 dark:text-white pl-8">Guests</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 pl-8">{guests} guest{guests > 1 ? 's' : ''}</div>
                     </div>
                  </div>
               </div>

               <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

               {/* Price Details */}
               <h4 className="font-bold text-slate-900 dark:text-white mb-4">Price details</h4>
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                     <span>{formatPrice(asset.price)} x {days} days</span>
                     <span>{formatPrice(asset.price * days)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                     <span className="underline decoration-slate-300">FleetIQ service fee</span>
                     <span>{formatPrice(serviceFee)}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between font-bold text-slate-900 dark:text-white text-base">
                     <span>Total</span>
                     <span>{formatPrice(totalPrice)}</span>
                  </div>
               </div>

               <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3 mb-6">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                     <p className="font-bold mb-1">You won't be charged yet</p>
                     <p className="opacity-90">The fleet owner must first accept or decline your request. Once confirmed, you will be notified to proceed with the payment to secure your booking.</p>
                  </div>
               </div>

               {error === "You must be logged in to book." ? (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center justify-between">
                     <span>You must be logged in to book.</span>
                     <button
                        onClick={() => openAuthModal('signup')}
                        className="font-bold underline hover:text-red-700 dark:hover:text-red-300 ml-2"
                     >
                        Sign up
                     </button>
                  </div>
               ) : error ? (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                     {error}
                  </div>
               ) : null}

               <div className="mt-8">
                  <Button
                     fullWidth
                     size="lg"
                     onClick={handleRequestBooking}
                     disabled={isProcessing}
                     className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
                  >

                     {isProcessing ? (
                        <>
                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                           Submitting Request...
                        </>
                     ) : (
                        `Request to Rent`
                     )}
                  </Button>
                  <p className="text-xs text-center text-slate-400 mt-3 px-4 leading-relaxed">
                     By selecting the button, I agree to the Host's rules, Ground rules for guests, and that FleetIQ will charge your payment method relative to the total amount.
                  </p>
               </div>
            </div>
         </div>
      </div>,
      document.body
   );
};
