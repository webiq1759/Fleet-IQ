import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, MapPin, Users, Calendar, Check, AlertCircle, Share, Heart, ArrowLeft, Trophy, Sparkles, Key, MessageSquare, Tag, CheckCircle, GraduationCap, Briefcase, Globe, Music, Lightbulb, PawPrint, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';
import { usePreferences } from '../contexts/PreferencesContext';
import { MOCK_ASSETS_DATA } from '../constants';
import { ContactHostModal } from '../components/ContactHostModal';
import { HostProfileModal } from '../components/HostProfileModal';
import { DateRangePicker } from '../components/DateRangePicker';
import { BookingConfirmationModal } from '../components/BookingConfirmationModal';

export const AssetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatPrice } = usePreferences();
  
  const asset = MOCK_ASSETS_DATA.find(a => a.id === id);

  const [tripDate, setTripDate] = useState('');
  const [guests, setGuests] = useState(1);

  // Picker States - Split for Desktop and Mobile to avoid conflicts
  const [isDesktopDatePickerOpen, setIsDesktopDatePickerOpen] = useState(false);
  const [isMobileDatePickerOpen, setIsMobileDatePickerOpen] = useState(false);
  
  // Mock Blocked Dates (e.g., booked dates)
  const [blockedDates] = useState(() => {
    const dates = [];
    const today = new Date();
    // Block 3 days starting 5 days from now
    for(let i=0; i<3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + 5 + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    // Block a weekend 12 days from now
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 12);
    dates.push(d2.toISOString().split('T')[0]);
    
    // Block some random days in next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10);
    dates.push(nextMonth.toISOString().split('T')[0]);
    
    return dates;
  });

  // Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Modal States
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isHostProfileOpen, setIsHostProfileOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!asset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Asset not found</h2>
        <Button onClick={() => navigate('/')}>Back to Marketplace</Button>
      </div>
    );
  }

  // Pricing Logic: Fixed Trip Price + 0.5% Service Fee
  const serviceFee = asset.price * 0.005;
  const totalPrice = asset.price + serviceFee;

  // Filter other assets for the host profile modal
  const otherAssetsByHost = MOCK_ASSETS_DATA.filter(a => a.owner.name === asset.owner.name && a.id !== asset.id);
  const listingsForModal = otherAssetsByHost.length > 0 ? otherAssetsByHost : MOCK_ASSETS_DATA.filter(a => a.id !== asset.id);

  const renderHostFactIcon = (iconName: string) => {
    switch (iconName) {
      case 'school': return <GraduationCap className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      case 'language': return <Globe className="w-5 h-5" />;
      case 'song': return <Music className="w-5 h-5" />;
      case 'fun-fact': return <Lightbulb className="w-5 h-5" />;
      case 'pets': return <PawPrint className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const handleReserve = () => {
    if (tripDate) {
      setIsBookingModalOpen(true);
    } else {
      // Determine which picker to open based on screen width check or just open mobile if hidden
      if (window.innerWidth < 1024) {
          setIsMobileDatePickerOpen(true);
          const mobileInput = document.getElementById('mobile-date-input');
          if (mobileInput) {
              mobileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      } else {
          setIsDesktopDatePickerOpen(true);
      }
    }
  };

  const handleConfirmBooking = () => {
    setIsBookingModalOpen(false);
    // In a real application, you would make an API call here
    alert(`Booking confirmed for ${asset.title}! A confirmation email has been sent.`);
    setTripDate('');
  };

  // Carousel Logic
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % asset.gallery.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? asset.gallery.length - 1 : prev - 1));
  };

  // Swipe Handlers
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  const RatingItem = ({ label, score, icon: Icon }: { label: string, score: number, icon: any }) => (
    <div className="flex flex-col pr-6 pl-2 border-l border-transparent first:border-l-0 min-w-[100px] md:min-w-0">
      <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">{label}</div>
      <div className="text-base font-bold text-slate-900 dark:text-white mb-2">{score}</div>
      <Icon className="w-7 h-7 text-slate-900 dark:text-white stroke-[1.5]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-24 lg:pb-20 transition-colors duration-200 relative">
      <div className="max-w-7xl mx-auto px-0 lg:px-8 py-0 lg:py-6">
        
        {/* Desktop Navigation & Header (Hidden on Mobile) */}
        <div className="hidden lg:block mb-6 px-4 lg:px-0">
           <button 
             onClick={() => navigate('/')} 
             className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors"
           >
             <ArrowLeft className="w-4 h-4 mr-1" />
             Back
           </button>
           <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{asset.title}</h1>
                 <div className="flex flex-wrap items-center mt-2 text-sm text-slate-500 dark:text-slate-400">
                   <span className="flex items-center font-medium text-slate-900 dark:text-white mr-1">
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
              <div className="flex items-center space-x-2">
                 <button className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                 </button>
                 <button className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">
                    <Heart className="w-4 h-4 mr-2" />
                    Save
                 </button>
              </div>
           </div>
        </div>

        {/* Carousel Gallery */}
        <div className="relative h-[300px] md:h-[500px] w-full lg:rounded-2xl overflow-hidden mb-0 lg:mb-8 group bg-slate-200 dark:bg-slate-800 select-none">
           <img 
              src={asset.gallery[currentImageIndex]} 
              alt={asset.title} 
              className="w-full h-full object-cover animate-in fade-in duration-300"
              key={currentImageIndex}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
           />

           {/* Mobile Only: Top Bar Overlays */}
           <div className="lg:hidden absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/40 to-transparent">
             <button 
                onClick={() => navigate('/')} 
                className="bg-white rounded-full p-2.5 shadow-md text-slate-900 hover:bg-slate-100 transition-colors"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="flex space-x-3">
                <button className="bg-white rounded-full p-2.5 shadow-md text-slate-900 hover:bg-slate-100 transition-colors">
                   <Share className="w-5 h-5" />
                </button>
                <button className="bg-white rounded-full p-2.5 shadow-md text-slate-900 hover:bg-slate-100 transition-colors">
                   <Heart className="w-5 h-5" />
                </button>
             </div>
           </div>
           
           {/* Navigation Arrows */}
           <button 
              onClick={(e) => { e.preventDefault(); prevImage(); }}
              className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-900/90 rounded-full items-center justify-center text-slate-900 dark:text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 z-10"
           >
              <ChevronLeft className="w-5 h-5" />
           </button>
           
           <button 
              onClick={(e) => { e.preventDefault(); nextImage(); }}
              className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-900/90 rounded-full items-center justify-center text-slate-900 dark:text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 z-10"
           >
              <ChevronRight className="w-5 h-5" />
           </button>

           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {asset.gallery.map((_, idx) => (
                  <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 shadow-sm ${
                          idx === currentImageIndex 
                          ? 'w-4 sm:w-6 bg-white' 
                          : 'w-1.5 sm:w-2 bg-white/60 hover:bg-white/80'
                      }`}
                  />
              ))}
           </div>
        </div>

        {/* Mobile: Asset Title & Info Section */}
        <div className="lg:hidden px-4 pt-4 pb-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
              {asset.title}
            </h1>
            <div className="flex flex-col gap-1">
                 <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                    Entire {asset.type.toLowerCase()} in {asset.location}
                 </h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">
                   {asset.specs.capacity} Guests · {asset.specs.speed ? `${asset.specs.speed} ·` : ''} {asset.specs.crewIncluded ? 'Crew Included' : 'Self Service'}
                 </p>
            </div>
            
            <div className="mt-4 flex items-center justify-between py-4 border-t border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center font-bold text-slate-900 dark:text-white">
                  <Star className="w-4 h-4 text-slate-900 dark:text-white fill-slate-900 dark:fill-white mr-1" />
                  {asset.rating} · <span className="ml-1 underline">{asset.reviewCount} reviews</span>
               </div>
            </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-4 lg:px-0">
           
           {/* Left Column: Details */}
           <div className="lg:col-span-2 space-y-10">
              {/* Stats Bar (Desktop Only) */}
              <div className="hidden lg:flex justify-between py-6 border-b border-slate-100 dark:border-slate-800">
                 <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{asset.type} hosted by {asset.owner.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                       {asset.specs.capacity} Guests · {asset.specs.speed ? `${asset.specs.speed} ·` : ''} {asset.specs.crewIncluded ? 'Crew Included' : 'Self Service'}
                    </p>
                 </div>
                 <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden">
                    {asset.owner.avatarUrl ? (
                      <img src={asset.owner.avatarUrl} alt={asset.owner.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                        {asset.owner.name.charAt(0)}
                      </div>
                    )}
                 </div>
              </div>

              {/* Highlights */}
              <div className="space-y-6 pt-4 lg:pt-0">
                 <div className="flex items-start">
                    <ShieldCheck className="w-6 h-6 text-slate-900 dark:text-white mt-1 mr-4" />
                    <div>
                       <h3 className="font-semibold text-slate-900 dark:text-white">Verified Asset</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-sm">This fleet has passed our rigorous safety and quality inspection.</p>
                    </div>
                 </div>
                 {asset.specs.crewIncluded && (
                    <div className="flex items-start">
                       <Users className="w-6 h-6 text-slate-900 dark:text-white mt-1 mr-4" />
                       <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">Expert Crew Included</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Experienced pilot and service staff are included in your booking.</p>
                       </div>
                    </div>
                 )}
                 <div className="flex items-start">
                    <Calendar className="w-6 h-6 text-slate-900 dark:text-white mt-1 mr-4" />
                    <div>
                       <h3 className="font-semibold text-slate-900 dark:text-white">Free Cancellation</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-sm">Cancel up to 48 hours before your trip for a full refund.</p>
                    </div>
                 </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About this {asset.type.toLowerCase()}</h2>
                 <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {asset.description}
                 </p>
              </div>

              {/* Mobile Availability */}
              <div className="lg:hidden" id="mobile-date-input">
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Availability</h2>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 relative">
                        <div 
                            className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 mb-4 cursor-pointer"
                            onClick={() => setIsMobileDatePickerOpen(!isMobileDatePickerOpen)}
                        >
                            <div className="flex-1 p-3">
                                <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase mb-1">Trip Date</label>
                                <div className={`text-sm ${tripDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                    {tripDate || 'Select a date'}
                                </div>
                            </div>
                        </div>
                         <DateRangePicker 
                            isOpen={isMobileDatePickerOpen}
                            onClose={() => setIsMobileDatePickerOpen(false)}
                            startDate={tripDate}
                            endDate={tripDate}
                            onDatesChange={(s) => {
                                setTripDate(s);
                            }}
                            blockedDates={blockedDates}
                            singleSelection={true}
                            className="w-full max-w-[300px] shadow-xl"
                            style={{ position: 'absolute', top: '5rem', left: '50%', transform: 'translateX(-50%)', right: 'auto' }}
                        />
                         <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                           <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase mb-1">Guests</label>
                           <select 
                              value={guests}
                              onChange={(e) => setGuests(Number(e.target.value))}
                              className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                           >
                              <option value={1}>1 Guest</option>
                              <option value={2}>2 Guests</option>
                              {[...Array(Math.max(0, asset.specs.capacity - 2))].map((_, i) => (
                                <option key={i + 3} value={i + 3}>{i + 3} Guests</option>
                              ))}
                           </select>
                        </div>
                        <div className="mt-4 flex justify-between text-sm">
                           <span className="text-slate-600 dark:text-slate-300">Trip Duration:</span>
                           <span className="font-medium text-slate-900 dark:text-white">{asset.tripDuration} Hours</span>
                        </div>
                    </div>
                  </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-10"></div>

              {/* Features */}
              <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">What this place offers</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                    {asset.features.map((feature, idx) => (
                       <div key={idx} className="flex items-center text-slate-600 dark:text-slate-300">
                          <Check className="w-5 h-5 text-slate-900 dark:text-white mr-3" />
                          {feature}
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800"></div>

              {/* Reviews Section */}
              <div className="pt-8">
                 <div className="flex flex-col items-center justify-center text-center mb-10">
                   <div className="flex items-center justify-center relative mb-4">
                      <div className="relative">
                        <span className="text-7xl font-bold text-slate-900 dark:text-white leading-none tracking-tighter">
                           {asset.rating}
                        </span>
                      </div>
                   </div>
                   <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Guest favorite</div>
                   <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-center">
                     One of the most loved assets on FleetIQ based on ratings, reviews, and reliability.
                   </p>
                </div>

                <div className="hidden md:flex justify-between gap-4 overflow-x-auto pb-4 mb-10 no-scrollbar">
                    <RatingItem label="Cleanliness" score={asset.ratingCategories.cleanliness} icon={Sparkles} />
                    <RatingItem label="Accuracy" score={asset.ratingCategories.accuracy} icon={CheckCircle} />
                    <RatingItem label="Check-in" score={asset.ratingCategories.checkIn} icon={Key} />
                    <RatingItem label="Communication" score={asset.ratingCategories.communication} icon={MessageSquare} />
                    <RatingItem label="Location" score={asset.ratingCategories.location} icon={MapPin} />
                    <RatingItem label="Value" score={asset.ratingCategories.value} icon={Tag} />
                </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                   {asset.reviews?.slice(0, 2).map((review) => (
                      <div key={review.id} className="flex flex-col">
                         <div className="flex items-center mb-4">
                            <img src={review.userAvatar} alt={review.userName} className="w-12 h-12 rounded-full object-cover mr-4" />
                            <div>
                               <h4 className="font-semibold text-slate-900 dark:text-white">{review.userName}</h4>
                               <p className="text-sm text-slate-500 dark:text-slate-400">{review.userLocation}</p>
                            </div>
                         </div>
                         <div className="flex items-center mb-2">
                            <div className="flex mr-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-slate-900 dark:fill-white text-slate-900 dark:text-white" />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">· {review.date}</span>
                         </div>
                         <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3">
                            {review.comment}
                         </p>
                         <button className="text-slate-900 dark:text-white font-semibold underline text-sm mt-2 text-left w-max">Show more</button>
                      </div>
                   ))}
                </div>
                
                <div className="mt-8">
                     <Button variant="outline" className="dark:bg-transparent dark:text-white dark:border-slate-700">Show all {asset.reviewCount} reviews</Button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 mt-12 pt-12"></div>

              {/* Host Section */}
              <section>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Meet your fleet owner</h2>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                     <div className="lg:col-span-5">
                        <div 
                          className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          onClick={() => setIsHostProfileOpen(true)}
                        >
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="w-28 h-28 rounded-full overflow-hidden relative mb-2">
                                    {asset.owner.avatarUrl ? (
                                        <img src={asset.owner.avatarUrl} alt={asset.owner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-4xl font-bold">{asset.owner.name.charAt(0)}</div>
                                    )}
                                    {asset.owner.isSuperhost && (
                                        <div className="absolute bottom-1 right-1 bg-[#E91E63] text-white p-1.5 rounded-full border-2 border-white dark:border-slate-900">
                                            <Award className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{asset.owner.name}</h3>
                                {asset.owner.isSuperhost && (
                                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                                        Superhost
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-6 pl-6 border-l border-slate-100 dark:border-slate-800">
                                <div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{asset.owner.reviewCount}</div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Reviews</div>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                                        {asset.owner.rating} <span className="text-base ml-1">*</span>
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Rating</div>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{asset.owner.joinedDate}</div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Years active</div>
                                </div>
                            </div>
                        </div>
                     </div>

                     <div className="lg:col-span-7 space-y-6">
                         <div>
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{asset.owner.name} is a Superhost</h3>
                             <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Superhosts are experienced, highly rated fleet owners who are committed to providing great experiences for guests.
                             </p>
                         </div>
                         
                         <div>
                             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Fleet owner details</h3>
                             <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                                 <li>Response rate: {asset.owner.responseRate}%</li>
                                 <li>Responds {asset.owner.responseTime}</li>
                             </ul>
                         </div>
                         
                         <Button onClick={() => setIsContactModalOpen(true)} className="bg-black hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white font-semibold px-6 py-3 rounded-lg">
                             Message fleet owner
                         </Button>
                     </div>
                 </div>

                 <div className="mt-10 border-t border-slate-100 dark:border-slate-800 pt-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            {asset.owner.funFacts?.map((fact, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <div className="text-slate-900 dark:text-white">
                                        {renderHostFactIcon(fact.icon)}
                                    </div>
                                    <span>
                                        {fact.label === 'School' ? 'School: ' : 
                                         fact.label === 'Work' ? 'Work: ' : 
                                         fact.label === 'Languages' ? 'Languages: ' : ''} 
                                        {fact.text}
                                    </span>
                                </div>
                            ))}
                         </div>
                         
                         <div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {asset.owner.bio}
                            </p>
                         </div>
                     </div>
                 </div>

                 <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-start gap-4">
                     <ShieldCheck className="w-6 h-6 text-slate-900 dark:text-white shrink-0" />
                     <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                        To protect your payment, never transfer money or communicate outside of the FleetIQ website or app.
                     </p>
                 </div>
              </section>

           </div>

           {/* Right Column: Sticky Booking Card (Desktop Only) */}
           <div className="hidden lg:block lg:col-span-1 relative">
              <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                       <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(asset.price)}</span>
                       <span className="text-slate-500 dark:text-slate-400"> / trip</span>
                    </div>
                 </div>

                 <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-visible mb-4 relative">
                    {/* Single Date Picker Toggle */}
                    <div 
                        className="flex border-b border-slate-200 dark:border-slate-700 cursor-pointer"
                        onClick={() => setIsDesktopDatePickerOpen(!isDesktopDatePickerOpen)}
                    >
                       <div className="flex-1 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase mb-1 pointer-events-none">Trip Date</label>
                          <div className={`text-sm ${tripDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'} pointer-events-none`}>
                              {tripDate || 'Select a date'}
                          </div>
                       </div>
                    </div>
                    
                    {/* Guests Selection */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
                       <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase mb-1">Guests</label>
                       <select 
                          value={guests}
                          onChange={(e) => setGuests(Number(e.target.value))}
                          className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                       >
                          <option value={1}>1 Guest</option>
                          <option value={2}>2 Guests</option>
                          {[...Array(Math.max(0, asset.specs.capacity - 2))].map((_, i) => (
                            <option key={i + 3} value={i + 3}>{i + 3} Guests</option>
                          ))}
                       </select>
                    </div>

                    {/* Popup Calendar */}
                    <DateRangePicker 
                        isOpen={isDesktopDatePickerOpen}
                        onClose={() => setIsDesktopDatePickerOpen(false)}
                        startDate={tripDate}
                        endDate={tripDate}
                        onDatesChange={(s) => {
                            setTripDate(s);
                        }}
                        blockedDates={blockedDates}
                        singleSelection={true}
                    />
                 </div>

                 <div className="mb-4 flex justify-between text-sm text-slate-600 dark:text-slate-400 px-1">
                     <span>Duration:</span>
                     <span className="font-semibold text-slate-900 dark:text-white">{asset.tripDuration} Hours</span>
                 </div>

                 <Button fullWidth size="lg" className="mb-4" onClick={handleReserve}>
                    {tripDate ? 'Rent' : 'Check availability'}
                 </Button>

                 {tripDate ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                       <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">You won't be charged yet</p>
                       <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                          <span className="underline decoration-slate-300">Base trip price</span>
                          <span>{formatPrice(asset.price)}</span>
                       </div>
                       <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                          <span className="underline decoration-slate-300">Service fee</span>
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
                        Enter a date to see accurate pricing and availability.
                      </p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
      
      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 lg:hidden z-40 safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
           <div>
              {tripDate ? (
                  <div className="flex flex-col">
                      <div className="flex items-baseline">
                         <span className="text-lg font-bold text-slate-900 dark:text-white underline decoration-slate-900 dark:decoration-white decoration-2 underline-offset-2">{formatPrice(totalPrice)}</span>
                      </div>
                      <span className="text-xs text-slate-500 underline">{tripDate?.split('-').slice(1).join('/')} · {asset.tripDuration}h</span>
                  </div>
              ) : (
                  <div className="flex flex-col">
                      <div className="flex items-baseline">
                         <span className="text-lg font-bold text-slate-900 dark:text-white underline decoration-slate-900 dark:decoration-white decoration-2 underline-offset-2">{formatPrice(asset.price)}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Trip</span>
                  </div>
              )}
           </div>
           
           <Button onClick={handleReserve} className="bg-[#E91E63] hover:bg-[#D81B60] text-white px-8 py-3 rounded-lg font-semibold text-base shadow-sm min-w-[140px]">
              Rent
           </Button>
        </div>
      </div>

      {/* Contact Host Modal */}
      <ContactHostModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        hostName={asset.owner.name}
        assetTitle={asset.title}
      />

      {/* Host Profile Modal */}
      <HostProfileModal 
         isOpen={isHostProfileOpen}
         onClose={() => setIsHostProfileOpen(false)}
         owner={asset.owner}
         listings={listingsForModal}
      />

      {/* Booking Confirmation Modal */}
      <BookingConfirmationModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onConfirm={handleConfirmBooking}
        asset={asset}
        tripDate={tripDate}
        guests={guests}
        totalPrice={totalPrice}
        serviceFee={serviceFee}
      />
    </div>
  );
};