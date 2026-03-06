
export enum AssetType {
  VEHICLE = 'Vehicle',
  HELICOPTER = 'Helicopter',
  YACHT = 'Yacht',
  TRUCK = 'Truck',
  PLANE = 'Plane',
  CONVOY = 'Convoy'
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLocation: string;
  date: string;
  rating: number;
  comment: string;
  cleanliness?: number;
  accuracy?: number;
  tripExperience?: number;
  communication?: number;
  value?: number;
}

export interface RatingCategories {
  cleanliness: number;
  accuracy: number;
  tripExperience: number;
  communication: number;
  value: number;
}

export interface HostFact {
  label: string;
  text: string;
  icon: 'school' | 'work' | 'song' | 'fun-fact' | 'pets' | 'language';
}

export interface CrewMember {
  id: string;
  ownerId?: string; // Added ownerId
  name: string;
  email: string; // Made required
  phone?: string;
  whatsapp_number?: string;
  role: string;
  assetType: AssetType;
  licenseNumber: string;
  licenseType: string;
  yearsExperience: number;
  expiryDate?: string;
  status: 'Pending' | 'Active' | 'Approved' | 'Rejected' | 'Busy' | 'On Leave'; // Added Pending/Rejected/Approved
  avatarUrl?: string; // Made optional
  assignedAssetId?: string; // The ID of the asset they operate
  assignedAssetIds?: string[]; // Array of assigned asset IDs
  documents?: {
    identity?: string;
    license?: string;
    certificate?: string;
  };
}

export interface Asset {
  id: string;
  title: string;
  type: AssetType;
  price: number;
  priceDuration?: '12h' | '24h';
  tripDuration: number; // in hours
  currency: string;
  imageUrl: string;
  gallery: string[];
  location: string;
  country?: string; // Added
  state?: string;   // Added
  coordinates: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  description: string;
  features: string[];
  nextServiceDate?: string; // ISO Date string YYYY-MM-DD
  specs: {
    capacity: number;
    speed?: string;
    range?: string;
    crewIncluded: boolean;
    fuelType?: string;
    transmission?: string;
  };
  licensePlate?: string;
  securityFeatures?: {
    included: boolean;
    count: number;
    type: string;
    armed: boolean;
  };
  owner: {
    id: string; // Added id
    name: string;
    isVerified: boolean;
    type: 'COMPANY' | 'INDIVIDUAL';
    avatarUrl?: string;
    isSuperhost?: boolean;
    joinedDate?: string;
    country?: string; // Added
    state?: string;   // Added
    reviewCount?: number;
    rating?: number;
    responseRate?: number;
    responseTime?: string;
    bio?: string;
    languages?: string[]; // Added
    work?: string; // Added
    funFacts?: HostFact[];
    acceptsSolana?: boolean; // Added for crypto payments
    solanaWalletAddress?: string; // Added for crypto payments
  };
  ratingCategories: RatingCategories;
  reviews: Review[];
  crewIds?: string[]; // IDs of crew members assigned to this asset
  starCounts?: { 1: number; 2: number; 3: number; 4: number; 5: number };
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Draft';
  convoyDetails?: Array<{
    id?: string;
    make: string;
    model: string;
    licensePlate: string;
    documentUrl: string;
    assignedCrewId?: string;
  }>;
  documents?: {
    registration?: string;
    insurance?: string;
    other?: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: 'RENTER' | 'LISTER' | 'ADMIN';
  avatarUrl: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export type BookingStatus = 'Awaiting Approval' | 'Pending Payment' | 'New' | 'Paid' | 'Assigned' | 'Trip' | 'Ongoing' | 'Awaiting Confirmation' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  bookingCode?: string; // BK-XXXXXXXX
  clientName: string;
  clientEmail?: string; // Added for email templates
  clientPhone?: string; // Added for dispatch
  clientAvatar?: string;
  clientId: string;
  assetId: string;
  assetTitle: string;
  assetImage: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  returnDate: string;
  totalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  status: BookingStatus;
  requestedOn: string;
  assignedCrewId?: string;
  guests?: number; // Added for guest count display
  owner?: {
    id?: string;
    name: string;
    full_name?: string;
    avatar_url?: string;
    acceptsSolana?: boolean;
    solanaWalletAddress?: string;
  }; // Added for owner info
}

// Onboarding Types
export type AccountType = 'INDIVIDUAL' | 'COMPANY';

export interface OnboardingState {
  accountType: AccountType;
  basicInfo: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth?: string; // Only for individual
  };
  companyInfo: {
    companyName: string;
    registrationNumber: string;
    taxId: string;
    website?: string;
    establishedDate?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  documents: {
    identityCard?: File | null; // For Individual: Passport/ID
    businessRegistration?: File | null; // For Company: CAC/Reg Cert
    proofOfAddress?: File | null;
    taxCertificate?: File | null;
  };
}

// Messaging & Notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'system' | 'payment' | 'alert' | 'message';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string; // db column
  senderId?: string; // alias for UI if needed, or just use sender_id
  content: string;
  created_at: string; // db column
  is_read: boolean;

  // UI helpers
  isMe?: boolean;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  asset_id?: string;
  last_message: string;
  last_message_at: string;
  unread_count?: number; // from DB function or computed

  // UI Computed properties
  participantName?: string;
  participantAvatar?: string;
  assetContext?: {
    id: string;
    title: string;
    imageUrl: string;
  };
}

// Wallet & Money Types
export interface Wallet {
  id: string;
  userId: string;
  currency: 'NGN' | 'USD';
  balance: number;
  balance_ngn?: number;
  status: 'active' | 'frozen';
  createdAt: string;
}

export type TransactionType = 'deposit' | 'escrow_hold' | 'escrow_release' | 'commission' | 'payout' | 'refund' | 'reserve_hold' | 'reserve_release' | 'dispute_freeze';

export interface WalletTransaction {
  id: string;
  walletId: string;
  bookingId?: string;
  type: TransactionType;
  amount: number;
  reference?: string;
  balanceAfter?: number;
  metadata?: any;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  owner_id: string;
  wallet_id: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  bank_details: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  urgency: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  created_at: string;
  updated_at: string;
  type?: 'Support' | 'Bug Report' | 'Feature Request'; // differentiate origin
}
