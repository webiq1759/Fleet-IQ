
import React, { useState } from 'react';
import { Search, User, CreditCard, Shield, Car, ChevronRight, ChevronDown, FileText, Wallet, Settings, HelpCircle, ArrowRight, Smartphone, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: User,
    description: 'Create your account, verify identity, and set up your profile.',
    articles: [
      {
        title: 'How to create an account',
        content: 'To create an account, click "Sign Up" on the top right. You can register using your email or Google account. Once registered, you will need to verify your email address.'
      },
      {
        title: 'Identity verification process',
        content: 'Safety is our priority. To book or list assets, you must verify your identity by uploading a government-issued ID and a selfie. Verification typically takes less than 5 minutes.'
      },
      {
        title: 'Resetting your password',
        content: 'If you forgot your password, go to the Login screen and click "Forgot Password". Enter your registered email to receive a reset link.'
      }
    ]
  },
  {
    id: 'hosting',
    title: 'Hosting & Fleet',
    icon: Car,
    description: 'List your assets, manage availability, and set pricing.',
    articles: [
      {
        title: 'Listing your first asset',
        content: 'Go to your Host Dashboard, select "Fleet Registry", and click "Add New Asset". Follow the steps to provide details, specifications, and upload high-quality photos.'
      },
      {
        title: 'Managing calendar & availability',
        content: 'You can block dates or set availability in the "Calendar" section of your dashboard. Keeping your calendar up-to-date helps prevent unwanted booking requests.'
      },
      {
        title: 'Insurance requirements for hosts',
        content: 'Hosts are responsible for maintaining valid commercial insurance for their assets. You must upload proof of insurance during the listing process.'
      }
    ]
  },
  {
    id: 'crew',
    title: 'Crew Management',
    icon: Users,
    description: 'Assign drivers, pilots, and captains to your fleet.',
    articles: [
      {
        title: 'How to add crew members',
        content: 'Navigate to "Crew" in your dashboard. Click "Add Crew Member" and enter their details. They will need to provide their licenses for verification.'
      },
      {
        title: 'Assigning crew to assets',
        content: 'You can assign verified crew members to specific assets in the Fleet Registry or assign them to specific trips during the dispatch process.'
      },
      {
        title: 'Verifying crew documents',
        content: 'Crew members must upload valid licenses and medical certificates. As a fleet owner, you can review and approve these documents before they can be assigned.'
      }
    ]
  },
  {
    id: 'bookings',
    title: 'Bookings & Trips',
    icon: FileText,
    description: 'Manage your trips, cancellations, and guest requirements.',
    articles: [
      {
        title: 'How to book an asset',
        content: 'Search for your desired asset, select your dates, and click "Request to Book". The host will review your request. Once approved, you can proceed to payment.'
      },
      {
        title: 'Cancellation Policy (24h Rule)',
        content: 'You can cancel for free up to 24 hours before the trip starts. Cancellations made within 24 hours may incur a fee.'
      },
      {
        title: 'Guest requirements',
        content: 'Guests must meet age requirements and provide necessary identification. For self-drive rentals, a valid driver\'s license is required.'
      }
    ]
  },
  {
    id: 'payments',
    title: 'Wallet & Finance',
    icon: Wallet,
    description: 'Understanding fees, receiving payouts, and invoices.',
    articles: [
      {
        title: 'How payments work',
        content: 'Payments are securely processed via Nomba (in Nigeria) or Nomba. Funds are held in escrow until the trip is successfully completed.'
      },
      {
        title: 'When do I get paid?',
        content: 'Payouts are released to your wallet 24 hours after a trip completes. You can then withdraw funds to your bank account instantly or within 1-3 business days.'
      },
      {
        title: 'Service fees explained',
        content: 'Fleet IQ charges a small service fee to guests and a commission to hosts to cover platform maintenance, support, and insurance protection.'
      },
      {
        title: 'Adding a withdrawal method',
        content: 'Go to Wallet > Settings to add your bank account details. Ensure the account name matches your verified profile name.'
      }
    ]
  },
  {
    id: 'mobile',
    title: 'Mobile App',
    icon: Smartphone,
    description: 'Install the Fleet IQ app for better experience.',
    articles: [
      {
        title: 'How to install the PWA',
        content: 'Fleet IQ is a Progressive Web App (PWA). On iOS, tap "Share" > "Add to Home Screen". On Android, tap "Menu" > "Install App". This gives you a native app-like experience.'
      },
      {
        title: 'Enabling notifications',
        content: 'Enable notifications to receive real-time updates on booking requests, messages, and trip statuses directly on your device.'
      }
    ]
  },
  {
    id: 'trust',
    title: 'Trust & Safety',
    icon: Shield,
    description: 'Community guidelines, safety tips, and dispute resolution.',
    articles: [
      {
        title: 'Safety tips for travelers',
        content: 'Always communicate through the platform. inspect the asset before accepting it, and report any issues immediately.'
      },
      {
        title: 'Reporting misconduct',
        content: 'If you experience any issues, use the "Report" button on the booking page or contact support immediately.'
      },
      {
        title: 'Damage protection policy',
        content: 'Guests are responsible for any damage caused during the trip. Hosts should document the asset condition before and after the trip using the "Dispatch" feature.'
      }
    ]
  }
];

const FAQS = [
  {
    question: "What is the Cancellation Policy?",
    answer: "Trips can be cancelled free of charge up to 24 hours before the scheduled pickup time. If you cancel less than 24 hours before the trip, you may be charged a fee or forfeit the booking amount depending on the specific asset's policy."
  },
  {
    question: "How do withdrawals work?",
    answer: "Earnings are released to your connected bank account 24 hours after a trip is successfully completed. You can count on our secure Escrow system to hold funds safely until the job is done. Manage your payout methods in Settings > Wallet."
  },
  {
    question: "How do I list my fleet on Fleet IQ?",
    answer: "To list your fleet, switch to 'Hosting' mode from your profile menu. Click on 'Fleet Registry' and then 'Add New Fleet'. You'll need to provide details about the asset, upload high-quality photos, and submit proof of ownership and insurance."
  },
  {
    question: "Is insurance included in the rental?",
    answer: "Most assets on Fleet IQ come with commercial insurance provided by the host. However, we recommend checking the specific 'Features' section of each listing or contacting the host directly to confirm coverage details."
  }
];

export const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const navigate = useNavigate();

  // Simple search filter
  const filteredCategories = searchQuery
    ? CATEGORIES.filter(cat =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.articles.some(art => art.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : CATEGORIES;

  const toggleArticle = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedArticle === title) {
      setExpandedArticle(null);
    } else {
      setExpandedArticle(title);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="bg-slate-900 dark:bg-black py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent opacity-50 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">How can we help you?</h1>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 border-0 rounded-2xl bg-white/10 backdrop-blur-md text-white placeholder-slate-300 focus:ring-2 focus:ring-red-500 focus:bg-white/20 transition-all shadow-lg"
              placeholder="Search for answers (e.g. 'cancellation', 'payouts')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Categories Grid */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Browse by Topic</h2>
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.id} className="group bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900 transition-all hover:shadow-md h-fit">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                        <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-4">
                      {category.articles.map((article, idx) => (
                        <li key={idx} className="text-sm">
                          <button
                            onClick={(e) => toggleArticle(article.title, e)}
                            className="flex items-start text-left w-full text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 group/article"
                          >
                            <span className="mt-0.5 mr-2">
                              {expandedArticle === article.title ?
                                <ChevronDown className="w-3 h-3 text-red-500" /> :
                                <ChevronRight className="w-3 h-3 text-slate-400 group-hover/article:text-red-500" />
                              }
                            </span>
                            <span className="font-medium">{article.title}</span>
                          </button>

                          {/* Inline Expansion Content */}
                          {expandedArticle === article.title && (
                            <div className="mt-2 ml-5 p-3 bg-white dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 text-xs leading-relaxed border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-1 duration-200">
                              {article.content}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No topics found matching "{searchQuery}".</p>
            </div>
          )}
        </div>

        {/* FAQs Section */}
        {!searchQuery && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-start">
                    <HelpCircle className="w-5 h-5 mr-3 text-red-500 shrink-0 mt-0.5" />
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pl-8">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Support CTA */}
        <div className="mt-16 bg-slate-100 dark:bg-slate-900 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Still need help?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Our support team is available 24/7 to assist you with any issues related to bookings, payments, or account management.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/account/support')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
            >
              Contact Support
            </button>
            <button className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 dark:border-slate-700 text-base font-medium rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              View Status Page
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};