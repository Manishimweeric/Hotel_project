import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Search, Filter, Eye, Edit, RefreshCw, Download, Plus,
    DollarSign, MoreVertical, ChevronLeft, ChevronRight, X, AlertCircle,
    CheckCircle, XCircle, Clock, Percent, Package, User, MapPin, Phone,
    Mail, Hash, FileText, ArrowUpDown, TrendingUp, Users, CreditCard,
    Activity, CalendarDays, Save, Trash2, Star, Gift, Bed, ShoppingCart,
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { feedbackService } from '../../api';

const FeedbackManagementPage = () => {
    // State Management
    const [feedbacks, setFeedbacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [feedbacksPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFeedbackDetail, setSelectedFeedbackDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [stats, setStats] = useState({
        total: 0,
        unread: 0,
        read: 0,
    });

    // Effects
    useEffect(() => {
        loadFeedbacks();
    }, [currentPage, sortField, sortDirection]);

    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            loadFeedbacks();
        }
    }, [filterStatus, searchTerm]);

    // Handlers
    const loadFeedbacks = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params = {
                page: currentPage,
                page_size: feedbacksPerPage,
                ordering: sortDirection === 'desc' ? `-${sortField}` : sortField,
            };
            if (filterStatus && filterStatus !== 'all') {
                params.is_read = filterStatus === 'read';
            }
            if (searchTerm) {
                params.search = searchTerm;
            }
            const response = await feedbackService.getFeedback(params);
            const feedbacksData = response.results || response.data || response;
            setFeedbacks(feedbacksData);
            calculateStats(feedbacksData);
        } catch (err) {
            toast.error('Failed to load feedbacks. Please try again.');
            console.error('Error loading feedbacks:', err);
            setError('Failed to load feedbacks');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (feedbacksData) => {
        const stats = {
            total: feedbacksData.length,
            unread: feedbacksData.filter(fb => !fb.is_read).length,
            read: feedbacksData.filter(fb => fb.is_read).length,
        };
        setStats(stats);
    };

    const handleViewDetails = (feedback) => {
        setSelectedFeedbackDetail(feedback);
        setShowDetailModal(true);
        setShowActionMenu(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedFeedbackDetail(null);
    };

    const refreshFeedbacks = async () => {
        setIsRefreshing(true);
        await loadFeedbacks();
        setIsRefreshing(false);
    };

    const exportFeedbacks = () => {
        const csvContent = [
            ['ID', 'Full Name', 'Message', 'Status', 'Created Date'],
            ...filteredFeedbacks.map(feedback => [
                feedback.id,
                `"${feedback.full_name.replace(/"/g, '""')}"`,
                `"${feedback.message.replace(/"/g, '""')}"`,
                feedback.is_read ? 'Read' : 'Unread',
                new Date(feedback.created_at).toLocaleDateString(),
            ])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feedbacks_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const toggleReadStatus = async (feedbackId, currentStatus) => {
        try {
            await feedbackService.updateFeedback(feedbackId, { is_read: !currentStatus });
            toast.success(`Feedback marked as ${currentStatus ? 'unread' : 'read'}`);
            loadFeedbacks();
        } catch (error) {
            toast.error(`Failed to update feedback status`);
            console.error('Error updating feedback:', error);
        }
    };

    const truncateText = (text, maxLength = 50) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Derived Data
    const filteredFeedbacks = feedbacks.filter(feedback => {
        const matchesSearch =
            feedback.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feedback.message?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || (filterStatus === 'read' ? feedback.is_read : !feedback.is_read);
        return matchesSearch && matchesStatus;
    });

    const indexOfLastFeedback = currentPage * feedbacksPerPage;
    const indexOfFirstFeedback = indexOfLastFeedback - feedbacksPerPage;
    const currentFeedbacks = filteredFeedbacks.slice(indexOfFirstFeedback, indexOfLastFeedback);
    const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Feedbacks</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadFeedbacks}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Render
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <MessageSquare className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
                                <p className="text-sm text-gray-600">View and manage customer feedback</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshFeedbacks}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportFeedbacks}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <MessageSquare className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Feedbacks</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-8 w-8 text-amber-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Unread</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.unread}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Read</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.read}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search feedbacks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="unread">Unread</option>
                                        <option value="read">Read</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Total: {filteredFeedbacks.length} feedbacks</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feedbacks Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading feedbacks...</p>
                            </div>
                        </div>
                    ) : currentFeedbacks.length === 0 ? (
                        <div className="text-center py-20">
                            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedbacks found</h3>
                            <p className="text-gray-600 mb-4">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No feedbacks have been submitted yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('id')}
                                            >
                                                <div className="flex items-center">
                                                    #
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('full_name')}
                                            >
                                                <div className="flex items-center">
                                                    Full Name
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('created_at')}
                                            >
                                                <div className="flex items-center">
                                                    Created
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentFeedbacks.map((feedback) => (
                                            <tr key={feedback.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div className="text-sm font-medium text-gray-900 font-mono">
                                                            {feedback.id}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <User className="h-4 w-4 text-amber-600 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {feedback.full_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <div className="flex items-start">
                                                        <MessageSquare className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                                        <div className="text-sm text-gray-900">
                                                            <div title={feedback.message}>
                                                                {truncateText(feedback.message, 60)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${feedback.is_read ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {feedback.is_read ? 'Read' : 'Unread'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <CalendarDays className="h-4 w-4 mr-2" />
                                                        <div>
                                                            <div className="text-sm text-gray-900">
                                                                {new Date(feedback.created_at).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(feedback.created_at).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(feedback)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleReadStatus(feedback.id, feedback.is_read)}
                                                            className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                                                            title={feedback.is_read ? 'Mark as Unread' : 'Mark as Read'}
                                                        >
                                                            {feedback.is_read ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{indexOfFirstFeedback + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastFeedback, filteredFeedbacks.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredFeedbacks.length}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </button>
                                                {[...Array(totalPages)].map((_, index) => {
                                                    const page = index + 1;
                                                    if (
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        (page >= currentPage - 2 && page <= currentPage + 2)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                                                    ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    } else if (
                                                        (page === currentPage - 3 && currentPage > 4) ||
                                                        (page === currentPage + 3 && currentPage < totalPages - 3)
                                                    ) {
                                                        return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                                                    }
                                                    return null;
                                                })}
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Feedback Detail Modal */}
                {showDetailModal && selectedFeedbackDetail && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                                <div className="flex items-center">
                                    <MessageSquare className="h-6 w-6 text-amber-600 mr-3" />
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            Feedback from {selectedFeedbackDetail.full_name}
                                        </h3>
                                        <p className="text-sm text-gray-600">Feedback Details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeDetailModal}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-900">Feedback Summary</h4>
                                            <p className="text-sm text-gray-600">ID #{selectedFeedbackDetail.id}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedFeedbackDetail.is_read ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {selectedFeedbackDetail.is_read ? 'Read' : 'Unread'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                                            <div className="flex items-center mb-4">
                                                <User className="h-5 w-5 text-amber-600 mr-2" />
                                                <h5 className="text-lg font-medium text-gray-900">Customer Information</h5>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</p>
                                                    <p className="text-sm text-gray-900">{selectedFeedbackDetail.full_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                                                    <p className="text-sm text-gray-900">
                                                        {selectedFeedbackDetail.is_read ? 'Read' : 'Unread'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                                            <div className="flex items-center mb-4">
                                                <MessageSquare className="h-5 w-5 text-amber-600 mr-2" />
                                                <h5 className="text-lg font-medium text-gray-900">Feedback Details</h5>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Message</p>
                                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-amber-400">
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                            {selectedFeedbackDetail.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center mb-4">
                                            <Activity className="h-5 w-5 text-amber-600 mr-2" />
                                            <h5 className="text-lg font-medium text-gray-900">Feedback Timeline</h5>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Feedback Submitted</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(selectedFeedbackDetail.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-gray-500">
                                            Feedback #{selectedFeedbackDetail.id} • Last viewed: {new Date().toLocaleString()}
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => toggleReadStatus(selectedFeedbackDetail.id, selectedFeedbackDetail.is_read)}
                                                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                            >
                                                {selectedFeedbackDetail.is_read ? <XCircle className="h-4 w-4 mr-2 inline" /> : <CheckCircle className="h-4 w-4 mr-2 inline" />}
                                                {selectedFeedbackDetail.is_read ? 'Mark as Unread' : 'Mark as Read'}
                                            </button>
                                            <button
                                                onClick={closeDetailModal}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackManagementPage;
