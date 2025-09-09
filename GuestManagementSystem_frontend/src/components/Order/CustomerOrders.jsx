import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Search, Filter, Eye, RefreshCw, Download,
    DollarSign, Calendar, ChevronLeft, ChevronRight, X,
    AlertCircle, CheckCircle, XCircle, Clock, Truck, Package,
    User, Hash, FileText, ArrowUpDown, TrendingUp, Activity, LogOut, Home
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { orderService } from '../../api';

const CustomerOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        delivered: 0,
        cancelled: 0,
        totalSpent: 0
    });

    const STATUS_CHOICES = {
        'P': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        'C': { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        'PR': { label: 'Processing', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        'S': { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        'D': { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200' },
        'CA': { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' },
        'R': { label: 'Returned', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };

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

    useEffect(() => {
        if (isAuthenticated && user) {
            loadOrders();
        }
    }, [currentPage, sortField, sortDirection, isAuthenticated, user]);

    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else if (isAuthenticated && user) {
            loadOrders();
        }
    }, [filterStatus, filterDateRange, searchTerm]);

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
        setIsAuthenticated(false);
        setUser(null);
        setOrders([]);
        window.location.href = '/login';
    };

    const loadOrders = async () => {
        if (!user?.id) return;
        try {
            setIsLoading(true);
            setError(null);
            const params = {
                user_id: user.id,
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
            const response = await orderService.getOrders(params);
            if (response.results) {
                setOrders(response.results);
                calculateStats(response.results);
            } else {
                setOrders(response.data || response || []);
                calculateStats(response.data || response || []);
            }
        } catch (err) {
            toast.error('Failed to load your orders. Please try again.');
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
            totalSpent: ordersData
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

    const refreshOrders = async () => {
        setIsRefreshing(true);
        await loadOrders();
        setIsRefreshing(false);
    };

    const exportOrders = () => {
        const csvContent = [
            ['Order Number', 'Status', 'Total Amount', 'Items', 'Created Date'],
            ...filteredOrders.map(order => [
                order.order_number,
                STATUS_CHOICES[order.status]?.label || order.status,
                order.total_amount,
                order.order_items?.length || 0,
                new Date(order.created_at).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_orders_${new Date().toISOString().split('T')[0]}.csv`;
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

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <ShoppingCart className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h2>
                    <p className="text-gray-600 mb-6">Please log in to view your order history</p>
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
            <div className="bg-white shadow-sm ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <ShoppingCart className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                                <p className="text-sm text-gray-600">Track and manage your order history</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>Welcome, {user?.first_name || user?.username || user?.email}</span>
                            </div>
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
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading your orders...</p>
                            </div>
                        </div>
                    ) : currentOrders.length === 0 ? (
                        <div className="text-center py-20">
                            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {orders.length === 0 ? 'No orders yet' : 'No orders found'}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {orders.length === 0
                                    ? 'You haven\'t placed any orders yet. Start shopping to see your orders here!'
                                    : 'Try adjusting your search or filter criteria.'}
                            </p>
                            {orders.length === 0 && (
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                                >
                                    Start Shopping
                                </button>
                            )}
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
                                                    Order Date
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
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
                                                {/* <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleViewDetails(order)}
                                                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View Details
                                                    </button>
                                                </td> */}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
            {showDetailModal && selectedOrderDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                        <div className="p-6">
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <p className="text-xs font-medium text-gray-500 uppercase">Order Date</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(selectedOrderDetail.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <ShoppingCart className="h-5 w-5 text-amber-600 mr-2" />
                                    <h5 className="text-lg font-medium text-gray-900">Order Information</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</p>
                                        <div className="flex items-center mt-1">
                                            <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                            <p className="text-sm text-gray-900 font-mono">{selectedOrderDetail.order_number}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${STATUS_CHOICES[selectedOrderDetail.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                {getStatusIcon(selectedOrderDetail.status)}
                                                <span className="ml-1">{STATUS_CHOICES[selectedOrderDetail.status]?.label || selectedOrderDetail.status}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</p>
                                        <div className="flex items-center mt-1">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                            <p className="text-sm text-gray-900">
                                                {new Date(selectedOrderDetail.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</p>
                                        <div className="flex items-center mt-1">
                                            <RefreshCw className="h-4 w-4 text-gray-400 mr-2" />
                                            <p className="text-sm text-gray-900">
                                                {new Date(selectedOrderDetail.updated_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {selectedOrderDetail.notes && (
                                    <div className="mt-4">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</p>
                                        <div className="flex items-start mt-1">
                                            <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                                            <p className="text-sm text-gray-900">{selectedOrderDetail.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                    Order #{selectedOrderDetail.order_number} • Status: {STATUS_CHOICES[selectedOrderDetail.status]?.label || selectedOrderDetail.status}
                                </div>
                                <div className="flex space-x-3">
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
        </div>
    );
};

export default CustomerOrdersPage;
