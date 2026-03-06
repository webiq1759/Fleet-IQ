
import React, { useState } from 'react';
import { Asset, Booking } from '../../types';
import { ConnectTrackerModal } from '../../components/ConnectTrackerModal';
import { Button } from '../../components/Button';
import { MapPin, Navigation, Signal, Wifi, Battery, Gauge, Zap, Search, Crosshair, List, Maximize2 } from 'lucide-react';
import { usePreferences } from '../../contexts/PreferencesContext';

interface LiveTrackingProps {
  fleets: Asset[];
  bookings: Booking[];
}

export const LiveTracking: React.FC<LiveTrackingProps> = ({ fleets, bookings }) => {
  // Simulate persistent state for integration
  const [isIntegrated, setIsIntegrated] = useState(() => {
    return localStorage.getItem('fleet_tracking_connected') === 'true';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const { formatPrice } = usePreferences();

  // Nigeria Bounds for Projection
  const MIN_LAT = 4.0;
  const MAX_LAT = 14.0;
  const MIN_LNG = 2.5;
  const MAX_LNG = 14.5;

  const getPosition = (lat: number, lng: number) => {
    const top = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 100;
    const left = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
    return { top: `${top}%`, left: `${left}%` };
  };

  const handleConnect = () => {
    localStorage.setItem('fleet_tracking_connected', 'true');
    setIsIntegrated(true);
  };

  const getAssetStatus = (assetId: string) => {
     // Check if asset is currently in a booking with status 'Trip' or 'Ongoing'
     const activeBooking = bookings.find(b => b.assetId === assetId && (b.status === 'Trip' || b.status === 'Ongoing'));
     if (activeBooking) return 'moving';
     return 'idle';
  };

  // Mock Telemetry Data Generator
  const getTelemetry = (asset: Asset) => {
    const status = getAssetStatus(asset.id);
    return {
        speed: status === 'moving' ? Math.floor(Math.random() * 80) + 40 : 0,
        fuel: Math.floor(Math.random() * 40) + 60,
        battery: Math.floor(Math.random() * 20) + 12, // Voltage
        engineLoad: status === 'moving' ? Math.floor(Math.random() * 30) + 40 : 0,
        temp: 85 + Math.floor(Math.random() * 10),
        status: status
    };
  };

  if (!isIntegrated) {
      return (
          <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
              <div className="max-w-md space-y-6">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <Signal className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                      <div className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full border-4 border-white dark:border-slate-950 animate-pulse"></div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Connect Your Fleet</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                      Integrate your existing GPS or IoT tracking system to enable real-time location monitoring, geofencing, and live telemetry on Fleet IQ.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 text-left">
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <Navigation className="w-6 h-6 text-red-500 mb-2" />
                          <h4 className="font-bold text-slate-900 dark:text-white">Live GPS</h4>
                          <p className="text-xs text-slate-500">Real-time asset positioning</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <Gauge className="w-6 h-6 text-blue-500 mb-2" />
                          <h4 className="font-bold text-slate-900 dark:text-white">Telemetry</h4>
                          <p className="text-xs text-slate-500">Speed, Fuel & Engine Health</p>
                      </div>
                  </div>

                  <Button size="lg" onClick={() => setIsModalOpen(true)}>
                      Connect Tracking System
                  </Button>
              </div>
              <ConnectTrackerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConnect={handleConnect} />
          </div>
      );
  }

  const telemetry = selectedAsset ? getTelemetry(selectedAsset) : null;

  return (
    <div className="h-[calc(100vh-140px)] flex bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-in fade-in duration-500">
        
        {/* Sidebar Asset List */}
        <div className={`
            absolute inset-y-0 left-0 z-20 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 flex flex-col
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Signal className="w-4 h-4 text-green-500" /> Live Fleet
                </h3>
                <div className="mt-2 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search asset ID or name..." 
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-900 dark:text-white"
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {fleets.map(asset => {
                    const status = getAssetStatus(asset.id);
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                        <div 
                            key={asset.id}
                            onClick={() => setSelectedAsset(asset)}
                            className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                isSelected ? 'bg-slate-50 dark:bg-slate-800/80 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">{asset.title}</h4>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    status === 'moving' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                    {status}
                                </span>
                            </div>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-2">
                                <MapPin className="w-3 h-3 mr-1" /> {asset.location}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-mono text-slate-400">ID: {asset.id}</span>
                                <div className="flex gap-2">
                                    <span className="flex items-center text-slate-600 dark:text-slate-300">
                                        <Battery className="w-3 h-3 mr-1" /> 12.4V
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Toggle Sidebar Button */}
        <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="absolute top-4 left-4 z-30 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500"
        >
            <List className="w-5 h-5" />
        </button>

        {/* Map Area */}
        <div className="flex-1 relative bg-slate-900 overflow-hidden">
             {/* Abstract Map Background (Dark Tech Style) */}
             <div className="absolute inset-0 pointer-events-none">
                 {/* Grid */}
                 <div className="absolute inset-0" 
                      style={{ 
                          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
                          backgroundSize: '40px 40px'
                      }} 
                 />
                 {/* Radar Sweep Effect */}
                 <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/5 to-transparent animate-scan pointer-events-none opacity-20"></div>
             </div>

             {/* Asset Pins */}
             {fleets.map((asset) => {
                const { top, left } = getPosition(asset.coordinates.lat, asset.coordinates.lng);
                const isSelected = selectedAsset?.id === asset.id;
                const status = getAssetStatus(asset.id);

                return (
                  <div
                    key={asset.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 group"
                    style={{ top, left }}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    {/* Ripple Effect for Moving Assets */}
                    {status === 'moving' && (
                         <div className="absolute inset-0 -m-4 bg-green-500/20 rounded-full animate-ping"></div>
                    )}
                    
                    <div className={`
                        relative flex flex-col items-center
                        ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}
                    `}>
                        <div className={`
                            w-3 h-3 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.5)]
                            ${status === 'moving' ? 'bg-green-500 shadow-green-500/50' : 'bg-amber-500'}
                        `}></div>
                        
                        {/* Label on Hover or Select */}
                        <div className={`
                            absolute top-4 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 whitespace-nowrap backdrop-blur-sm transition-opacity
                            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                        `}>
                            {asset.title}
                        </div>
                    </div>
                  </div>
                );
             })}

             {/* Bottom Telemetry Panel (Visible when asset selected) */}
             {selectedAsset && telemetry && (
                 <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-start mb-4">
                         <div>
                             <h3 className="font-bold text-white text-sm">{selectedAsset.title}</h3>
                             <p className="text-xs text-slate-400 font-mono">VIN: {selectedAsset.id}-8829</p>
                         </div>
                         <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-white">
                             <Maximize2 className="w-4 h-4" />
                         </button>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-black/40 p-2 rounded-lg border border-slate-800">
                             <div className="flex items-center text-slate-400 text-xs mb-1">
                                 <Gauge className="w-3 h-3 mr-1" /> Speed
                             </div>
                             <div className="text-xl font-mono font-bold text-white">
                                 {telemetry.speed} <span className="text-xs font-normal text-slate-500">km/h</span>
                             </div>
                         </div>
                         <div className="bg-black/40 p-2 rounded-lg border border-slate-800">
                             <div className="flex items-center text-slate-400 text-xs mb-1">
                                 <Zap className="w-3 h-3 mr-1" /> Fuel/Charge
                             </div>
                             <div className="text-xl font-mono font-bold text-white">
                                 {telemetry.fuel}<span className="text-xs font-normal text-slate-500">%</span>
                             </div>
                         </div>
                     </div>

                     <div className="space-y-2">
                         <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-400">Engine Status</span>
                             <span className={`font-bold ${telemetry.status === 'moving' ? 'text-green-400' : 'text-amber-400'}`}>
                                 {telemetry.status === 'moving' ? 'Running' : 'Idling'}
                             </span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-400">Driver</span>
                             <span className="text-white">Assigned</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-400">Last Update</span>
                             <span className="text-white flex items-center">
                                 <Wifi className="w-3 h-3 mr-1 text-green-500" /> Just now
                             </span>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    </div>
  );
};
