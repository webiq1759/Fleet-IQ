
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, ShieldCheck, MapPin, Users, Gauge, Calendar, Check, AlertCircle, Fuel, Settings2, Wind, Thermometer, Bluetooth, Map, Camera, Sun, Music, Wifi, Phone, Tv, Bed, Utensils, Cigarette, Box, Droplets, Eye, Armchair } from 'lucide-react';
import { Asset } from '../types';
import { Button } from './Button';
import { usePreferences } from '../contexts/PreferencesContext';
import { DateRangePicker } from './DateRangePicker';

interface AssetDetailsModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({ asset, isOpen, onClose }) => {
  const { formatPrice } = usePreferences();
  const [tripDate, setTripDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset dates when opening
      setTripDate('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getFeatureIcon = (feature: string) => {
    const lower = feature.toLowerCase();
    const iconClass = "w-5 h-5 text-slate-400 mr-3";
    
    if (lower.includes('air cond') || lower.includes('ac') || lower.includes('climate')) return <Wind className={iconClass} />;
    if (lower.includes('heater') || lower.includes('heat')) return <Thermometer className={iconClass} />;
    if (lower.includes('bluetooth')) return <Bluetooth className={iconClass} />;
    if (lower.includes('nav') || lower.includes('gps')) return <Map className={iconClass} />;
    if (lower.includes('camera')) return <Camera className={iconClass} />;
    if (lower.includes('sunroof')) return <Sun className={iconClass} />;
    if (lower.includes('sound') || lower.includes('speaker') || lower.includes('audio')) return <Music className={iconClass} />;
    if (lower.includes('wifi') || lower.includes('wi-fi')) return <Wifi className={iconClass} />;
    if (lower.includes('phone')) return <Phone className={iconClass} />;
    if (lower.includes('tv') || lower.includes('screen') || lower.includes('entertainment')) return <Tv className={iconClass} />;
    if (lower.includes('bed') || lower.includes('sleep') || lower.includes('suite')) return <Bed className={iconClass} />;
    if (lower.includes('kitchen') || lower.includes('galley')) return <Utensils className={iconClass} />;
    if (lower.includes('smoking')) return <Cigarette className={iconClass} />;
    if (lower.includes('cargo') || lower.includes('basket')) return <Box className={iconClass} />;
    if (lower.includes('water') || lower.includes('jacuzzi')) return <Droplets className={iconClass} />;
    if (lower.includes('blind spot') || lower.includes('vision')) return <Eye className={iconClass} />;
    if (lower.includes('seat') || lower.includes('leather')) return <Armchair className={iconClass} />;
    
    return <Check className={iconClass} />;
  };

  if (!isOpen || !asset) return null;

  const serviceFee = asset.price * 0.005; // 0.5% fee
  const totalPrice = asset.price + serviceFee;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-950 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header / Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-2 bg-white/90 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 rounded-full shadow-sm backdrop-blur transition-all"
          >
            <X className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Image Gallery Hero */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full bg-slate-100 dark:bg-slate-900">
            <img 
              src={asset.imageUrl} 
              alt={asset.title} 
              className="w-full h-full object-cover"
            />
            {asset.owner.isVerified && (
              <div className="absolute bottom-4 left-4 sm:left-8 bg-white/90 dark:bg-black/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center shadow-lg">
                <ShieldCheck className="w-4 h-4 text-slate-900 dark:text-white mr-1.5" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Verified Asset</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-8">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title Section */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{asset.title}</h1>
                </div>
                <div className="flex items-center mt-2 text-slate-500 dark:text-slate-400 text-sm">
                   <span className="font-medium text-slate-900 dark:text-white flex items-center mr-1">
                      <Star className="w-4 h-4 text-slate-900 dark:text-white fill-slate-900 dark:fill-white mr-1" />
                      {asset.rating}
                   </span>
                   <span className="mx-1">·</span>
                   <span className="underline decoration-slate-300 dark:decoration-slate-700 cursor-pointer">{asset.reviewCount} reviews</span>
                   <span className="mx-1">·</span>
                   <span className="flex items-center">
                     <MapPin className="w-4 h-4 mr-1" />
                     {asset.location}
                   </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
                <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                   <Users className="w-6 h-6 text-slate-400 mb-2" />
                   <span className="text-xs text-slate-500">Capacity</span>
                   <span className="font-semibold text-slate-900 dark:text-white">{asset.specs.capacity} Guests</span>
                </div>
                {asset.specs.speed && (
                  <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Gauge className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500">Speed</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{asset.specs.speed}</span>
                  </div>
                )}
                <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                   <ShieldCheck className="w-6 h-6 text-slate-400 mb-2" />
                   <span className="text-xs text-slate-500">Crew</span>
                   <span className="font-semibold text-slate-900 dark:text-white">{asset.specs.crewIncluded ? 'Included' : 'None'}</span>
                </div>
                 {asset.specs.fuelType && (
                    <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Fuel className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">Fuel</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{asset.specs.fuelType}</span>
                    </div>
                 )}
                 {asset.specs.transmission && (
                    <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Settings2 className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">Trans.</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{asset.specs.transmission}</span>
                    </div>
                 )}
                 <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                   <Calendar className="w-6 h-6 text-slate-400 mb-2" />
                   <span className="text-xs text-slate-500">Availability</span>
                   <span className="font-semibold text-green-600 dark:text-green-400">{asset.isAvailable ? 'Available' : 'Booked'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">About this {asset.type.toLowerCase()}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {asset.description}
                </p>
              </div>

              {/* Features */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Fleet Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                  {asset.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-slate-600 dark:text-slate-300">
                      {getFeatureIcon(feature)}
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              
               {/* Owner Info */}
               <div className="border-t border-slate-100 dark:border-slate-800 pt-8 flex items-center">
                 <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {asset.owner.name.charAt(0)}
                 </div>
                 <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Managed by {asset.owner.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                       {asset.owner.type === 'COMPANY' ? 'Verified Fleet Operator' : 'Private Owner'} · Joined 2023
                    </p>
                 </div>
               </div>
            </div>

            {/* Right Column: Sticky Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(asset.price)}</span>
                    <span className="text-slate-500 dark:text-slate-400"> / trip</span>
                  </div>
                   <div className="flex items-center text-sm">
                      <Star className="w-4 h-4 text-slate-900 dark:text-white fill-slate-900 dark:fill-white mr-1" />
                      <span className="font-medium text-slate-900 dark:text-white">{asset.rating}</span>
                   </div>
                </div>

                {/* Date Inputs */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-visible mb-4 relative">
                   <div 
                      className="flex border-b border-slate-200 dark:border-slate-700 cursor-pointer"
                      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                   >
                      <div className="flex-1 p-3">
                         <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase mb-1 pointer-events-none">Trip Date</label>
                         <div className={`text-sm ${tripDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'} pointer-events-none`}>
                              {tripDate || 'Select a date'}
                         </div>
                      </div>
                   </div>
                   
                   <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase mb-1">Guests</label>
                      <select className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none">
                         <option>1 Guest</option>
                         <option>2 Guests</option>
                         {[...Array(Math.max(0, asset.specs.capacity - 2))].map((_, i) => (
                           <option key={i + 3}>{i + 3} Guests</option>
                         ))}
                      </select>
                   </div>

                   <DateRangePicker 
                      isOpen={isDatePickerOpen}
                      onClose={() => setIsDatePickerOpen(false)}
                      startDate={tripDate}
                      endDate={tripDate}
                      onDatesChange={(s) => setTripDate(s)}
                      singleSelection={true}
                   />
                </div>

                 <div className="mb-4 flex justify-between text-sm text-slate-600 dark:text-slate-400 px-1">
                     <span>Duration:</span>
                     <span className="font-semibold text-slate-900 dark:text-white">{asset.tripDuration} Hours</span>
                 </div>

                <Button fullWidth size="lg" className="mb-4">
                  {tripDate ? 'Rent' : 'Check availability'}
                </Button>

                {tripDate ? (
                   <div className="space-y-3">
                      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">You won't be charged yet</p>
                      
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                         <span className="underline decoration-slate-300">Base trip price</span>
                         <span>{formatPrice(asset.price)}</span>
                      </div>
                       <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                         <span className="underline decoration-slate-300">FleetIQ service fee</span>
                         <span>{formatPrice(serviceFee)}</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between font-bold text-slate-900 dark:text-white text-base">
                         <span>Total</span>
                         <span>{formatPrice(totalPrice)}</span>
                      </div>
                   </div>
                ) : (
                   <div className="flex items-start bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5 mr-2 shrink-0" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        This {asset.type.toLowerCase()} is in high demand. Enter a date to see accurate pricing and availability.
                      </p>
                   </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
