---
trigger: always_on
---

DASHBOARD CORE

AUTH-01
Name: User Authentication
Description: Login and access gating via AuthModal
Status: FROZEN
Derived From: AuthModal.tsx

DASH-01
Name: Dashboard Overviews
Description: Displays high-level metrics and summaries
Status: FROZEN
Derived From: Overview.tsx

DASH-02
Name: Global Navigation
Description: App-wide navigation and routing
Status: FROZEN
Derived From: Navbar.tsx

BOOKINGS & TRIPS

BOOK-01
Name: Bookings List
Description: View all bookings
Status: FROZEN
Derived From: BookingsList.tsx

BOOK-02
Name: Booking Creation
Description: Create new bookings via modal
Status: FROZEN
Derived From: AddBookingModal.tsx

BOOK-03
Name: Booking Confirmation
Description: Confirm booking actions
Status: FROZEN
Derived From: BookingConfirmationModal.tsx

TRIP-01
Name: Renter Trips View
Description: View renter trip history
Status: FROZEN
Derived From: renter/trips.tsx

DISPATCH & TRACKING

DISP-01
Name: Dispatch Management
Description: Assign and manage dispatch operations
Status: FROZEN
Derived From: Dispatch.tsx, AddDispatchModal.tsx

TRACK-01
Name: Live Tracking
Description: Real-time asset location display
Status: FROZEN
Derived From: LiveTracking.tsx, MapView.tsx

FLEET & ASSETS

FLEET-01
Name: Fleet Registry
Description: Register and manage fleet assets
Status: FROZEN
Derived From: FleetRegistry.tsx, AddFleetModal.tsx

ASSET-01
Name: Asset Details
Description: View asset information and media
Status: FROZEN
Derived From: AssetDetails.tsx, AssetDetailsModal.tsx

CREW & TEAM

CREW-01
Name: Crew Registry
Description: Manage drivers and crew
Status: FROZEN
Derived From: CrewRegistry.tsx, AddCrewModal.tsx

TEAM-01
Name: Team Management
Description: Manage internal team members
Status: FROZEN
Derived From: Team.tsx, AddTeamMemberModal.tsx

FINANCE

FIN-01
Name: Finance Dashboard
Description: Financial overview and records
Status: FROZEN
Derived From: Finance.tsx

FIN-02
Name: Finance Entry
Description: Add income and expenses
Status: FROZEN
Derived From: AddFinanceEntryModal.tsx

FIN-03
Name: Payments
Description: Payment flow
Status: FROZEN
Derived From: nomba.ts, payment.ts 

REPORTS

REP-01
Name: Reports & Analytics
Description: Operational and financial reports
Status: FROZEN
Derived From: Reports.tsx


COMMUNICATION & SUPPORT

MSG-01
Name: Messaging
Description: Internal messaging system
Status: FROZEN
Derived From: Messages.tsx, ContactHostModal.tsx


SUP-01
Name: Support & Help Center
Description: User support and help access
Status: FROZEN
Derived From: Support.tsx, HelpCenter.tsx

SETTINGS & PREFERENCES

SET-01
Name: Settings
Description: Application configuration
Status: FROZEN
Derived From: Settings.tsx

PREF-01
Name: User Preferences
Description: Theme and preference management
Status: FROZEN
Derived From: PreferencesModal.tsx, ThemeContext.tsx

WALL-01
Name: Wallet
Description: Withdrawal and payment
Status: FROZEN
Derived From: wallet.tsx

WALL-02
Name: Wallet
Description: Request payout
Status: FROZEN
Derived From:RequestPayoutModal.tsx

MOB-01
Mobile navigation
Description: mobile navigation for renters and fleet owners
Status: FROZEN
Derived From: Dashboard.tsx, RenterDashboard.tsx

MKT-01
Name: Marketplace
Description: Marketplace
Status: FROZEN
Derived From: Marketplace.tsx

HOST-01
Name: Host Profile Modal
Description: About host
Status: FROZEN
Derived From: HostProfileModal.tsx


PUB-01
Name: Host Booking page
Description: Fleet owner public booking page
Status: FROZEN
Derived From: PublicBookingPage.tsx

REF-01
Name: Referral System
Description: Refer and earn rewards
Status: FROZEN
Derived From: Referrals.tsx
