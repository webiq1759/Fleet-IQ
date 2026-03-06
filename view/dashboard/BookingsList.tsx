
import React from 'react';
import { Booking, BookingStatus } from '../../types';
import { usePreferences } from '../../contexts/PreferencesContext';
import { FileText, Edit2, Trash2, MapPin, Calendar, ChevronLeft, ChevronRight, Eye, User as UserIcon, X, Phone, Clock } from 'lucide-react';
import { DashboardSkeleton } from '../../components/DashboardSkeleton';
import { ScheduledTripModal } from '../../components/ScheduledTripModal';
import { CrewMember } from '../../types';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { MoreVertical } from 'lucide-react';

const MOBILE_PAGE_SIZE = 12;
const DESKTOP_PAGE_SIZE = 20;

interface BookingsListProps {
  bookings: Booking[];
  crew?: CrewMember[];
  onUpdateStatus: (id: string, newStatus: BookingStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onInvoice: (id: string) => void;
  isLoading?: boolean;
  onAddBooking?: () => void;
}

// Reusable Pagination Component
const Pagination: React.FC<{ page: number; totalPages: number; onPageChange: (p: number) => void }> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
      <span className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
          <Fragment key={p}>
            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-slate-400 text-xs">...</span>}
            <button
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${p === page
                ? 'bg-red-600 text-white'
                : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
            >
              {p}
            </button>
          </Fragment>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const BookingsList: React.FC<BookingsListProps> = ({ bookings, crew = [], onUpdateStatus, onDelete, onEdit, onAccept, onReject, isLoading, onAddBooking }) => {
  const { formatPrice } = usePreferences();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);
  const [isDetailSheetClosing, setIsDetailSheetClosing] = React.useState(false);
  const [detailBooking, setDetailBooking] = React.useState<Booking | null>(null);
  const [mobilePage, setMobilePage] = React.useState(1);
  const [desktopPage, setDesktopPage] = React.useState(1);

  // Filter to last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentBookings = bookings.filter(b => new Date(b.requestedOn) >= sixMonthsAgo);

  const mobileTotalPages = Math.ceil(recentBookings.length / MOBILE_PAGE_SIZE);
  const desktopTotalPages = Math.ceil(recentBookings.length / DESKTOP_PAGE_SIZE);
  const mobileBookings = recentBookings.slice((mobilePage - 1) * MOBILE_PAGE_SIZE, mobilePage * MOBILE_PAGE_SIZE);
  const desktopBookings = recentBookings.slice((desktopPage - 1) * DESKTOP_PAGE_SIZE, desktopPage * DESKTOP_PAGE_SIZE);

  const closeDetailSheet = () => {
    setIsDetailSheetClosing(true);
    setTimeout(() => {
      setIsDetailSheetOpen(false);
      setIsDetailSheetClosing(false);
    }, 280);
  };

  const openDetailSheet = (booking: Booking) => {
    setDetailBooking(booking);
    setIsDetailSheetOpen(true);
  };

  const handleOpenModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const getCrewDetails = (crewId?: string) => {
    if (!crewId) return undefined;
    const member = crew.find(c => c.id === crewId);
    if (!member) return undefined;
    return {
      name: member.name,
      phone: member.phone,
      photo: member.avatarUrl
    };
  };

  if (isLoading) {
    return <DashboardSkeleton type="table" count={5} />;
  }

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Awaiting Approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Pending Payment': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Assigned': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Trip': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Ongoing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Awaiting Confirmation': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'Completed': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const generateReceipt = (booking: Booking) => {
    // Professional A4 Invoice Template
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${booking.bookingCode || booking.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page { size: A4; margin: 0; }
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #fff; 
            color: #1e293b;
            -webkit-print-color-adjust: exact;
          }
          .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: auto;
            background: white;
            box-sizing: border-box;
            position: relative;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 60px;
          }
          .brand-logo {
            font-size: 24px;
            font-weight: 800;
            color: #e11d48;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
          }
          .brand-info {
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
          }
          .invoice-label {
            font-size: 32px;
            font-weight: 700;
            color: #0f172a;
            text-align: right;
            margin-bottom: 8px;
          }
          .invoice-meta {
            text-align: right;
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
          }
          .meta-row {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }
          .meta-label {
            font-weight: 500;
            color: #94a3b8;
          }
          
          .bill-to-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 1px solid #e2e8f0;
          }
          .bill-col-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 10px;
          }
          .client-name {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .client-detail {
            font-size: 14px;
            color: #64748b;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          th {
            text-align: left;
            padding: 12px 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            padding: 20px 0;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          .col-desc { width: 60%; }
          .col-qty { text-align: center; width: 10%; }
          .col-price { text-align: right; width: 30%; }
          
          .item-title {
            font-size: 15px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .item-sub {
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
          }
          
          .total-section {
            display: flex;
            justify-content: flex-end;
          }
          .total-box {
            width: 300px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            color: #64748b;
          }
          .grand-total {
            margin-top: 12px;
            padding-top: 16px;
            border-top: 2px solid #0f172a;
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            display: flex;
            justify-content: space-between;
          }
          
          .footer {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
          }
          
          .status-stamp {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-PAID { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .status-PENDING { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header">
            <div>
              <div class="brand-logo">FLEET IQ</div>
              <div class="brand-info">
                Premium Fleet Management<br>
                Lagos, Nigeria<br>
                support@fleetiq.com
              </div>
            </div>
            <div>
              <div class="invoice-label">INVOICE</div>
              <div class="invoice-meta">
                <div class="meta-row"><span class="meta-label">Invoice #:</span> <span>${booking.bookingCode || booking.id.substring(0, 8).toUpperCase()}</span></div>
                <div class="meta-row"><span class="meta-label">Date:</span> <span>${new Date().toLocaleDateString()}</span></div>
                <div class="meta-row"><span class="meta-label">Due Date:</span> <span>${booking.status === 'Paid' ? 'Paid' : new Date(booking.pickupDate).toLocaleDateString()}</span></div>
              </div>
            </div>
          </div>

          <div class="bill-to-section">
            <div style="flex: 1;">
              <div class="bill-col-title">Bill To</div>
              <div class="client-name">${booking.clientName}</div>
              <div class="client-detail">Client ID: ${booking.clientId ? booking.clientId.substring(0, 8) : 'N/A'}</div>
              <div class="client-detail">Standard Fleet Client</div>
            </div>
            <div style="text-align: right;">
              <div class="bill-col-title">Payment Status</div>
              <div class="status-stamp status-${(booking.paymentStatus === 'Paid' || ['Paid', 'Assigned', 'Trip', 'Ongoing', 'Awaiting Confirmation', 'Completed'].includes(booking.status)) ? 'PAID' : booking.paymentStatus.toUpperCase()}">
                ${(booking.paymentStatus === 'Paid' || ['Paid', 'Assigned', 'Trip', 'Ongoing', 'Awaiting Confirmation', 'Completed'].includes(booking.status)) ? 'PAID' : booking.paymentStatus.toUpperCase()}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-desc">Service Description</th>
                <th class="col-price">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="item-title">${booking.assetTitle} Booking</div>
                  <div class="item-sub">
                    Pickup: ${new Date(booking.pickupDate).toLocaleDateString()} at ${booking.pickupTime}<br>
                    Location: ${booking.pickupLocation} ${booking.dropoffLocation ? ` &rarr; ${booking.dropoffLocation}` : ''}<br>
                    Guest Count: ${booking.guests}
                  </div>
                </td>
                <td class="col-price">${formatPrice(booking.totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-box">
              <div class="total-row">
                <span>Subtotal</span>
                <span>${formatPrice(booking.totalAmount)}</span>
              </div>
              <div class="total-row">
                <span>Tax (0%)</span>
                <span>${formatPrice(0)}</span>
              </div>
              <div className="grand-total" style="margin-top: 12px; padding-top: 16px; border-top: 2px solid #0f172a; font-size: 20px; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between;">
                <span>Total Due</span>
                <span>${formatPrice(booking.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business. For any inquiries, please contact Fleet IQ Support.</p>
            <p>This is a computer-generated document and does not require a signature.</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      alert("Please allow popups to view the invoice.");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 pb-24 md:pb-0">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Bookings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">Manage incoming requests and trip statuses.</p>
          </div>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {bookings.length > 0 ? mobileBookings.map((booking) => (
            <div key={booking.id} className="p-4 bg-white dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">

              {/* Header: Asset & Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                    {booking.assetImage ? (
                      <img src={booking.assetImage} alt={booking.assetTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                        {(booking.assetTitle || 'A').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{booking.assetTitle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      #{booking.bookingCode || booking.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenModal(booking)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase ${getStatusColor(booking.status)}`}
                >
                  {booking.status}
                </button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date & Time</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    <span>{new Date(booking.pickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {booking.pickupTime}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total & Client</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatPrice(booking.totalAmount)} <span className="text-xs font-normal text-slate-500 truncate block sm:inline">({booking.clientName})</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons Menu */}
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
                              onClick={() => openDetailSheet(booking)}
                              className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors font-medium`}
                            >
                              <Eye className="w-4 h-4 mr-2 text-red-500" />
                              View Details
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => onEdit(booking.id)}
                              className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Booking
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => generateReceipt(booking)}
                              className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                            >
                              <FileText className="w-4 h-4 mr-2 opacity-70" />
                              Invoice
                            </button>
                          )}
                        </Menu.Item>
                      </div>

                      {booking.status === 'Awaiting Approval' && onAccept && onReject && (
                        <div className="px-1 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onAccept(booking.id)}
                                className={`${active ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500' : 'text-green-600'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-bold transition-colors`}
                              >
                                Accept
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onReject(booking.id)}
                                className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500' : 'text-red-600 dark:text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                              >
                                Reject
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      )}

                      {booking.status !== 'Awaiting Approval' && (
                        <div className="px-1 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onDelete(booking.id)}
                                className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500' : 'text-red-600 dark:text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                              >
                                <Trash2 className="w-4 h-4 mr-2 opacity-70" />
                                Delete Booking
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
              <p className="text-sm font-medium">No bookings found</p>
            </div>
          )}
        </div>
        {/* Mobile Pagination */}
        <div className="md:hidden">
          <Pagination page={mobilePage} totalPages={mobileTotalPages} onPageChange={setMobilePage} />
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4 min-w-[220px]">Asset Details</th>
                <th className="px-6 py-4 min-w-[200px]">Client</th>
                <th className="px-6 py-4 min-w-[180px]">Route</th>
                <th className="px-6 py-4">Guests</th>
                <th className="px-6 py-4 min-w-[160px]">Schedule</th>
                <th className="px-6 py-4 min-w-[160px]">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 min-w-[150px]">Requested On</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {desktopBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {booking.assetImage ? (
                          <img src={booking.assetImage} alt={booking.assetTitle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                            {(booking.assetTitle || 'A').charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{booking.assetTitle}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          #{booking.bookingCode || booking.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-3 overflow-hidden">
                        {booking.clientAvatar ? (
                          <img src={booking.clientAvatar} alt={booking.clientName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                            {(booking.clientName || 'G').charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{booking.clientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(booking.pickupLocation || booking.dropoffLocation) ? (
                      <div className="flex items-center text-xs text-slate-500">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate max-w-[150px]" title={`${booking.pickupLocation} -> ${booking.dropoffLocation}`}>
                          {booking.pickupLocation} {booking.dropoffLocation && `→ ${booking.dropoffLocation}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {booking.guests || 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    <div className="font-medium">{new Date(booking.pickupDate).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-500">{booking.pickupTime}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{formatPrice(booking.totalAmount)}</div>
                    <div className={`text-xs font-medium ${(booking.paymentStatus === 'Paid' || ['Paid', 'Assigned', 'Trip', 'Ongoing', 'Awaiting Confirmation', 'Completed'].includes(booking.status)) ? 'text-green-600' : 'text-amber-600'}`}>
                      {(booking.paymentStatus === 'Paid' || ['Paid', 'Assigned', 'Trip', 'Ongoing', 'Awaiting Confirmation', 'Completed'].includes(booking.status)) ? 'Paid' : booking.paymentStatus}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleOpenModal(booking)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors hover:opacity-80 active:scale-95 ${getStatusColor(booking.status)}`}
                      title="View Details"
                    >
                      {booking.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(booking.requestedOn).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
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
                                  onClick={() => handleOpenModal(booking)}
                                  className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                >
                                  View Details
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onEdit(booking.id)}
                                  className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit Booking
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => generateReceipt(booking)}
                                  className={`${active ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Invoice
                                </button>
                              )}
                            </Menu.Item>
                          </div>

                          {booking.status === 'Awaiting Approval' && onAccept && onReject && (
                            <div className="px-1 py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => onAccept(booking.id)}
                                    className={`${active ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500' : 'text-green-600'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors font-bold`}
                                  >
                                    Accept
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => onReject(booking.id)}
                                    className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500' : 'text-red-600 dark:text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                  >
                                    Reject
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          )}

                          {booking.status !== 'Awaiting Approval' && (
                            <div className="px-1 py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => onDelete(booking.id)}
                                    className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500' : 'text-red-600 dark:text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
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
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Desktop Pagination */}
        <div className="hidden md:block">
          <Pagination page={desktopPage} totalPages={desktopTotalPages} onPageChange={setDesktopPage} />
        </div>
      </div>

      {/* Mobile Booking Detail Sheet */}
      {isDetailSheetOpen && detailBooking && (
        <div className="fixed inset-0 z-[200] flex items-end md:hidden" onClick={closeDetailSheet}>
          <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isDetailSheetClosing ? 'opacity-0' : 'opacity-100'}`} />
          <div
            className={`relative w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto transition-transform duration-300 ease-in-out ${isDetailSheetClosing ? 'translate-y-full' : 'translate-y-0'}`}
            style={{ animation: isDetailSheetClosing ? 'none' : 'slideUp 0.3s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                  {detailBooking.assetImage
                    ? <img src={detailBooking.assetImage} alt={detailBooking.assetTitle} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">{(detailBooking.assetTitle || 'A').charAt(0)}</div>
                  }
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{detailBooking.assetTitle}</p>
                  <p className="text-xs text-slate-400 font-mono">#{detailBooking.bookingCode || detailBooking.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => closeDetailSheet()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getStatusColor(detailBooking.status)}`}>{detailBooking.status}</span>
              </div>

              {/* Amount */}
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Amount</p>
                <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">{formatPrice(detailBooking.totalAmount)}</p>
                <p className="text-xs text-slate-500 mt-1">Payment: {detailBooking.paymentStatus}</p>
              </div>

              {/* Client Info */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Client</p>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                    {detailBooking.clientAvatar
                      ? <img src={detailBooking.clientAvatar} alt={detailBooking.clientName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">{(detailBooking.clientName || 'G').charAt(0)}</div>
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{detailBooking.clientName}</p>
                    <p className="text-xs text-slate-400">ID: {detailBooking.clientId ? detailBooking.clientId.substring(0, 12) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Schedule</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>Start: {new Date(detailBooking.pickupDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {detailBooking.pickupTime && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Time: {detailBooking.pickupTime}</span>
                    </div>
                  )}
                  {detailBooking.returnDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>End: {new Date(detailBooking.returnDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Route */}
              {(detailBooking.pickupLocation || detailBooking.dropoffLocation) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Route</p>
                  <div className="space-y-2">
                    {detailBooking.pickupLocation && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{detailBooking.pickupLocation}</span>
                      </div>
                    )}
                    {detailBooking.dropoffLocation && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{detailBooking.dropoffLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Guests */}
              {detailBooking.guests && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Guests</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{detailBooking.guests} pax</span>
                </div>
              )}

              {/* Requested On */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested On</span>
                <span className="text-slate-600 dark:text-slate-300 text-xs">{new Date(detailBooking.requestedOn).toLocaleString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 pb-2">
                <button
                  onClick={() => { closeDetailSheet(); generateReceipt(detailBooking); }}
                  className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Invoice
                </button>
                <button
                  onClick={() => { closeDetailSheet(); onEdit(detailBooking.id); }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-600 rounded-xl text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScheduledTripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trip={selectedBooking ? {
          assetTitle: selectedBooking.assetTitle,
          pickupDate: selectedBooking.pickupDate,
          pickupTime: selectedBooking.pickupTime,
          pickupLocation: selectedBooking.pickupLocation,
          dropoffLocation: selectedBooking.dropoffLocation,
          status: selectedBooking.status,
          crew: getCrewDetails(selectedBooking.assignedCrewId)
        } : null}
      />
    </div>
  );
};
