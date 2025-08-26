import React, { useState, useEffect } from 'react';
import {
    Tag, Search, Filter, Eye, Edit, RefreshCw, Download, Plus,
    DollarSign, MoreVertical, ChevronLeft, ChevronRight, X, AlertCircle,
    CheckCircle, XCircle, Clock, Percent, Package, User, MapPin, Phone,
    Mail, Hash, FileText, ArrowUpDown, TrendingUp, Users, CreditCard,
    Activity, CalendarDays, Save, Trash2, Star, Gift, Bed, ShoppingCart,
    MessageSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { promotionService } from '../../api';

const PromotionManagementPage = () => {
    // State Management
    const [promotions, setPromotions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [promotionsPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPromotionDetail, setSelectedPromotionDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promotionToEdit, setPromotionToEdit] = useState(null);
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [formData, setFormData] = useState({
        title: '',
        type: 'product',
        number_orders: '',
        promotion: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [stats, setStats] = useState({
        total: 0,
        productPromotions: 0,
        roomPromotions: 0,
        activePromotions: 0
    });

    const TYPE_CHOICES = {
        'product': { label: 'Product', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ShoppingCart },
        'room': { label: 'Room', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Bed }
    };

    // Effects
    useEffect(() => {
        loadPromotions();
    }, [currentPage, sortField, sortDirection]);

    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            loadPromotions();
        }
    }, [filterType, searchTerm]);

    // Handlers
    const loadPromotions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params = {
                page: currentPage,
                page_size: promotionsPerPage,
                ordering: sortDirection === 'desc' ? `-${sortField}` : sortField
            };
            if (filterType && filterType !== 'all') {
                params.type = filterType;
            }
            if (searchTerm) {
                params.search = searchTerm;
            }
            const response = await promotionService.getAllPromotions(params);
            const promotionsData = response;
            setPromotions(promotionsData);
            calculateStats(promotionsData);
        } catch (err) {
            toast.error('Failed to load promotions. Please try again.');
            console.error('Error loading promotions:', err);
            setError('Failed to load promotions');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (promotionsData) => {
        const stats = {
            total: promotionsData.length,
            productPromotions: promotionsData.filter(promo => promo.type === 'product').length,
            roomPromotions: promotionsData.filter(promo => promo.type === 'room').length,
            activePromotions: promotionsData.length
        };
        setStats(stats);
    };

    const handleViewDetails = (promotion) => {
        setSelectedPromotionDetail(promotion);
        setShowDetailModal(true);
        setShowActionMenu(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedPromotionDetail(null);
    };

    const handleCreatePromotion = () => {
        setFormData({
            title: '',
            type: 'product',
            number_orders: '',
            promotion: ''
        });
        setFormErrors({});
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setFormData({
            title: '',
            type: 'product',
            number_orders: '',
            promotion: ''
        });
        setFormErrors({});
    };

    const handleEditPromotion = (promotion) => {
        setPromotionToEdit(promotion);
        setFormData({
            title: promotion.title,
            type: promotion.type,
            number_orders: promotion.number_orders.toString(),
            promotion: promotion.promotion
        });
        setFormErrors({});
        setShowEditModal(true);
        setShowActionMenu(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setPromotionToEdit(null);
        setFormData({
            title: '',
            type: 'product',
            number_orders: '',
            promotion: ''
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        }
        if (!formData.number_orders || formData.number_orders <= 0) {
            errors.number_orders = 'Number of items must be greater than 0';
        }
        if (!formData.promotion.trim()) {
            errors.promotion = 'Promotion description is required';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            const promotionData = {
                title: formData.title.trim(),
                type: formData.type,
                number_orders: parseInt(formData.number_orders),
                promotion: formData.promotion.trim()
            };
            if (showCreateModal) {
                await promotionService.createPromotion(promotionData);
                toast.success('Promotion created successfully!');
                closeCreateModal();
            } else if (showEditModal && promotionToEdit) {
                await promotionService.updatePromotion(promotionToEdit.id, promotionData);
                toast.success('Promotion updated successfully!');
                closeEditModal();
            }
            loadPromotions();
        } catch (error) {
            toast.error(`Failed to ${showCreateModal ? 'create' : 'update'} promotion`);
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const refreshPromotions = async () => {
        setIsRefreshing(true);
        await loadPromotions();
        setIsRefreshing(false);
    };

    const exportPromotions = () => {
        const csvContent = [
            ['ID', 'Title', 'Type', 'Number of Items', 'Promotion Description', 'Created Date'],
            ...filteredPromotions.map(promotion => [
                promotion.id,
                promotion.title,
                TYPE_CHOICES[promotion.type]?.label || promotion.type,
                promotion.number_orders,
                `"${promotion.promotion.replace(/"/g, '""')}"`,
                new Date(promotion.created_at).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promotions_${new Date().toISOString().split('T')[0]}.csv`;
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

    const truncateText = (text, maxLength = 50) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Derived Data
    const filteredPromotions = promotions.filter(promotion => {
        const matchesSearch =
            promotion.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            promotion.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            promotion.promotion?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || promotion.type === filterType;
        return matchesSearch && matchesType;
    });

    const indexOfLastPromotion = currentPage * promotionsPerPage;
    const indexOfFirstPromotion = indexOfLastPromotion - promotionsPerPage;
    const currentPromotions = filteredPromotions.slice(indexOfFirstPromotion, indexOfLastPromotion);
    const totalPages = Math.ceil(filteredPromotions.length / promotionsPerPage);

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Promotions</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadPromotions}
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
                            <Tag className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Promotion Management</h1>
                                <p className="text-sm text-gray-600">Create and manage product & room promotions</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshPromotions}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportPromotions}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </button>
                            <button
                                onClick={handleCreatePromotion}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Promotion
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
                                <Tag className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Promotions</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShoppingCart className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Product Promos</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.productPromotions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Bed className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Room Promos</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.roomPromotions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Star className="h-8 w-8 text-amber-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Active Promos</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.activePromotions}</p>
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
                                        placeholder="Search promotions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">All Types</option>
                                        {Object.entries(TYPE_CHOICES).map(([key, value]) => (
                                            <option key={key} value={key}>{value.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Total: {filteredPromotions.length} promotions</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Promotions Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading promotions...</p>
                            </div>
                        </div>
                    ) : currentPromotions.length === 0 ? (
                        <div className="text-center py-20">
                            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions found</h3>
                            <p className="text-gray-600 mb-4">
                                {searchTerm || filterType !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No promotions have been created yet.'}
                            </p>
                            <button
                                onClick={handleCreatePromotion}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Promotion
                            </button>
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
                                                onClick={() => handleSort('title')}
                                            >
                                                <div className="flex items-center">
                                                    Title
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('number_orders')}
                                            >
                                                <div className="flex items-center">
                                                    Items/Nights
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion</th>
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
                                        {currentPromotions.map((promotion) => {
                                            const TypeIcon = TYPE_CHOICES[promotion.type]?.icon || Tag;
                                            return (
                                                <tr key={promotion.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                                            <div className="text-sm font-medium text-gray-900 font-mono">
                                                                {promotion.id}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <Gift className="h-4 w-4 text-amber-600 mr-2" />
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {promotion.title}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_CHOICES[promotion.type]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                            <TypeIcon className="h-3 w-3 mr-1" />
                                                            {TYPE_CHOICES[promotion.type]?.label || promotion.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <Package className="h-4 w-4 text-gray-400 mr-2" />
                                                            <span className="text-sm text-gray-900">
                                                                {promotion.number_orders} {promotion.type === 'product' ? 'Orders' : 'Orders'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs">
                                                        <div className="flex items-start">
                                                            <MessageSquare className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                                            <div className="text-sm text-gray-900">
                                                                <div title={promotion.promotion}>
                                                                    {truncateText(promotion.promotion, 60)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <CalendarDays className="h-4 w-4 mr-2" />
                                                            <div>
                                                                <div className="text-sm text-gray-900">
                                                                    {new Date(promotion.created_at).toLocaleDateString()}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {new Date(promotion.created_at).toLocaleTimeString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center space-x-2">
                                                            <button
                                                                onClick={() => handleViewDetails(promotion)}
                                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditPromotion(promotion)}
                                                                className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                                                                title="Edit Promotion"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
                                                Showing <span className="font-medium">{indexOfFirstPromotion + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastPromotion, filteredPromotions.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredPromotions.length}</span> results
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

                {/* Create/Edit Promotion Modal */}
                {(showCreateModal || showEditModal) && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                                <div className="flex items-center">
                                    <Plus className="h-6 w-6 text-amber-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {showCreateModal ? 'Create New Promotion' : 'Edit Promotion'}
                                    </h3>
                                </div>
                                <button
                                    onClick={showCreateModal ? closeCreateModal : closeEditModal}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleFormSubmit} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                            Promotion Title *
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${formErrors.title ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter promotion title"
                                        />
                                        {formErrors.title && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                                            Promotion Type *
                                        </label>
                                        <select
                                            id="type"
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        >
                                            {Object.entries(TYPE_CHOICES).map(([key, value]) => (
                                                <option key={key} value={key}>{value.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="number_orders" className="block text-sm font-medium text-gray-700 mb-1">
                                            Number of {formData.type === 'product' ? 'Orders' : 'Orders'} *
                                        </label>
                                        <input
                                            type="number"
                                            id="number_orders"
                                            name="number_orders"
                                            value={formData.number_orders}
                                            onChange={handleInputChange}
                                            min="1"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${formErrors.number_orders ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder={`Number of ${formData.type === 'product' ? 'Orders' : 'Orders'}`}
                                        />
                                        {formErrors.number_orders && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.number_orders}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                            {formData.type === 'product'
                                                ? 'How many Orders this promotion applies to'
                                                : 'How many Orders  this promotion applies to'}
                                        </p>
                                    </div>
                                    <div>
                                        <label htmlFor="promotion" className="block text-sm font-medium text-gray-700 mb-1">
                                            Promotion Description *
                                        </label>
                                        <textarea
                                            id="promotion"
                                            name="promotion"
                                            value={formData.promotion}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${formErrors.promotion ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Describe the promotion details, discount amount, terms, conditions..."
                                        />
                                        {formErrors.promotion && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.promotion}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                            Enter detailed description of the promotion including discount amount, terms and conditions
                                        </p>
                                    </div>
                                    {formData.title && formData.number_orders && formData.promotion && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                                            <div className="flex items-center">
                                                <Gift className="h-4 w-4 text-amber-600 mr-2" />
                                                <span className="text-sm text-gray-900">
                                                    {formData.title} - {formData.promotion}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={showCreateModal ? closeCreateModal : closeEditModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center">
                                                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                                {showCreateModal ? 'Creating...' : 'Updating...'}
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <Save className="h-4 w-4 mr-2" />
                                                {showCreateModal ? 'Create Promotion' : 'Update Promotion'}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Promotion Detail Modal */}
                {showDetailModal && selectedPromotionDetail && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                                <div className="flex items-center">
                                    <Tag className="h-6 w-6 text-amber-600 mr-3" />
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {selectedPromotionDetail.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">Promotion Details</p>
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
                                            <h4 className="text-lg font-medium text-gray-900">Promotion Summary</h4>
                                            <p className="text-sm text-gray-600">ID #{selectedPromotionDetail.id}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${TYPE_CHOICES[selectedPromotionDetail.type]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                {(() => {
                                                    const TypeIcon = TYPE_CHOICES[selectedPromotionDetail.type]?.icon || Tag;
                                                    return <TypeIcon className="h-4 w-4 mr-2" />;
                                                })()}
                                                {TYPE_CHOICES[selectedPromotionDetail.type]?.label || selectedPromotionDetail.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                            <Gift className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase">Promotion</p>
                                            <p className="text-lg font-semibold text-green-600">Active</p>
                                        </div>
                                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                            <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase">Required Qty</p>
                                            <p className="text-lg font-semibold text-gray-900">{selectedPromotionDetail.number_orders}</p>
                                        </div>
                                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                            <CalendarDays className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {new Date(selectedPromotionDetail.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                            <Star className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                                            <p className="text-sm font-semibold text-green-600">Active</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center mb-4">
                                            <Gift className="h-5 w-5 text-amber-600 mr-2" />
                                            <h5 className="text-lg font-medium text-gray-900">Basic Information</h5>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion Title</p>
                                                <p className="text-sm text-gray-900">{selectedPromotionDetail.title}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</p>
                                                <div className="flex items-center mt-1">
                                                    {(() => {
                                                        const TypeIcon = TYPE_CHOICES[selectedPromotionDetail.type]?.icon || Tag;
                                                        return <TypeIcon className="h-4 w-4 text-gray-400 mr-2" />;
                                                    })()}
                                                    <span className="text-sm text-gray-900">
                                                        {TYPE_CHOICES[selectedPromotionDetail.type]?.label || selectedPromotionDetail.type} Promotion
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Required {selectedPromotionDetail.type === 'product' ? 'Items' : 'Nights'}
                                                </p>
                                                <div className="flex items-center mt-1">
                                                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900">
                                                        {selectedPromotionDetail.number_orders} {selectedPromotionDetail.type === 'product' ? 'items minimum' : 'nights minimum'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center mb-4">
                                            <MessageSquare className="h-5 w-5 text-amber-600 mr-2" />
                                            <h5 className="text-lg font-medium text-gray-900">Promotion Details</h5>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                                                <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-amber-400">
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                        {selectedPromotionDetail.promotion}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion Trigger</p>
                                                <p className="text-sm text-gray-900 mt-1">
                                                    Customer must {selectedPromotionDetail.type === 'product' ? 'purchase' : 'book'} at least {selectedPromotionDetail.number_orders} {selectedPromotionDetail.type === 'product' ? 'items' : 'nights'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                    <div className="flex items-center mb-4">
                                        <FileText className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">How This Promotion Works</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                                1
                                            </div>
                                            <div>
                                                <h6 className="text-sm font-medium text-gray-900">Customer Requirements</h6>
                                                <p className="text-sm text-gray-600">
                                                    Customer must {selectedPromotionDetail.type === 'product' ? 'add at least' : 'book at least'} {selectedPromotionDetail.number_orders} {selectedPromotionDetail.type === 'product' ? 'items to their cart' : 'nights for their stay'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                                2
                                            </div>
                                            <div>
                                                <h6 className="text-sm font-medium text-gray-900">Promotion Application</h6>
                                                <p className="text-sm text-gray-600">
                                                    Once requirements are met, the promotion described below is applied to the {selectedPromotionDetail.type === 'product' ? 'order' : 'booking'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                                3
                                            </div>
                                            <div>
                                                <h6 className="text-sm font-medium text-gray-900">Customer Benefits</h6>
                                                <div className="mt-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                                                    <p className="text-sm text-green-700">
                                                        {selectedPromotionDetail.promotion}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Activity className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Promotion Timeline</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Promotion Created</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(selectedPromotionDetail.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(selectedPromotionDetail.updated_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Current Status</p>
                                                <p className="text-xs text-gray-500">Active and Available to Customers</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                                <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                        Promotion #{selectedPromotionDetail.id} • Last viewed: {new Date().toLocaleString()}
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleEditPromotion(selectedPromotionDetail)}
                                            className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                        >
                                            <Edit className="h-4 w-4 mr-2 inline" />
                                            Edit Promotion
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
                )}
            </div>
        </div>
    );
};

export default PromotionManagementPage;
