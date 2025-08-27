import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Plus,
    Download,
    RefreshCw,
    UserCheck,
    UserX,
    Mail,
    Phone,
    MapPin,
    Calendar,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    Gift,
    Percent,
    ShoppingCart,
    TrendingUp,
    Crown,
    Star,
    Tag
} from 'lucide-react';
import { customerService, orderService, promotionService } from '../../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminCustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterLoyalty, setFilterLoyalty] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [customersPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [customerOrderStats, setCustomerOrderStats] = useState({});
    const [loyaltyStats, setLoyaltyStats] = useState({
        totalCustomers: 0,
        loyalCustomers: 0,
        totalDiscountGiven: 0,
        averageOrdersPerCustomer: 0,
        totalPromotionsApplied: 0
    });
    const LOYALTY_DISCOUNT_RATE = 0.05;
    const LOYALTY_ORDER_THRESHOLD = 3;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch both promotions and customers in parallel
                const [promotionsResponse, customersResponse] = await Promise.all([
                    promotionService.getAllPromotions(),
                    customerService.getCustomers(),
                ]);

                const promotionsData = promotionsResponse;
                const customersData = customersResponse.data || customersResponse;

                // Update state
                setPromotions(promotionsData);
                setCustomers(customersData);

                // Now calculate stats with both data available
                await loadCustomerOrderStats(customersData, promotionsData);
            } catch (err) {
                toast.error('Failed to load data. Please try again.');
                console.error('Error loading data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const calculateLoyaltyDiscount = (totalSpent, orderCount) => {
        if (orderCount >= LOYALTY_ORDER_THRESHOLD) {
            return totalSpent * LOYALTY_DISCOUNT_RATE;
        }
        return 0;
    };

    const calculatePromotionBenefit = (orderCount, promotionsData) => {
        let totalPromotionValue = 0;
        const applicablePromotions = [];
        promotionsData.forEach(promotion => {
            if (orderCount >= promotion.number_orders && promotion.type === "product") {
                const timesApplicable = Math.floor(orderCount / promotion.number_orders);
                const promotionValue = timesApplicable * 10;
                totalPromotionValue += promotionValue;
                applicablePromotions.push({
                    ...promotion,
                    timesApplicable,
                    value: promotionValue
                });
            }
        });
        return {
            totalValue: totalPromotionValue,
            promotions: applicablePromotions
        };
    };

    const loadCustomerOrderStats = async (customersData, promotionsData) => {
        try {
            const stats = {};
            let totalDiscountGiven = 0;
            let loyalCustomerCount = 0;
            let totalOrders = 0;
            let totalPromotionsApplied = 0;

            // Fetch all orders (for all customers)
            const allOrdersResponse = await orderService.getAllOrders({});
            const allOrders = allOrdersResponse.results || allOrdersResponse.data || allOrdersResponse || [];

            await Promise.all(customersData.map(async (customer) => {
                try {
                    // Filter orders for the current customer in the frontend
                    const customerOrders = allOrders.filter(order => order.customer.id === customer.id);
                    // Example: Filter orders from the last 30 days
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const filteredOrders = customerOrders.filter(order => {
                        const orderDate = new Date(order.created_at);
                        return orderDate >= thirtyDaysAgo;
                    });
                    const orderCount = filteredOrders.length;
                    const totalSpent = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
                    const isLoyalCustomer = orderCount >= LOYALTY_ORDER_THRESHOLD;
                    const loyaltyDiscount = calculateLoyaltyDiscount(totalSpent, orderCount);
                    const promotionBenefit = calculatePromotionBenefit(orderCount, promotionsData);
                    const totalDiscount = loyaltyDiscount + promotionBenefit.totalValue;
                    const finalAmount = Math.max(0, totalSpent - totalDiscount);

                    stats[customer.id] = {
                        orderCount,
                        totalSpent,
                        isLoyalCustomer,
                        loyaltyDiscount,
                        promotionBenefit: promotionBenefit.totalValue,
                        applicablePromotions: promotionBenefit.promotions,
                        totalDiscount,
                        finalAmount,
                        lastOrderDate: filteredOrders.length > 0 ? filteredOrders[0]?.created_at : null
                    };

                    if (isLoyalCustomer) {
                        loyalCustomerCount++;
                    }
                    totalDiscountGiven += totalDiscount;
                    totalOrders += orderCount;
                    totalPromotionsApplied += promotionBenefit.promotions.length;
                } catch (error) {
                    console.error(`Error fetching orders for customer ${customer.id}:`, error);
                    stats[customer.id] = {
                        orderCount: 0,
                        totalSpent: 0,
                        isLoyalCustomer: false,
                        loyaltyDiscount: 0,
                        promotionBenefit: 0,
                        applicablePromotions: [],
                        totalDiscount: 0,
                        finalAmount: 0,
                        lastOrderDate: null
                    };
                }
            }));

            setCustomerOrderStats(stats);
            setLoyaltyStats({
                totalCustomers: customersData.length,
                loyalCustomers: loyalCustomerCount,
                totalDiscountGiven,
                averageOrdersPerCustomer: customersData.length > 0 ? totalOrders / customersData.length : 0,
                totalPromotionsApplied
            });
        } catch (error) {
            console.error('Error loading customer order stats:', error);
        }
    };

    const handleViewDetails = async (customer) => {
        setSelectedCustomerDetail(customer);
        setShowDetailModal(true);
        setShowActionMenu(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedCustomerDetail(null);
    };

    const refreshCustomers = async () => {
        setIsRefreshing(true);
        try {
            const [promotionsResponse, customersResponse] = await Promise.all([
                promotionService.getAllPromotions(),
                customerService.getCustomers(),
            ]);

            const promotionsData = promotionsResponse;
            const customersData = customersResponse.data || customersResponse;

            setPromotions(promotionsData);
            setCustomers(customersData);
            await loadCustomerOrderStats(customersData, promotionsData);
        } catch (err) {
            toast.error('Failed to refresh data. Please try again.');
            console.error('Error refreshing data:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const exportCustomers = () => {
        const csvContent = [
            [
                'Name', 'Email', 'Phone', 'Location', 'Status', 'Join Date',
                'Orders Count', 'Total Spent', 'Loyal Customer', 'Loyalty Discount',
                'Promotion Benefits', 'Total Discount', 'Final Amount'
            ],
            ...filteredCustomers.map(customer => {
                const stats = customerOrderStats[customer.id] || {};
                return [
                    `${customer.first_name} ${customer.last_name}`,
                    customer.email,
                    customer.phone || 'N/A',
                    customer.location || 'N/A',
                    customer.status || 'active',
                    new Date(customer.created_at || Date.now()).toLocaleDateString(),
                    stats.orderCount || 0,
                    `$${(stats.totalSpent || 0).toFixed(2)}`,
                    stats.isLoyalCustomer ? 'Yes' : 'No',
                    `$${(stats.loyaltyDiscount || 0).toFixed(2)}`,
                    `$${(stats.promotionBenefit || 0).toFixed(2)}`,
                    `$${(stats.totalDiscount || 0).toFixed(2)}`,
                    `$${(stats.finalAmount || 0).toFixed(2)}`
                ];
            })
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_with_rewards_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (customer.status || 'active') === filterStatus;
        const stats = customerOrderStats[customer.id] || {};
        const matchesLoyalty = filterLoyalty === 'all' ||
            (filterLoyalty === 'loyal' && stats.isLoyalCustomer) ||
            (filterLoyalty === 'regular' && !stats.isLoyalCustomer);
        return matchesSearch && matchesFilter && matchesLoyalty;
    });

    // Pagination
    const indexOfLastCustomer = currentPage * customersPerPage;
    const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    const getGenderLabel = (gender) => {
        switch (gender) {
            case 'M': return 'Male';
            case 'F': return 'Female';
            case 'O': return 'Other';
            default: return 'N/A';
        }
    };

    const getMaritalStatusLabel = (status) => {
        switch (status) {
            case 'S': return 'Single';
            case 'M': return 'Married';
            case 'D': return 'Divorced';
            case 'W': return 'Widowed';
            default: return 'N/A';
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Customers</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={refreshCustomers}
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
                            <Users className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
                                <p className="text-sm text-gray-600">Manage customers with loyalty rewards & promotions</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshCustomers}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportCustomers}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                                <p className="text-2xl font-semibold text-gray-900">{loyaltyStats.totalCustomers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Crown className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">VIP Customers</p>
                                <p className="text-2xl font-semibold text-gray-900">{loyaltyStats.loyalCustomers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Percent className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Benefits</p>
                                <p className="text-2xl font-semibold text-gray-900">${loyaltyStats.totalDiscountGiven.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Tag className="h-8 w-8 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Promotions Applied</p>
                                <p className="text-2xl font-semibold text-gray-900">{loyaltyStats.totalPromotionsApplied}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-8 w-8 text-amber-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Orders</p>
                                <p className="text-2xl font-semibold text-gray-900">{loyaltyStats.averageOrdersPerCustomer.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Rewards Program Info */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <Crown className="h-6 w-6 text-purple-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">VIP Loyalty & Promotion Program</h3>
                            <p className="text-sm text-gray-600">
                                Customers with {LOYALTY_ORDER_THRESHOLD}+ orders become VIP members (5% discount) + additional promotions based on order quantity.
                            </p>
                        </div>
                    </div>
                </div>
                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
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
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="relative">
                                <Crown className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterLoyalty}
                                    onChange={(e) => setFilterLoyalty(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="all">All Customers</option>
                                    <option value="loyal">VIP Customers</option>
                                    <option value="regular">Regular Customers</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Total: {filteredCustomers.length} customers</span>
                        </div>
                    </div>
                </div>
                {/* Customers Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading customers...</p>
                            </div>
                        </div>
                    ) : currentCustomers.length === 0 ? (
                        <div className="text-center py-20">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                            <p className="text-gray-600">
                                {searchTerm || filterStatus !== 'all' || filterLoyalty !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No customers have registered yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Stats</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rewards & Promotions</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentCustomers.map((customer, index) => {
                                            const stats = customerOrderStats[customer.id] || {};
                                            return (
                                                <tr key={customer.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-500 text-center whitespace-nowrap">#{index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className={`h-10 w-10 rounded-full ${stats.isLoyalCustomer ? 'bg-purple-100' : 'bg-amber-100'} flex items-center justify-center relative`}>
                                                                    <span className={`text-sm font-medium ${stats.isLoyalCustomer ? 'text-purple-800' : 'text-amber-800'}`}>
                                                                        {customer.first_name?.[0]}{customer.last_name?.[0]}
                                                                    </span>
                                                                    {stats.isLoyalCustomer && (
                                                                        <Crown className="h-3 w-3 text-purple-600 absolute -top-1 -right-1" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900 flex items-center">
                                                                    {customer.first_name} {customer.last_name}
                                                                    {stats.isLoyalCustomer && (
                                                                        <Star className="h-4 w-4 text-purple-500 ml-2" title="VIP Customer" />
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-gray-500">@{customer.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                                                {customer.email}
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                                                {customer.phone || 'N/A'}
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                                                                {customer.location || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <ShoppingCart className="h-3 w-3 mr-2 text-gray-400" />
                                                                {stats.orderCount || 0} orders
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <TrendingUp className="h-3 w-3 mr-2 text-gray-400" />
                                                                ${(stats.totalSpent || 0).toFixed(2)} spent
                                                            </div>
                                                            {stats.lastOrderDate && (
                                                                <div className="text-xs text-gray-400">
                                                                    Last: {new Date(stats.lastOrderDate).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            {stats.isLoyalCustomer ? (
                                                                <div className="space-y-1">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                                        <Crown className="h-3 w-3 mr-1" />
                                                                        VIP Member
                                                                    </span>
                                                                    <div className="text-xs text-purple-600">
                                                                        <Percent className="h-3 w-3 inline mr-1" />
                                                                        ${(stats.loyaltyDiscount || 0).toFixed(2)} loyalty
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                                        <User className="h-3 w-3 mr-1" />
                                                                        Regular
                                                                    </span>
                                                                    <div className="text-xs text-gray-500">
                                                                        {LOYALTY_ORDER_THRESHOLD - (stats.orderCount || 0)} more for VIP
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {stats.applicablePromotions && stats.applicablePromotions.length > 0 && (
                                                                <div className="space-y-1">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                                        <Tag className="h-3 w-3 mr-1" />
                                                                        {stats.applicablePromotions.length} Promos
                                                                    </span>
                                                                    <div className="text-xs text-orange-600">
                                                                        <Gift className="h-3 w-3 inline mr-1" />
                                                                        ${(stats.promotionBenefit || 0).toFixed(2)} benefits
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {(stats.totalDiscount || 0) > 0 && (
                                                                <div className="text-xs text-green-600 font-semibold">
                                                                    Total: ${(stats.totalDiscount || 0).toFixed(2)} saved
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(customer.status || 'A')}`}>
                                                            {customer.status === 'A' ? (
                                                                <UserCheck className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <UserX className="h-3 w-3 mr-1" />
                                                            )}
                                                            {customer.status === 'A' ? 'Active' : customer.status === 'I' ? 'Inactive' : customer.status === 'S' ? 'Suspended' : 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleViewDetails(customer)}
                                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
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
                                                Showing <span className="font-medium">{indexOfFirstCustomer + 1}</span> to{' '}
                                                <span className="font-medium">{Math.min(indexOfLastCustomer, filteredCustomers.length)}</span>{' '}
                                                of <span className="font-medium">{filteredCustomers.length}</span> results
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
            {/* Click outside to close action menu */}
            {showActionMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowActionMenu(null)}
                />
            )}
            {/* Customer Detail Modal */}
            {showDetailModal && selectedCustomerDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <div className={`h-12 w-12 rounded-full ${customerOrderStats[selectedCustomerDetail.id]?.isLoyalCustomer ? 'bg-purple-100' : 'bg-amber-100'} flex items-center justify-center mr-4 relative`}>
                                    <span className={`text-lg font-medium ${customerOrderStats[selectedCustomerDetail.id]?.isLoyalCustomer ? 'text-purple-800' : 'text-amber-800'}`}>
                                        {selectedCustomerDetail.first_name?.[0]}{selectedCustomerDetail.last_name?.[0]}
                                    </span>
                                    {customerOrderStats[selectedCustomerDetail.id]?.isLoyalCustomer && (
                                        <Crown className="h-4 w-4 text-purple-600 absolute -top-1 -right-1" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                        {selectedCustomerDetail.first_name} {selectedCustomerDetail.last_name}
                                        {customerOrderStats[selectedCustomerDetail.id]?.isLoyalCustomer && (
                                            <Star className="h-5 w-5 text-purple-500 ml-2" />
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Customer Details {customerOrderStats[selectedCustomerDetail.id]?.isLoyalCustomer && '• VIP Member'}
                                    </p>
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
                            {(() => {
                                const stats = customerOrderStats[selectedCustomerDetail.id] || {};
                                return (
                                    <>
                                        {/* Rewards Status Banner */}
                                        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    {stats.isLoyalCustomer ? (
                                                        <Crown className="h-6 w-6 text-purple-600 mr-3" />
                                                    ) : (
                                                        <Gift className="h-6 w-6 text-orange-600 mr-3" />
                                                    )}
                                                    <div>
                                                        <h4 className="text-lg font-medium text-gray-900">
                                                            {stats.isLoyalCustomer ? '🎉 VIP Customer Status!' : '🎁 Rewards & Promotions'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {stats.isLoyalCustomer
                                                                ? `This customer has ${stats.orderCount} orders and receives a ${(LOYALTY_DISCOUNT_RATE * 100)}% loyalty discount`
                                                                : `Customer has ${stats.orderCount} orders and qualifies for promotions`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-green-600">
                                                        ${(stats.totalDiscount || 0).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Total Benefits</div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Status and Basic Info */}
                                        <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="text-lg font-medium text-gray-900">@{selectedCustomerDetail.username}</h4>
                                                    <p className="text-sm text-gray-600">Customer ID: {selectedCustomerDetail.id}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedCustomerDetail.status || 'active')}`}>
                                                        {selectedCustomerDetail.status === 'active' ? (
                                                            <UserCheck className="h-4 w-4 mr-2" />
                                                        ) : (
                                                            <UserX className="h-4 w-4 mr-2" />
                                                        )}
                                                        {(selectedCustomerDetail.status || 'active').charAt(0).toUpperCase() + (selectedCustomerDetail.status || 'active').slice(1)} Member
                                                    </span>
                                                    {stats.isLoyalCustomer && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                            <Crown className="h-4 w-4 mr-2" />
                                                            VIP Member
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <Calendar className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Member Since</p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {new Date(selectedCustomerDetail.created_at || Date.now()).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <ShoppingCart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Total Orders</p>
                                                    <p className="text-sm font-semibold text-gray-900">{stats.orderCount || 0}</p>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Total Spent</p>
                                                    <p className="text-sm font-semibold text-gray-900">${(stats.totalSpent || 0).toFixed(2)}</p>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <Percent className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Loyalty Discount</p>
                                                    <p className="text-sm font-semibold text-purple-600">${(stats.loyaltyDiscount || 0).toFixed(2)}</p>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <Tag className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Promotion Benefits</p>
                                                    <p className="text-sm font-semibold text-orange-600">${(stats.promotionBenefit || 0).toFixed(2)}</p>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <Gift className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Final Amount</p>
                                                    <p className="text-sm font-semibold text-green-600">${(stats.finalAmount || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Applicable Promotions Section */}
                                        {stats.applicablePromotions && stats.applicablePromotions.length > 0 && (
                                            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                                                <div className="flex items-center mb-4">
                                                    <Tag className="h-6 w-6 text-orange-600 mr-3" />
                                                    <h4 className="text-lg font-medium text-gray-900">Active Promotions</h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {stats.applicablePromotions.map((promo, index) => (
                                                        <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-medium text-gray-900">{promo.title}</h5>
                                                                <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                                    {promo.get_type_display || promo.type}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-2">{promo.promotion}</p>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-500">
                                                                    Applied {promo.timesApplicable}x (requires {promo.number_orders} orders)
                                                                </span>
                                                                <span className="text-green-600 font-semibold">
                                                                    +${promo.value.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Information Sections */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Contact Information */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center mb-4">
                                                    <Mail className="h-5 w-5 text-amber-600 mr-2" />
                                                    <h5 className="text-lg font-medium text-gray-900">Contact Information</h5>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-start">
                                                        <Mail className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</p>
                                                            <p className="text-sm text-gray-900 break-all">{selectedCustomerDetail.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <Phone className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</p>
                                                            <p className="text-sm text-gray-900">{selectedCustomerDetail.phone || 'Not provided'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <MapPin className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</p>
                                                            <p className="text-sm text-gray-900">{selectedCustomerDetail.location || 'Not provided'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Personal Information */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center mb-4">
                                                    <User className="h-5 w-5 text-amber-600 mr-2" />
                                                    <h5 className="text-lg font-medium text-gray-900">Personal Information</h5>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</p>
                                                        <p className="text-sm text-gray-900">{selectedCustomerDetail.first_name} {selectedCustomerDetail.last_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Username</p>
                                                        <p className="text-sm text-gray-900">@{selectedCustomerDetail.username}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</p>
                                                        <p className="text-sm text-gray-900">{getGenderLabel(selectedCustomerDetail.gender)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Marital Status</p>
                                                        <p className="text-sm text-gray-900">{getMaritalStatusLabel(selectedCustomerDetail.marital_status)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Order & Rewards Statistics */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center mb-4">
                                                    <ShoppingCart className="h-5 w-5 text-amber-600 mr-2" />
                                                    <h5 className="text-lg font-medium text-gray-900">Order & Rewards Statistics</h5>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
                                                        <p className="text-sm text-gray-900">{stats.orderCount || 0} orders placed</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Original Total Spent</p>
                                                        <p className="text-sm text-gray-900">${(stats.totalSpent || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Loyalty Discount Applied</p>
                                                        <p className="text-sm text-purple-600 font-semibold">${(stats.loyaltyDiscount || 0).toFixed(2)} {stats.isLoyalCustomer ? '(5%)' : '(0%)'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion Benefits</p>
                                                        <p className="text-sm text-orange-600 font-semibold">${(stats.promotionBenefit || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="border-t pt-2">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Final Amount Paid</p>
                                                        <p className="text-sm text-green-600 font-bold text-lg">${(stats.finalAmount || 0).toFixed(2)}</p>
                                                    </div>
                                                    {stats.lastOrderDate && (
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</p>
                                                            <p className="text-sm text-gray-900">
                                                                {new Date(stats.lastOrderDate).toLocaleDateString('en-US', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Loyalty Program Status */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center mb-4">
                                                    <Crown className="h-5 w-5 text-amber-600 mr-2" />
                                                    <h5 className="text-lg font-medium text-gray-900">Loyalty Program Status</h5>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Membership Level</p>
                                                        <p className={`text-sm font-semibold ${stats.isLoyalCustomer ? 'text-purple-600' : 'text-gray-900'}`}>
                                                            {stats.isLoyalCustomer ? 'VIP Member' : 'Standard Member'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Loyalty Discount Rate</p>
                                                        <p className={`text-sm font-semibold ${stats.isLoyalCustomer ? 'text-purple-600' : 'text-gray-500'}`}>
                                                            {stats.isLoyalCustomer ? '5% on all orders' : '0% (Standard)'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Progress to VIP</p>
                                                        <div className="mt-2">
                                                            <div className="flex items-center">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                                                    <div
                                                                        className={`h-2 rounded-full transition-all duration-300 ${stats.isLoyalCustomer ? 'bg-purple-600' : 'bg-amber-600'}`}
                                                                        style={{
                                                                            width: `${Math.min(((stats.orderCount || 0) / LOYALTY_ORDER_THRESHOLD) * 100, 100)}%`
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {stats.orderCount || 0}/{LOYALTY_ORDER_THRESHOLD}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Loyalty Savings</p>
                                                        <p className="text-sm font-semibold text-green-600">
                                                            ${(stats.loyaltyDiscount || 0).toFixed(2)} lifetime savings
                                                        </p>
                                                    </div>
                                                    {!stats.isLoyalCustomer && (
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Orders Until VIP</p>
                                                            <p className="text-sm text-gray-900">
                                                                {LOYALTY_ORDER_THRESHOLD - (stats.orderCount || 0)} more orders needed
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Account Timeline */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center mb-4">
                                                    <Calendar className="h-5 w-5 text-amber-600 mr-2" />
                                                    <h5 className="text-lg font-medium text-gray-900">Account Timeline</h5>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</p>
                                                            <p className="text-sm text-gray-900">
                                                                {new Date(selectedCustomerDetail.created_at || Date.now()).toLocaleDateString('en-US', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {stats.isLoyalCustomer && (
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">VIP Status Achieved</p>
                                                                <p className="text-sm text-gray-900">
                                                                    After {LOYALTY_ORDER_THRESHOLD} orders
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {stats.applicablePromotions && stats.applicablePromotions.length > 0 && (
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Promotions</p>
                                                                <p className="text-sm text-gray-900">
                                                                    {stats.applicablePromotions.length} promotion{stats.applicablePromotions.length > 1 ? 's' : ''} applied
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {stats.lastOrderDate && (
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</p>
                                                                <p className="text-sm text-gray-900">
                                                                    {new Date(stats.lastOrderDate).toLocaleDateString('en-US', {
                                                                        weekday: 'long',
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center">
                                                        <div className={`w-2 h-2 rounded-full mr-3 ${selectedCustomerDetail.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</p>
                                                            <p className="text-sm text-gray-900">
                                                                {(selectedCustomerDetail.status || 'active').charAt(0).toUpperCase() + (selectedCustomerDetail.status || 'active').slice(1)} Member
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Additional Details */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center mb-4">
                                                    <UserCheck className="h-5 w-5 text-amber-600 mr-2" />
                                                    <h5 className="text-lg font-medium text-gray-900">Additional Details</h5>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profile Completion</p>
                                                        <div className="mt-2">
                                                            <div className="flex items-center">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                                                    <div
                                                                        className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                                                                        style={{
                                                                            width: `${Math.round(
                                                                                (Object.values(selectedCustomerDetail).filter(val => val && val !== '').length /
                                                                                    Object.keys(selectedCustomerDetail).length) * 100
                                                                            )}%`
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {Math.round(
                                                                        (Object.values(selectedCustomerDetail).filter(val => val && val !== '').length /
                                                                            Object.keys(selectedCustomerDetail).length) * 100
                                                                    )}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Average Order Value</p>
                                                        <p className="text-sm text-gray-900">
                                                            ${stats.orderCount > 0 ? ((stats.totalSpent || 0) / stats.orderCount).toFixed(2) : '0.00'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Value Score</p>
                                                        <p className={`text-sm font-semibold ${stats.isLoyalCustomer ? 'text-purple-600' : stats.orderCount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                                                            {stats.isLoyalCustomer ? 'High Value (VIP)' : stats.orderCount > 0 ? 'Active Customer' : 'New Customer'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Savings</p>
                                                        <p className="text-sm text-green-600 font-semibold">
                                                            ${(stats.totalDiscount || 0).toFixed(2)} (Loyalty + Promotions)
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Savings Percentage</p>
                                                        <p className="text-sm text-gray-900">
                                                            {stats.totalSpent > 0 ? (((stats.totalDiscount || 0) / stats.totalSpent) * 100).toFixed(1) : 0}% of total spent
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                    Customer ID: {selectedCustomerDetail.id} • Last viewed: {new Date().toLocaleString()}
                                    {customerOrderStats[selectedCustomerDetail.id]?.isLoyalCustomer && (
                                        <span className="text-purple-600 font-medium"> • VIP Member</span>
                                    )}
                                    {customerOrderStats[selectedCustomerDetail.id]?.applicablePromotions?.length > 0 && (
                                        <span className="text-orange-600 font-medium"> • {customerOrderStats[selectedCustomerDetail.id].applicablePromotions.length} Active Promotions</span>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={closeDetailModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        Close
                                    </button>
                                    {customerOrderStats[selectedCustomerDetail.id]?.isLoyalCustomer && (
                                        <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
                                            <Crown className="h-4 w-4 mr-2 inline" />
                                            VIP Report
                                        </button>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomersPage;
