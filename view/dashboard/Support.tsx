
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Send, User, Bot, MessageSquare, ChevronLeft, AlertCircle, LifeBuoy, Plus, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { EscalateToHumanModal } from '../../components/EscalateToHumanModal';
import { ReportIssueModal } from '../../components/ReportIssueModal';
import { supabase } from '../../supabaseClient';
import { Ticket } from '../../types';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export const Support = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'list' | 'chat'>('list');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [isEscalateOpen, setIsEscalateOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);

    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchTickets = async () => {
        setLoadingTickets(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setTickets(data);
        }
        setLoadingTickets(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchTickets();
    }, [view]); // Refetch when switching views

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const startChat = () => {
        setView('chat');
        // Initialize Gemini Chat only if not already initialized or if restarting
        if (!chatSession || messages.length === 0) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const chat = ai.chats.create({
                    model: 'gemini-3-flash-preview',
                    config: {
                        systemInstruction: `You are the AI Assistant for Fleet IQ, a premium enterprise-grade multi-tenant marketplace for transportation assets (vehicles, helicopters, yachts, planes).
                    
                    Your role is to assist users (Fleet Owners/Listers and Renters) with using the platform.
                    
                    **About Fleet IQ:**
                    - We connect renters with high-value assets across Air, Land, and Sea.
                    - Features: Real-time tracking, Crew management, Secure Escrow payments, verified asset listings.
                    
                    **Your Responsibilities:**
                    - Help with navigating the dashboard (Bookings, Wallet, Settings).
                    - Explain how to add assets, manage crew, and handle bookings.
                    - Assist with financial reporting questions (Payouts, Invoices).
                    - Be polite, concise, and professional. Use emojis sparingly.
                    
                    **CRITICAL INSTRUCTION:**
                    If a user reports a technical bug, a billing dispute, a complex issue you cannot resolve, or if they explicitly ask to speak to a human, YOU MUST politely apologize for the limitation and explicitly encourage them to click the "Escalate to Human" button found at the top of the chat window. Tell them this button will connect them to a senior support specialist who can resolve the issue immediately.`,
                    },
                });
                setChatSession(chat);
                setMessages([{
                    id: 'welcome',
                    role: 'model',
                    text: "Hello! I'm the Fleet IQ Assistant. How can I help you manage your fleet or bookings today?",
                    timestamp: new Date()
                }]);
            } catch (error) {
                console.error("Failed to init chat", error);
                setMessages([{
                    id: 'error',
                    role: 'model',
                    text: "System Error: Unable to connect to AI service. Please try again later.",
                    timestamp: new Date()
                }]);
            }
        }
    };

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !chatSession) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const result: GenerateContentResponse = await chatSession.sendMessage({ message: userMsg.text });
            const text = result.text;

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: text || "I'm having trouble connecting right now. Please try escalating to a human agent.",
                timestamp: new Date()
            }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "I encountered an error processing your request. Please try again or escalate to a human.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (view === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Support Center</h1>
                        <p className="text-slate-500 dark:text-slate-400">Get help with your fleet operations.</p>
                    </div>
                    <Button onClick={startChat} size="lg" className="shadow-lg shadow-red-500/20">
                        <MessageSquare className="w-4 h-4 mr-2" /> Start a New Chat
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                            <LifeBuoy className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Help Articles</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Browse our knowledge base for quick answers.</p>
                        <button onClick={() => navigate('/help')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">View Articles</button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Live Chat</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Talk to our AI assistant or escalate to a human.</p>
                        <button onClick={startChat} className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline">Chat Now</button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Report Issue</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Submit a bug report or feature request.</p>
                        <button onClick={() => setIsReportOpen(true)} className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">Submit Report</button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Tickets</h2>
                        <button onClick={fetchTickets} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            Refresh
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Ticket ID</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loadingTickets ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading tickets...</td>
                                    </tr>
                                ) : tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No tickets found. Start a chat or report an issue.</td>
                                    </tr>
                                ) : (
                                    tickets.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                                                #{ticket.id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{ticket.subject}</td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{ticket.type || 'Support'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'Resolved' || ticket.status === 'Closed'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                    : ticket.status === 'In Progress'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                                                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs">View</button>
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ReportIssueModal isOpen={isReportOpen} onClose={() => { setIsReportOpen(false); fetchTickets(); }} />
            </div>
        );
    }

    // Chat View
    return (
        <div className="fixed inset-0 z-[100] md:static md:mx-0 md:mt-0 md:h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-900 md:rounded-xl md:border border-slate-200 dark:border-slate-800 md:shadow-sm overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
                            Fleet IQ Assistant
                            <span className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">AI Powered Support</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsEscalateOpen(true)}
                    className="flex items-center px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                    <User className="w-4 h-4 mr-2" />
                    Escalate to Human
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                        max-w-[80%] rounded-2xl p-4 shadow-sm relative
                        ${msg.role === 'user'
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none'}
                    `}>
                            <div className="flex items-start gap-2 mb-1">
                                {msg.role === 'model' && <Bot className="w-4 h-4 mt-0.5 opacity-70" />}
                                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                            </div>
                            <div className={`text-[10px] opacity-50 text-right mt-1 ${msg.role === 'user' ? 'text-slate-300 dark:text-slate-500' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                            <Bot className="w-4 h-4 text-slate-400" />
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <form onSubmit={sendMessage} className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white placeholder-slate-400 transition-all"
                        autoFocus
                    />
                    <Button type="submit" disabled={!input.trim() || isLoading} className="aspect-square p-0 w-12 flex items-center justify-center rounded-xl">
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </div>

            <EscalateToHumanModal isOpen={isEscalateOpen} onClose={() => { setIsEscalateOpen(false); fetchTickets(); }} />
        </div>
    );
};
