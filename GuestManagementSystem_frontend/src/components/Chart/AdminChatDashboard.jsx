import React, { useState, useEffect } from 'react';
import {
    MessageCircle, Users, Search, Filter, Eye, MoreVertical, Clock,
    CheckCircle, AlertCircle, User, Mail, Phone, Calendar, Send,
    Archive, Star, Trash2, Settings, Bell, BellOff, Download,
    RefreshCw, Plus, ArrowRight, MessageSquare, Activity, TrendingUp,
    UserCheck, Zap, Volume2, X, Minimize2, Maximize2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { chatService } from '../../api';

const AdminChatDashboard = () => {
    // State Management
    const [chatSessions, setChatSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalSessions: 0,
        activeSessions: 0,
        totalMessages: 0,
        responseTime: 0
    });
    const [isSending, setIsSending] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [showSessionDetails, setShowSessionDetails] = useState(false);
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortDirection, setSortDirection] = useState('desc');

    // Initialize admin data
    useEffect(() => {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setAdmin(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        if (admin) {
            loadChatSessions();
            const interval = setInterval(loadChatSessions, 5000); // Auto-refresh every 5 seconds
            return () => clearInterval(interval);
        }
    }, [admin]);

    // Load messages when session is selected
    useEffect(() => {
        if (selectedSession) {
            loadMessages(selectedSession.id);
            const interval = setInterval(() => loadMessages(selectedSession.id), 2000);
            return () => clearInterval(interval);
        }
    }, [selectedSession]);

    const loadChatSessions = async () => {
        try {
            setIsLoading(true);
            const response = await chatService.getSessions();
            const sessions = response.data || response || [];
            console.log("Session Data", sessions)
            setChatSessions(sessions);
            calculateStats(sessions);
        } catch (error) {
            console.error('Error loading chat sessions:', error);
            setError('Failed to load chat sessions');
            toast.error('Failed to load chat sessions');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (sessionId) => {
        try {
            const response = await chatService.getSessionMessages(sessionId);
            setMessages(response.data || response || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const calculateStats = (sessions) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const activeSessions = sessions.filter(session => {
            const lastUpdate = new Date(session.updated_at);
            return lastUpdate >= today;
        }).length;

        setStats({
            totalSessions: sessions.length,
            activeSessions: activeSessions,
            totalMessages: sessions.reduce((sum, session) => sum + (session.message_count || 0), 0),
            responseTime: 2.5 // Mock response time in minutes
        });
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedSession || isSending) return;

        try {
            setIsSending(true);
            const messageData = {
                sender: 'A', // Admin
                message: newMessage.trim()
            };

            const sentMessage = await chatService.sendMessage(selectedSession.id, messageData);
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');

            // Update session's last activity
            setChatSessions(prev =>
                prev.map(session =>
                    session.id === selectedSession.id
                        ? { ...session, updated_at: new Date().toISOString() }
                        : session
                )
            );

            toast.success('Message sent');
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
        setSelectedSession(session);
        setShowSessionDetails(false);
    };

    const deleteSession = async (sessionId) => {
        if (window.confirm('Are you sure you want to delete this chat session?')) {
            try {
                await chatService.deleteSession(sessionId);
                setChatSessions(prev => prev.filter(session => session.id !== sessionId));
                if (selectedSession?.id === sessionId) {
                    setSelectedSession(null);
                    setMessages([]);
                }
                toast.success('Chat session deleted');
            } catch (error) {
                console.error('Error deleting session:', error);
                toast.error('Failed to delete chat session');
            }
        }
    };

    const exportChatData = () => {
        const csvContent = [
            ['Session ID', 'Customer', 'Email', 'Messages Count', 'Created Date', 'Last Updated'],
            ...filteredSessions.map(session => [
                session.session_id,
                session.customer?.username || 'Unknown',
                session.customer?.email || 'No email',
                session.message_count || 0,
                new Date(session.created_at).toLocaleDateString(),
                new Date(session.updated_at).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_sessions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    const getSessionStatus = (session) => {
        const lastUpdate = new Date(session.updated_at);
        const now = new Date();
        const diff = now - lastUpdate;

        if (diff < 300000) return { status: 'active', color: 'text-green-600', bg: 'bg-green-100' }; // 5 minutes
        if (diff < 3600000) return { status: 'idle', color: 'text-yellow-600', bg: 'bg-yellow-100' }; // 1 hour
        return { status: 'inactive', color: 'text-gray-600', bg: 'bg-gray-100' };
    };

    const filteredSessions = chatSessions.filter(session => {
        const matchesSearch = searchTerm === '' ||
            session.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const sessionStatus = getSessionStatus(session).status;
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && sessionStatus === 'active') ||
            (filterStatus === 'idle' && sessionStatus === 'idle') ||
            (filterStatus === 'inactive' && sessionStatus === 'inactive');

        return matchesSearch && matchesFilter;
    });

    const sortedSessions = [...filteredSessions].sort((a, b) => {
        const aValue = sortBy === 'updated_at' ? new Date(a.updated_at) : a[sortBy];
        const bValue = sortBy === 'updated_at' ? new Date(b.updated_at) : b[sortBy];

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <MessageCircle className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Chat Management</h1>
                                <p className="text-sm text-gray-600">Manage customer conversations and support tickets</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={loadChatSessions}
                                disabled={isLoading}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportChatData}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <MessageSquare className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalSessions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Activity className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Active Today</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.activeSessions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <MessageCircle className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Messages</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-8 w-8 text-amber-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Response</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.responseTime}m</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sessions List */}
                    <div className="lg:col-span-1 bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Chat Sessions</h3>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                        title="Sort Direction"
                                    >
                                        <ArrowRight className={`h-4 w-4 transition-transform ${sortDirection === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Search and Filters */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search sessions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                                >
                                    <option value="all">All Sessions</option>
                                    <option value="active">Active (Last 5min)</option>
                                    <option value="idle">Idle (Last hour)</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                    <p className="text-gray-600">Loading sessions...</p>
                                </div>
                            ) : sortedSessions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No chat sessions</h4>
                                    <p className="text-gray-600">No sessions match your current filters</p>
                                </div>
                            ) : (
                                sortedSessions.map((session) => {
                                    const status = getSessionStatus(session);
                                    return (
                                        <div
                                            key={session.id}
                                            onClick={() => selectSession(session)}
                                            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedSession?.id === session.id ? 'bg-amber-50 border-amber-200' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                                                            <User className="h-5 w-5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                            {session.guest_last_name || session.guest_first_name || 'Guest User'}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">
                                                            {session.customer?.email || 'No email'}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {formatMessageTime(session.updated_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                        {status.status}
                                                    </span>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteSession(session.id);
                                                            }}
                                                            className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col h-96">
                        {selectedSession ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                                                <User className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    {selectedSession.guest_last_name || 'Guest User'}
                                                </h4>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    {selectedSession.customer?.email && (
                                                        <span className="flex items-center">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {selectedSession.customer.email}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {formatMessageTime(selectedSession.updated_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setShowSessionDetails(true)}
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                            >
                                                <Eye className="h-4 w-4" />
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
                                        <div className="text-center py-8">
                                            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-lg font-medium text-gray-900 mb-2">No messages yet</p>
                                            <p className="text-gray-600">Start the conversation with this customer</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.sender === 'A' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender === 'A' ? 'bg-amber-500 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                                                    <p className="text-sm">{message.message}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className={`text-xs ${message.sender === 'A' ? 'text-amber-100' : 'text-gray-500'}`}>
                                                            {message.sender === 'A' ? 'Admin' : 'Customer'}
                                                        </span>
                                                        <span className={`text-xs ${message.sender === 'A' ? 'text-amber-100' : 'text-gray-500'}`}>
                                                            {formatMessageTime(message.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <textarea
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Type your message..."
                                                rows="2"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none"
                                                disabled={isSending}
                                            />
                                        </div>
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() || isSending}
                                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Chat Session</h3>
                                    <p className="text-gray-600">Choose a conversation from the sidebar to start chatting with customers</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Session Details Modal */}
            {showSessionDetails && selectedSession && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <h3 className="text-xl font-semibold text-gray-900">Session Details</h3>
                            <button
                                onClick={() => setShowSessionDetails(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Session Info */}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Session Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Session ID</p>
                                            <p className="text-sm text-gray-900 font-mono">{selectedSession.session_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Status</p>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSessionStatus(selectedSession).bg} ${getSessionStatus(selectedSession).color}`}>
                                                {getSessionStatus(selectedSession).status}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Created</p>
                                            <p className="text-sm text-gray-900">{new Date(selectedSession.created_at).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Last Updated</p>
                                            <p className="text-sm text-gray-900">{new Date(selectedSession.updated_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h5 className="text-lg font-medium text-gray-900">
                                                    {selectedSession.customer?.username || selectedSession.customer?.email || 'Guest User'}
                                                </h5>
                                                <p className="text-sm text-gray-600">{selectedSession.customer?.email || 'No email provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Statistics */}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Chat Statistics</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                            <p className="text-2xl font-semibold text-blue-600">{messages.length}</p>
                                            <p className="text-sm text-blue-600">Total Messages</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                            <p className="text-2xl font-semibold text-green-600">
                                                {messages.filter(m => m.sender === 'C').length}
                                            </p>
                                            <p className="text-sm text-green-600">Customer Messages</p>
                                        </div>
                                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                                            <Shield className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                                            <p className="text-2xl font-semibold text-amber-600">
                                                {messages.filter(m => m.sender === 'A').length}
                                            </p>
                                            <p className="text-sm text-amber-600">Admin Messages</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => deleteSession(selectedSession.id)}
                                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
                                >
                                    Delete Session
                                </button>
                                <button
                                    onClick={() => setShowSessionDetails(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminChatDashboard;