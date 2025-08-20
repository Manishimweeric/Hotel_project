import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Search, Filter, Eye, Edit, RefreshCw, Download,
    DollarSign, Calendar, MoreVertical, ChevronLeft, ChevronRight,
    X, AlertCircle, CheckCircle, XCircle, Clock, Truck, Package,
    User, MapPin, Phone, Mail, Hash, FileText, ArrowUpDown,
    TrendingUp, Users, CreditCard, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { orderService } from '../../api';

const OrderManagementPage = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0
    });

    const STATUS_CHOICES = {
        'P': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        'C': { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    };

    useEffect(() => {
        loadOrders();
    }, [currentPage, sortField, sortDirection]);

    useEffect(() => {
        // Reset to first page when filters change
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            loadOrders();
        }
    }, [filterStatus, filterDateRange, searchTerm]);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = {
                page: currentPage,
                page_size: ordersPerPage,
                ordering: sortDirection === 'desc' ? `-${sortField}` : sortField
            };

            if (filterStatus && filterStatus !== 'all') {
                params.status = filterStatus;
            }

            if (searchTerm) {
                params.search = searchTerm;
            }

            if (filterDateRange && filterDateRange !== 'all') {
                const now = new Date();
                let startDate;

                switch (filterDateRange) {
                    case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                    case '3months':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                        break;
                    default:
                        startDate = null;
                }

                if (startDate) {
                    params.created_at__gte = startDate.toISOString().split('T')[0];
                }
            }

            const response = await orderService.getAllOrders(params);

            if (response.results) {
                setOrders(response.results);
                calculateStats(response.results);
            } else {
                setOrders(response.data || response);
                calculateStats(response.data || response);
            }
        } catch (err) {
            toast.error('Failed to load orders. Please try again.');
            console.error('Error loading orders:', err);
            setError('Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (ordersData) => {
        const stats = {
            total: ordersData.length,
            pending: ordersData.filter(order => order.status === 'P').length,
            confirmed: ordersData.filter(order => order.status === 'C').length,
            delivered: ordersData.filter(order => order.status === 'D').length,
            cancelled: ordersData.filter(order => order.status === 'CA').length,
            totalRevenue: ordersData
                .filter(order => ['D', 'C', 'PR', 'S'].includes(order.status))
                .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
        };
        setStats(stats);
    };

    const handleViewDetails = async (order) => {
        try {
            setIsLoading(true);
            const detailedOrder = await orderService.getOrder(order.id);
            setSelectedOrderDetail(detailedOrder);
            setShowDetailModal(true);
            setShowActionMenu(null);
        } catch (error) {
            toast.error('Failed to load order details');
            console.error('Error loading order details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedOrderDetail(null);
    };

    const handleUpdateStatus = (order) => {
        setOrderToUpdate(order);
        setNewStatus(order.status);
        setShowStatusModal(true);
        setShowActionMenu(null);
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
        setOrderToUpdate(null);
        setNewStatus('');
    };

    const confirmUpdateStatus = async () => {
        if (!orderToUpdate || !newStatus) return;

        try {
            setStatusUpdating(true);
            await orderService.updateOrderStatus(orderToUpdate.id, { status: newStatus });
            toast.success('Order status updated successfully!');
            closeStatusModal();
            loadOrders();
        } catch (error) {
            toast.error('Failed to update order status');
            console.error('Error updating status:', error);
        } finally {
            setStatusUpdating(false);
        }
    };

    const refreshOrders = async () => {
        setIsRefreshing(true);
        await loadOrders();
        setIsRefreshing(false);
    };

    const exportOrders = () => {
        const csvContent = [
            ['Order Number', 'Customer', 'Status', 'Total Amount', 'Items', 'Created Date', 'Updated Date'],
            ...filteredOrders.map(order => [
                order.order_number,
                order.customer?.username || order.customer?.email || 'N/A',
                STATUS_CHOICES[order.status]?.label || order.status,
                order.total_amount,
                order.order_items?.length || 0,
                new Date(order.created_at).toLocaleDateString(),
                new Date(order.updated_at).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
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

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'P': return <Clock className="h-4 w-4" />;
            case 'C': return <CheckCircle className="h-4 w-4" />;
            case 'PR': return <Activity className="h-4 w-4" />;
            case 'S': return <Truck className="h-4 w-4" />;
            case 'D': return <Package className="h-4 w-4" />;
            case 'CA': return <XCircle className="h-4 w-4" />;
            case 'R': return <RefreshCw className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Orders</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadOrders}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Try Again
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
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <ShoppingCart className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                                <p className="text-sm text-gray-600">Manage customer orders and track status</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshOrders}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportOrders}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShoppingCart className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Pending</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.confirmed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Package className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Delivered</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.delivered}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.cancelled}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Revenue</p>
                                <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
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
                                        placeholder="Search orders..."
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
                                        <option value="all">All Status</option>
                                        {Object.entries(STATUS_CHOICES).map(([key, value]) => (
                                            <option key={key} value={key}>{value.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={filterDateRange}
                                        onChange={(e) => setFilterDateRange(e.target.value)}
                                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">Last 7 Days</option>
                                        <option value="month">This Month</option>
                                        <option value="3months">Last 3 Months</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Total: {filteredOrders.length} orders</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading orders...</p>
                            </div>
                        </div>
                    ) : currentOrders.length === 0 ? (
                        <div className="text-center py-20">
                            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                            <p className="text-gray-600">
                                {searchTerm || filterStatus !== 'all' || filterDateRange !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No orders have been placed yet.'}
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
                                                onClick={() => handleSort('order_number')}
                                            >
                                                <div className="flex items-center">
                                                    Order Number
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('total_amount')}
                                            >
                                                <div className="flex items-center">
                                                    Total Amount
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
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
                                        {currentOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 font-mono">
                                                                {order.order_number}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                ID: {order.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <User className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {order.customer?.username || order.customer?.first_name || 'N/A'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {order.customer?.email || 'No email'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_CHOICES[order.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                        {getStatusIcon(order.status)}
                                                        <span className="ml-1">{STATUS_CHOICES[order.status]?.label || order.status}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            ${parseFloat(order.total_amount || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                                                        <span className="text-sm text-gray-900">
                                                            {order.order_items?.length || 0} items
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        <div>
                                                            <div>{new Date(order.created_at).toLocaleDateString()}</div>
                                                            <div className="text-xs">
                                                                {new Date(order.created_at).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(order)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(order)}
                                                            className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                                                            title="Update Status"
                                                        >
                                                            <Edit className="h-4 w-4" />
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
                                                Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastOrder, filteredOrders.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredOrders.length}</span> results
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
            </div>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrderDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <ShoppingCart className="h-6 w-6 text-amber-600 mr-3" />
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Order {selectedOrderDetail.order_number}
                                    </h3>
                                    <p className="text-sm text-gray-600">Order Details</p>
                                </div>
                            </div>
                            <button
                                onClick={closeDetailModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Order Summary */}
                            <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">Order Summary</h4>
                                        <p className="text-sm text-gray-600">Order #{selectedOrderDetail.order_number}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_CHOICES[selectedOrderDetail.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                            {getStatusIcon(selectedOrderDetail.status)}
                                            <span className="ml-2">{STATUS_CHOICES[selectedOrderDetail.status]?.label || selectedOrderDetail.status}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Total Amount</p>
                                        <p className="text-lg font-semibold text-gray-900">${parseFloat(selectedOrderDetail.total_amount || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Items</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedOrderDetail.order_items?.length || 0}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(selectedOrderDetail.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <RefreshCw className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Updated</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(selectedOrderDetail.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer and Order Information */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Customer Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <User className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Customer Information</h5>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</p>
                                            <p className="text-sm text-gray-900">
                                                {selectedOrderDetail.customer?.first_name || selectedOrderDetail.customer?.username || 'N/A'}
                                                {selectedOrderDetail.customer?.last_name && ` ${selectedOrderDetail.customer.last_name}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900">{selectedOrderDetail.customer?.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                                            <div className="flex items-center">
                                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900">{selectedOrderDetail.customer?.phone || 'No phone'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <ShoppingCart className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Order Information</h5>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</p>
                                            <div className="flex items-center">
                                                <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900 font-mono">{selectedOrderDetail.order_number}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${STATUS_CHOICES[selectedOrderDetail.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                {getStatusIcon(selectedOrderDetail.status)}
                                                <span className="ml-1">{STATUS_CHOICES[selectedOrderDetail.status]?.label || selectedOrderDetail.status}</span>
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</p>
                                            <div className="flex items-start">
                                                <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                                                <p className="text-sm text-gray-900">{selectedOrderDetail.notes || 'No notes'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <Package className="h-5 w-5 text-amber-600 mr-2" />
                                    <h5 className="text-lg font-medium text-gray-900">Order Items</h5>
                                </div>
                                {selectedOrderDetail.order_items && selectedOrderDetail.order_items.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedOrderDetail.order_items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <h6 className="text-sm font-medium text-gray-900">
                                                            {item.product?.name || 'Product'}
                                                        </h6>
                                                        <p className="text-xs text-gray-500">
                                                            Quantity: {item.quantity}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Unit Price: ${parseFloat(item.price || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        ${(parseFloat(item.price || 0) * parseInt(item.quantity || 0)).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Subtotal</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Order Total */}
                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="flex justify-between items-center">
                                                <div className="text-lg font-semibold text-gray-900">Order Total:</div>
                                                <div className="text-xl font-bold text-amber-600">
                                                    ${parseFloat(selectedOrderDetail.total_amount || 0).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No items in this order</p>
                                    </div>
                                )}
                            </div>

                            {/* Order Timeline */}
                            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <Calendar className="h-5 w-5 text-amber-600 mr-2" />
                                    <h5 className="text-lg font-medium text-gray-900">Order Timeline</h5>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Order Created</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(selectedOrderDetail.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Last Updated</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(selectedOrderDetail.updated_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-3 ${selectedOrderDetail.status === 'D' ? 'bg-green-500' : selectedOrderDetail.status === 'CA' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Current Status</p>
                                            <p className="text-xs text-gray-500">
                                                {STATUS_CHOICES[selectedOrderDetail.status]?.label || selectedOrderDetail.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                    Order #{selectedOrderDetail.order_number} • Last viewed: {new Date().toLocaleString()}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrderDetail)}
                                        className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        <Edit className="h-4 w-4 mr-2 inline" />
                                        Update Status
                                    </button>
                                    <button
                                        onClick={closeDetailModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">
                                        Print Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && orderToUpdate && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Edit className="h-6 w-6 text-amber-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
                            </div>
                            <button
                                onClick={closeStatusModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <div className="flex items-center mb-2">
                                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                    <h4 className="text-sm font-medium text-gray-900">{orderToUpdate.order_number}</h4>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Customer: {orderToUpdate.customer?.username || orderToUpdate.customer?.email || 'N/A'}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Status
                                </label>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_CHOICES[orderToUpdate.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                    {getStatusIcon(orderToUpdate.status)}
                                    <span className="ml-2">{STATUS_CHOICES[orderToUpdate.status]?.label || orderToUpdate.status}</span>
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Status
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                    {Object.entries(STATUS_CHOICES).map(([key, value]) => (
                                        <option key={key} value={key}>{value.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={closeStatusModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmUpdateStatus}
                                disabled={statusUpdating || newStatus === orderToUpdate.status}
                                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {statusUpdating ? (
                                    <div className="flex items-center">
                                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                        Updating...
                                    </div>
                                ) : (
                                    'Update Status'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagementPage;