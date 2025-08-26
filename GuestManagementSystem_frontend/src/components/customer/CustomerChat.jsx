import React, { useState, useEffect, useRef } from 'react';
import {
    MessageCircle, Send, User, Users, Search, Filter, X, Plus, Phone, Mail,
    Clock, CheckCircle, AlertCircle, MoreVertical, Trash2, Settings,
    UserCheck, Shield, MessageSquare, Zap, Archive, Star, Volume2,
    Bell, BellOff, Paperclip, Smile, Image, FileText, Download, Menu,
    LogOut, Home, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { chatService } from '../../api';

const ChatSystem = ({ userType = 'customer' }) => {
    // State Management
    const [chatSessions, setChatSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [user, setUser] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [lastSeen, setLastSeen] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [newCustomerId, setNewCustomerId] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const chatInputRef = useRef(null);

    // Initialize user data and authentication
    useEffect(() => {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing user data:', error);
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    // Load chat sessions on component mount
    useEffect(() => {
        if (user && isAuthenticated) {
            loadChatSessions();
            // Auto-refresh sessions every 10 seconds
            const sessionInterval = setInterval(loadChatSessions, 10000);
            return () => clearInterval(sessionInterval);
        }
    }, [user, isAuthenticated]);

    // Auto-refresh messages
    useEffect(() => {
        if (activeSession && isAuthenticated) {
            loadMessages(activeSession.id);
            const interval = setInterval(() => {
                loadMessages(activeSession.id);
            }, 3000); // Refresh every 3 seconds

            return () => clearInterval(interval);
        }
    }, [activeSession, isAuthenticated]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
        setIsAuthenticated(false);
        setUser(null);
        setChatSessions([]);
        setActiveSession(null);
        setMessages([]);
        window.location.href = '/login';
    };

    const loadChatSessions = async () => {
        try {
            setIsLoading(true);
            const response = await chatService.getSessions();
            const sessions = response.data || response || [];

            let filteredSessions = sessions;
            if (userType === 'customer') {
                filteredSessions = sessions.filter(session => session.customer === user.id);
            }

            setChatSessions(filteredSessions);
        } catch (error) {
            console.error('Error loading chat sessions:', error);
            setError('Failed to load chat sessions');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (sessionId) => {
        if (!sessionId) return;

        try {
            const response = await chatService.getSessionMessages(sessionId);
            setMessages(response.data || response || []);

        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const createNewSession = async (customerData = {}) => {
        try {
            const sessionData = {
                session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                customer: userType === 'customer' ? user.id : parseInt(customerData.customer_id),
                admin_user: userType === 'admin' ? user.id : null
            };

            const newSession = await chatService.createSession(sessionData);
            setChatSessions(prev => [newSession, ...prev]);
            setActiveSession(newSession);
            setShowNewChatModal(false);
            setNewCustomerId('');
            toast.success('New chat session created');
        } catch (error) {
            console.error('Error creating session:', error);
            toast.error('Failed to create chat session');
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeSession || isSending) return;

        try {
            setIsSending(true);
            const messageData = {
                sender: userType === 'customer' ? 'C' : 'A',
                message: newMessage.trim()
            };

            const sentMessage = await chatService.sendMessage(activeSession.id, messageData);
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');

            // Update session's last activity
            setChatSessions(prev =>
                prev.map(session =>
                    session.id === activeSession.id
                        ? { ...session, updated_at: new Date().toISOString() }
                        : session
                )
            );

            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const selectSession = (session) => {
        setActiveSession(session);
        loadMessages(session.id);
        // Mark as read
        setUnreadCounts(prev => ({ ...prev, [session.id]: 0 }));
    };

    const deleteSession = async (sessionId) => {
        if (window.confirm('Are you sure you want to delete this chat session?')) {
            try {
                await chatService.deleteSession(sessionId);
                setChatSessions(prev => prev.filter(session => session.id !== sessionId));
                if (activeSession?.id === sessionId) {
                    setActiveSession(null);
                    setMessages([]);
                }
                toast.success('Chat session deleted');
            } catch (error) {
                console.error('Error deleting session:', error);
                toast.error('Failed to delete chat session');
            }
        }
    };

    const filteredSessions = chatSessions.filter(session => {
        const matchesSearch = searchTerm === '' ||
            session.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = selectedFilter === 'all' ||
            (selectedFilter === 'active' && messages.length > 0) ||
            (selectedFilter === 'unread' && unreadCounts[session.id] > 0);

        return matchesSearch && matchesFilter;
    });

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    const handleCreateNewSession = () => {
        if (userType === 'customer') {
            createNewSession();
        } else {
            if (!newCustomerId.trim()) {
                toast.error('Please enter a customer ID');
                return;
            }
            createNewSession({ customer_id: newCustomerId });
        }
    };

    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <MessageCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat System</h2>
                    <p className="text-gray-600 mb-6">Please log in to access the chat system</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 text-gray-500 hover:text-gray-700 mr-4 lg:hidden"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="flex items-center space-x-3">
                                <MessageCircle className="h-8 w-8 text-amber-600" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {userType === 'customer' ? 'Customer Support' : 'Admin Chat System'}
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {userType === 'customer' ? 'Get help from our support team' : 'Manage customer conversations'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>Welcome, {user?.first_name || user?.username || user?.email}</span>
                            </div>
                            <button
                                onClick={loadChatSessions}
                                disabled={isLoading}
                                className="p-2 text-gray-500 hover:text-gray-700"
                                title="Refresh"
                            >
                                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="p-2 text-gray-500 hover:text-gray-700"
                                title="Home"
                            >
                                <Home className="h-5 w-5" />
                            </button>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-500 hover:text-gray-700"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Sessions Sidebar */}
                    <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} lg:w-80 bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {userType === 'customer' ? 'Your Conversations' : 'Chat Sessions'}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    {userType === 'admin' && (
                                        <button
                                            onClick={() => setShowNewChatModal(true)}
                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                            title="New Chat"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Search and Filter */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                                    />
                                </div>
                                <select
                                    value={selectedFilter}
                                    onChange={(e) => setSelectedFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                                >
                                    <option value="all">All Conversations</option>
                                    <option value="active">Active</option>
                                    <option value="unread">Unread</option>
                                </select>
                            </div>
                        </div>

                        {/* Sessions List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading && chatSessions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading conversations...</p>
                                </div>
                            ) : filteredSessions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                                        {chatSessions.length === 0 ? 'No conversations yet' : 'No conversations found'}
                                    </h4>
                                    <p className="text-gray-600 mb-4">
                                        {chatSessions.length === 0
                                            ? userType === 'customer'
                                                ? 'Start a new conversation with our support team'
                                                : 'No customer conversations available'
                                            : 'Try adjusting your search or filters'
                                        }
                                    </p>
                                    {userType === 'customer' && chatSessions.length === 0 && (
                                        <button
                                            onClick={() => createNewSession()}
                                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                                        >
                                            Start New Conversation
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => selectSession(session)}
                                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors relative group ${activeSession?.id === session.id ? 'bg-amber-50 border-amber-200' : ''}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                                                    <User className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {userType === 'admin'
                                                        ? (session.customer?.username || session.customer?.email || 'Guest User')
                                                        : 'Support Chat'
                                                    }
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {userType === 'admin'
                                                        ? session.customer?.email || 'No email'
                                                        : `Session: ${session.session_id.substring(0, 8)}...`
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Last active: {formatMessageTime(session.updated_at)}
                                                </p>
                                            </div>
                                            {unreadCounts[session.id] > 0 && (
                                                <div className="bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium">
                                                    {unreadCounts[session.id]}
                                                </div>
                                            )}
                                        </div>

                                        {userType === 'admin' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSession(session.id);
                                                }}
                                                className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {activeSession ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 bg-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                                                <User className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    {userType === 'admin'
                                                        ? (activeSession.customer?.username || activeSession.customer?.email || 'Guest User')
                                                        : 'Support Team'
                                                    }
                                                </h4>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    {userType === 'admin' && activeSession.customer?.email && (
                                                        <span className="flex items-center">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {activeSession.customer.email}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {lastSeen[activeSession.id] ? `Last seen ${formatMessageTime(lastSeen[activeSession.id])}` : 'Online'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                                                <Phone className="h-4 w-4" />
                                            </button>
                                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-16">
                                            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-lg font-medium text-gray-900 mb-2">No messages yet</p>
                                            <p className="text-gray-600">Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${(message.sender === 'C' && userType === 'customer') || (message.sender === 'A' && userType === 'admin') ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${(message.sender === 'C' && userType === 'customer') || (message.sender === 'A' && userType === 'admin') ? 'bg-amber-500 text-white' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'}`}>
                                                    <p className="text-sm">{message.message}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className={`text-xs ${(message.sender === 'C' && userType === 'customer') || (message.sender === 'A' && userType === 'admin') ? 'text-amber-100' : 'text-gray-500'}`}>
                                                            {message.sender === 'A' ? 'Support' : 'You'}
                                                        </span>
                                                        <span className={`text-xs ${(message.sender === 'C' && userType === 'customer') || (message.sender === 'A' && userType === 'admin') ? 'text-amber-100' : 'text-gray-500'}`}>
                                                            {formatMessageTime(message.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-3 rounded-lg max-w-xs shadow-sm">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex items-center space-x-3">
                                        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                                            <Paperclip className="h-5 w-5" />
                                        </button>
                                        <div className="flex-1">
                                            <textarea
                                                ref={chatInputRef}
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Type your message..."
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none"
                                                disabled={isSending}
                                            />
                                        </div>
                                        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                                            <Smile className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() || isSending}
                                            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            {isSending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-gray-50">
                                <div className="text-center max-w-md">
                                    <MessageCircle className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                                    <h3 className="text-2xl font-medium text-gray-900 mb-4">
                                        {userType === 'customer' ? 'Welcome to Customer Support' : 'Select a Chat Session'}
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {userType === 'customer'
                                            ? 'Get instant help from our support team. Start a conversation or select an existing one from the sidebar.'
                                            : 'Choose a conversation from the sidebar to start chatting with customers.'
                                        }
                                    </p>
                                    {userType === 'customer' && chatSessions.length === 0 && (
                                        <button
                                            onClick={() => createNewSession()}
                                            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                                        >
                                            Start New Conversation
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && userType === 'admin' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">New Chat Session</h3>
                            <button
                                onClick={() => {
                                    setShowNewChatModal(false);
                                    setNewCustomerId('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer ID
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter customer ID"
                                    value={newCustomerId}
                                    onChange={(e) => setNewCustomerId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the ID of the customer you want to start a chat with
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowNewChatModal(false);
                                        setNewCustomerId('');
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateNewSession}
                                    disabled={!newCustomerId.trim()}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Create Chat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatSystem;