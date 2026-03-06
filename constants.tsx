

import React from 'react';
import { Car, Plane, Anchor, Truck, Disc } from 'lucide-react';
import { AssetType, Asset, CrewMember, Booking } from './types';

export const CATEGORIES = [
  { label: 'All', icon: <Disc size={18} />, type: null },
  { label: 'Vehicles', icon: <Car size={18} />, type: AssetType.VEHICLE },
  { label: 'Yachts', icon: <Anchor size={18} />, type: AssetType.YACHT },
  { label: 'Aircraft', icon: <Plane size={18} />, type: AssetType.PLANE },
  { label: 'Trucks', icon: <Truck size={18} />, type: AssetType.TRUCK },
  { label: 'Helicopters', icon: <Disc size={18} />, type: AssetType.HELICOPTER },
];

export const LANGUAGES = [
  { code: 'en-US', name: 'English', region: 'United States' },
  { code: 'en-GB', name: 'English', region: 'United Kingdom' },
  { code: 'fr-FR', name: 'Français', region: 'France' },
  { code: 'es-ES', name: 'Español', region: 'España' },
  { code: 'pt-PT', name: 'Português', region: 'Portugal' },
  { code: 'de-DE', name: 'Deutsch', region: 'Deutschland' },
  { code: 'zh-CN', name: '中文', region: 'China' },
  { code: 'ja-JP', name: '日本語', region: 'Japan' },
];

export const CURRENCIES = [
  { code: 'USD', name: 'United States dollar', symbol: '$', rate: 1 },
  { code: 'NGN', name: 'Nigerian naira', symbol: '₦', rate: 1650 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
  { code: 'GBP', name: 'Pound sterling', symbol: '£', rate: 0.79 },
  { code: 'CAD', name: 'Canadian dollar', symbol: '$', rate: 1.35 },
  { code: 'AUD', name: 'Australian dollar', symbol: '$', rate: 1.52 },
  { code: 'AED', name: 'Emirati dirham', symbol: 'د.إ', rate: 3.67 },
  { code: 'ZAR', name: 'South African rand', symbol: 'R', rate: 18.85 },
  { code: 'JPY', name: 'Japanese yen', symbol: '¥', rate: 150.25 },
  { code: 'CHF', name: 'Swiss franc', symbol: 'Fr', rate: 0.88 },
  { code: 'GHS', name: 'Ghanaian cedi', symbol: 'GH₵', rate: 12.80 },
  { code: 'KES', name: 'Kenyan shilling', symbol: 'KSh', rate: 145.50 },
];


const MOCK_REVIEWS: any[] = [];

const DEFAULT_CATEGORIES = {
  cleanliness: 5.0,
  accuracy: 4.9,
  tripExperience: 5.0,
  communication: 5.0,
  value: 5.0
};

const DEFAULT_HOST_PROPS = {
  isSuperhost: true,
  joinedDate: '8', // years
  reviewCount: 640,
  rating: 4.97,
  responseRate: 100,
  responseTime: 'within an hour',
  bio: "Gentleman. Enjoys sports, music and innovation. Passionate about nature and clean spaces. Won't shy away from a good conversation. Core belief: Positivity is key to enlightenment.",
  funFacts: [
    { label: 'School', text: 'Gck', icon: 'school' },
    { label: 'Work', text: 'Real Estate. Royal mansion apartments', icon: 'work' },
    { label: 'Languages', text: 'English and French', icon: 'language' }
  ] as any[]
};

export const MOCK_CREW_DATA: CrewMember[] = [
  {
    id: 'c1',
    name: 'Capt. James Sterling',
    role: 'Pilot',
    assetType: AssetType.PLANE,
    licenseNumber: 'ATPL-998231',
    licenseType: 'Airline Transport Pilot License',
    yearsExperience: 15,
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    assignedAssetId: '1'
  },
  {
    id: 'c2',
    name: 'David Okafor',
    role: 'Chauffeur',
    assetType: AssetType.VEHICLE,
    licenseNumber: 'DL-NG-2234',
    licenseType: 'Professional Chauffeur License',
    yearsExperience: 8,
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    assignedAssetId: '2'
  },
  {
    id: 'c3',
    name: 'Capt. Elena Rossi',
    role: 'Yacht Captain',
    assetType: AssetType.YACHT,
    licenseNumber: 'MCA-MY-3000',
    licenseType: 'Master of Yachts 3000gt',
    yearsExperience: 12,
    status: 'Busy',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    assignedAssetId: '3'
  },
  {
    id: 'c4',
    name: 'Sarah Jenkins',
    role: 'Pilot',
    assetType: AssetType.HELICOPTER,
    licenseNumber: 'CPL-H-5542',
    licenseType: 'Commercial Helicopter Pilot',
    yearsExperience: 6,
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    assignedAssetId: '4'
  }
];

export const MOCK_ASSETS_DATA: Asset[] = [
  {
    id: '1',
    title: 'Gulfstream G650',
    type: AssetType.PLANE,
    price: 15000,
    priceDuration: '12h',
    tripDuration: 12,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1583067822606-44d5c942488e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1629813295847-f274a2aa283e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1559403848-154188b22e13?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Lagos, NG',
    coordinates: { lat: 6.5244, lng: 3.3792 },
    rating: 4.99,
    reviewCount: 24,
    isAvailable: true,
    description: 'Experience the pinnacle of business aviation. The Gulfstream G650 offers the perfect blend of speed, range, and comfort. With a spacious cabin designed for productivity and relaxation, you can travel non-stop to destinations worldwide.',
    features: ['Wi-Fi', 'Satellite Phone', 'Full Galley', 'Conference Table', 'Berthable Seats', 'Enclosed Lavatory'],
    specs: { capacity: 14, speed: '982 km/h', range: '7,000 nm', crewIncluded: true },
    owner: {
      name: 'Henry',
      isVerified: true,
      type: 'COMPANY',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
      ...DEFAULT_HOST_PROPS
    },
    ratingCategories: DEFAULT_CATEGORIES,
    reviews: MOCK_REVIEWS,
    crewIds: ['c1']
  },
  {
    id: '2',
    title: 'Mercedes G63 AMG',
    type: AssetType.VEHICLE,
    price: 850,
    priceDuration: '24h',
    tripDuration: 24,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Abuja, NG',
    coordinates: { lat: 9.0765, lng: 7.3986 },
    rating: 4.85,
    reviewCount: 112,
    isAvailable: true,
    description: 'Command the road with the iconic Mercedes-AMG G63. Combining legendary off-road capability with modern luxury and raw V8 power. Perfect for executive transport or making a statement at your next event.',
    features: ['V8 Biturbo', 'Leather Interior', 'Burmester Surround Sound', 'Rear Seat Entertainment', 'Chauffeur Available'],
    specs: { capacity: 5, speed: '220 km/h', crewIncluded: true },
    owner: {
      name: 'Prestige Rentals',
      isVerified: true,
      type: 'COMPANY',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      ...DEFAULT_HOST_PROPS
    },
    ratingCategories: { ...DEFAULT_CATEGORIES, accuracy: 4.8, value: 4.7 },
    reviews: MOCK_REVIEWS.slice(0, 2),
    crewIds: ['c2']
  },
  {
    id: '3',
    title: 'Azimut Grande 27M',
    type: AssetType.YACHT,
    price: 5500,
    priceDuration: '12h',
    tripDuration: 12,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1605281317010-fe5ffe79ba02?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Victoria Island, NG',
    coordinates: { lat: 6.4281, lng: 3.4219 },
    rating: 5.0,
    reviewCount: 8,
    isAvailable: false,
    description: 'Luxury knows no bounds on the Azimut Grande. This superyacht features a raised pilothouse and extensive deck space. Includes a full crew to cater to your every need, from gourmet dining to water sports.',
    features: ['Jacuzzi', 'Jet Skis', 'Master Suite', 'Stabilizers', 'Sundeck', 'Full Crew'],
    specs: { capacity: 10, crewIncluded: true },
    owner: {
      name: 'Sea Wolf Marine',
      isVerified: true,
      type: 'COMPANY',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
      ...DEFAULT_HOST_PROPS
    },
    ratingCategories: DEFAULT_CATEGORIES,
    reviews: MOCK_REVIEWS.slice(2, 4),
    crewIds: ['c3']
  },
  {
    id: '4',
    title: 'Bell 429 GlobalRanger',
    type: AssetType.HELICOPTER,
    price: 4200,
    priceDuration: '12h',
    tripDuration: 12,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1517427677506-ade074eb1432?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1517427677506-ade074eb1432?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1534177616072-ef7dc12044f9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517868674966-2679c946c551?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1486749969620-1a13fa4841c1?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Port Harcourt, NG',
    coordinates: { lat: 4.8156, lng: 7.0498 },
    rating: 4.7,
    reviewCount: 15,
    isAvailable: true,
    description: 'The Bell 429 offers exceptional speed, range, and hover performance. Its spacious cabin and flat floor make it ideal for VIP transport or medical evacuation. A smooth, quiet ride is guaranteed.',
    features: ['Twin Engine', 'Large Cargo Door', 'Noise Reduction', 'Air Conditioning', 'VIP Interior'],
    specs: { capacity: 7, speed: '287 km/h', crewIncluded: true },
    owner: {
      name: 'Skyway Logistics',
      isVerified: true,
      type: 'COMPANY',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      ...DEFAULT_HOST_PROPS
    },
    ratingCategories: { ...DEFAULT_CATEGORIES, cleanliness: 4.8 },
    reviews: MOCK_REVIEWS,
    crewIds: ['c4']
  },
  {
    id: '5',
    title: 'Scania R500 Heavy Hauler',
    type: AssetType.TRUCK,
    price: 400,
    priceDuration: '24h',
    tripDuration: 24,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1586191582119-2a90da3007f3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe2e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1578322646399-df20c4e72394?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Kano, NG',
    coordinates: { lat: 12.0022, lng: 8.5920 },
    rating: 4.6,
    reviewCount: 42,
    isAvailable: true,
    description: 'Reliable and powerful, the Scania R500 is built for the toughest logistics challenges. Equipped with advanced safety features and fuel efficiency optimization. Ideal for long-haul cargo transport.',
    features: ['V8 Engine', 'GPS Tracking', 'Insured Cargo', 'Experienced Driver', 'Air Suspension'],
    specs: { capacity: 2, crewIncluded: true },
    owner: {
      name: 'Haulage Pro',
      isVerified: true,
      type: 'COMPANY',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      ...DEFAULT_HOST_PROPS
    },
    ratingCategories: { ...DEFAULT_CATEGORIES, tripExperience: 4.5 },
    reviews: MOCK_REVIEWS,
    // Intentionally leaving crewIds undefined/empty to test filtering
  },
  {
    id: '6',
    title: 'Rolls Royce Cullinan',
    type: AssetType.VEHICLE,
    price: 2200,
    priceDuration: '24h',
    tripDuration: 24,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1555215696-99ac45e43d34?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1493238792015-1a419ac692c2?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Lagos, NG',
    coordinates: { lat: 6.4500, lng: 3.4000 },
    rating: 4.9,
    reviewCount: 31,
    isAvailable: true,
    description: 'The Rolls-Royce Cullinan is the first all-terrain SUV from Rolls-Royce. It offers an effortless "Magic Carpet Ride" on and off-road. The ultimate expression of luxury and capability.',
    features: ['Starlight Headliner', 'Champagne Cooler', 'Massage Seats', 'Privacy Glass', 'Bespoke Audio'],
    specs: { capacity: 4, crewIncluded: true },
    owner: {
      name: 'Elite Fleets',
      isVerified: true,
      type: 'COMPANY',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4fbc7527e057?auto=format&fit=crop&q=80&w=200',
      ...DEFAULT_HOST_PROPS
    },
    ratingCategories: DEFAULT_CATEGORIES,
    reviews: MOCK_REVIEWS,
    // Intentionally leaving crewIds undefined/empty
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK-7782',
    clientId: 'u101',
    clientName: 'Global Energy Ltd',
    clientAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    assetId: '1',
    assetTitle: 'Gulfstream G650',
    assetImage: MOCK_ASSETS_DATA[0].imageUrl,
    pickupDate: '2024-05-15',
    pickupTime: '08:00 AM',
    returnDate: '2024-05-15',
    totalAmount: 15000,
    paymentStatus: 'Paid',
    status: 'Assigned',
    requestedOn: '2024-05-10'
  },
  {
    id: 'BK-7783',
    clientId: 'u102',
    clientName: 'Alice Johnson',
    clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    assetId: '2',
    assetTitle: 'Mercedes G63 AMG',
    assetImage: MOCK_ASSETS_DATA[1].imageUrl,
    pickupDate: '2024-05-20',
    pickupTime: '10:00 AM',
    returnDate: '2024-05-22',
    totalAmount: 2550,
    paymentStatus: 'Paid',
    status: 'New',
    requestedOn: '2024-05-14'
  },
  {
    id: 'BK-7784',
    clientId: 'u103',
    clientName: 'Zenith Corp',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    assetId: '4',
    assetTitle: 'Bell 429 GlobalRanger',
    assetImage: MOCK_ASSETS_DATA[3].imageUrl,
    pickupDate: '2024-06-01',
    pickupTime: '09:00 AM',
    returnDate: '2024-06-01',
    totalAmount: 4200,
    paymentStatus: 'Pending',
    status: 'New',
    requestedOn: '2024-05-16'
  },
  {
    id: 'BK-7780',
    clientId: 'u104',
    clientName: 'Michael Brown',
    assetId: '2',
    assetTitle: 'Mercedes G63 AMG',
    assetImage: MOCK_ASSETS_DATA[1].imageUrl,
    pickupDate: '2024-05-01',
    pickupTime: '12:00 PM',
    returnDate: '2024-05-02',
    totalAmount: 850,
    paymentStatus: 'Paid',
    status: 'Completed',
    requestedOn: '2024-04-28'
  },
  {
    id: 'BK-7785',
    clientId: 'u105',
    clientName: 'Sarah Connor',
    assetId: '3',
    assetTitle: 'Azimut Grande 27M',
    assetImage: MOCK_ASSETS_DATA[2].imageUrl,
    pickupDate: '2024-06-10',
    pickupTime: '02:00 PM',
    returnDate: '2024-06-12',
    totalAmount: 11000,
    paymentStatus: 'Paid',
    status: 'Paid',
    requestedOn: '2024-05-18'
  }
];