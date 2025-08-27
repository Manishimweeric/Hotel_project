import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Search, RefreshCw, TrendingUp, Package, Star,
    Clock, Heart, Plus, Eye, Filter, Calendar, User, LogOut, Home,
    Award, Target, Zap, CheckCircle, ArrowRight, BarChart3
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { orderService } from '../../api';

const CustomerRecommendationsPage = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('frequency');
    const [stats, setStats] = useState({
        totalUniqueProducts: 0,
        frequentlyOrdered: 0,
        totalReorders: 0,
        avgDaysBetweenOrders: 0
    });
    const [filterCategory, setFilterCategory] = useState('all');
    const [categories, setCategories] = useState([]);

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
            loadRecommendations();
        }
    }, [isAuthenticated, user, sortBy]);

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
        setIsAuthenticated(false);
        setUser(null);
        setRecommendations([]);
        window.location.href = '/login';
    };

    const loadRecommendations = async () => {
        if (!user?.id) return;

        try {
            setIsLoading(true);

            // Fetch all orders for the user
            const response = await orderService.getOrders({
                user_id: user.id,
                page_size: 1000, // Get all orders
                status: 'D' // Only delivered orders for accurate recommendations
            });

            const orders = response.results || response.data || response || [];

            if (orders.length === 0) {
                setRecommendations([]);
                setIsLoading(false);
                return;
            }

            // Process orders to generate recommendations
            const productAnalysis = analyzeOrderPatterns(orders);
            const recommendationData = generateRecommendations(productAnalysis, orders);

            setRecommendations(recommendationData);
            calculateStats(recommendationData, orders);
            extractCategories(recommendationData);

        } catch (error) {
            console.error('Error loading recommendations:', error);
            toast.error('Failed to load recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeOrderPatterns = (orders) => {
        const productMap = new Map();

        orders.forEach(order => {
            if (order.order_items && Array.isArray(order.order_items)) {
                order.order_items.forEach(item => {
                    const productId = item.product?.id || item.product_id;
                    const productName = item.product?.name || 'Unknown Product';
                    const productPrice = parseFloat(item.price || 0);
                    const quantity = parseInt(item.quantity || 0);
                    const orderDate = new Date(order.created_at);

                    if (productId) {
                        if (!productMap.has(productId)) {
                            productMap.set(productId, {
                                id: productId,
                                name: productName,
                                category: item.product?.category || 'General',
                                description: item.product?.description || '',
                                image: item.product?.image || null,
                                orders: [],
                                totalQuantity: 0,
                                totalSpent: 0,
                                avgPrice: 0,
                                frequency: 0,
                                firstOrderDate: orderDate,
                                lastOrderDate: orderDate,
                                orderDates: []
                            });
                        }

                        const product = productMap.get(productId);
                        product.orders.push({
                            orderId: order.id,
                            orderNumber: order.order_number,
                            date: orderDate,
                            quantity: quantity,
                            price: productPrice,
                            total: productPrice * quantity
                        });

                        product.totalQuantity += quantity;
                        product.totalSpent += productPrice * quantity;
                        product.frequency += 1;
                        product.orderDates.push(orderDate);

                        if (orderDate < product.firstOrderDate) {
                            product.firstOrderDate = orderDate;
                        }
                        if (orderDate > product.lastOrderDate) {
                            product.lastOrderDate = orderDate;
                        }
                    }
                });
            }
        });

        // Calculate averages and additional metrics
        productMap.forEach((product, productId) => {
            product.avgPrice = product.totalSpent / product.totalQuantity;
            product.avgQuantityPerOrder = product.totalQuantity / product.frequency;

            // Calculate average days between orders
            if (product.orderDates.length > 1) {
                product.orderDates.sort((a, b) => a - b);
                let totalDays = 0;
                for (let i = 1; i < product.orderDates.length; i++) {
                    const daysDiff = (product.orderDates[i] - product.orderDates[i - 1]) / (1000 * 60 * 60 * 24);
                    totalDays += daysDiff;
                }
                product.avgDaysBetweenOrders = totalDays / (product.orderDates.length - 1);
            } else {
                product.avgDaysBetweenOrders = 0;
            }

            // Calculate recency score (days since last order)
            const daysSinceLastOrder = (new Date() - product.lastOrderDate) / (1000 * 60 * 60 * 24);
            product.daysSinceLastOrder = daysSinceLastOrder;

            // Generate recommendation score
            product.recommendationScore = calculateRecommendationScore(product);
        });

        return productMap;
    };

    const calculateRecommendationScore = (product) => {
        // Factors: frequency, recency, spending, regularity
        const frequencyScore = Math.min(product.frequency * 10, 100); // Max 100 for frequency
        const recencyScore = Math.max(0, 100 - (product.daysSinceLastOrder * 2)); // Decreases over time
        const spendingScore = Math.min(product.totalSpent / 10, 100); // Spending influence
        const regularityScore = product.avgDaysBetweenOrders > 0 ?
            Math.max(0, 100 - Math.abs(product.avgDaysBetweenOrders - 30)) : 0; // Prefer ~30 day cycles

        return (frequencyScore * 0.4 + recencyScore * 0.3 + spendingScore * 0.2 + regularityScore * 0.1);
    };

    const generateRecommendations = (productMap, orders) => {
        const recommendations = Array.from(productMap.values())
            .filter(product => product.frequency >= 2) // Only products ordered more than once
            .map(product => ({
                ...product,
                isRecommended: product.recommendationScore > 50,
                urgency: getUrgency(product),
                nextOrderPrediction: predictNextOrder(product)
            }));

        return recommendations;
    };

    const getUrgency = (product) => {
        if (product.avgDaysBetweenOrders === 0) return 'low';

        const expectedNextOrderDays = product.avgDaysBetweenOrders;
        const daysSinceLastOrder = product.daysSinceLastOrder;

        if (daysSinceLastOrder >= expectedNextOrderDays * 1.2) return 'high';
        if (daysSinceLastOrder >= expectedNextOrderDays * 0.8) return 'medium';
        return 'low';
    };

    const predictNextOrder = (product) => {
        if (product.avgDaysBetweenOrders === 0) return null;

        const predictedDate = new Date(product.lastOrderDate);
        predictedDate.setDate(predictedDate.getDate() + Math.round(product.avgDaysBetweenOrders));

        return predictedDate;
    };

    const calculateStats = (recommendations, orders) => {
        const stats = {
            totalUniqueProducts: recommendations.length,
            frequentlyOrdered: recommendations.filter(r => r.frequency >= 3).length,
            totalReorders: recommendations.reduce((sum, r) => sum + (r.frequency - 1), 0),
            avgDaysBetweenOrders: recommendations.length > 0 ?
                recommendations.reduce((sum, r) => sum + r.avgDaysBetweenOrders, 0) / recommendations.length : 0
        };
        setStats(stats);
    };

    const extractCategories = (recommendations) => {
        const uniqueCategories = [...new Set(recommendations.map(r => r.category))];
        setCategories(uniqueCategories);
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    const getUrgencyIcon = (urgency) => {
        switch (urgency) {
            case 'high': return <Zap className="h-4 w-4" />;
            case 'medium': return <Clock className="h-4 w-4" />;
            default: return <CheckCircle className="h-4 w-4" />;
        }
    };

    const sortedRecommendations = [...recommendations]
        .filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'frequency':
                    return b.frequency - a.frequency;
                case 'recency':
                    return a.daysSinceLastOrder - b.daysSinceLastOrder;
                case 'total_spent':
                    return b.totalSpent - a.totalSpent;
                case 'recommendation':
                    return b.recommendationScore - a.recommendationScore;
                default:
                    return b.recommendationScore - a.recommendationScore;
            }
        });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <TrendingUp className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommendations</h2>
                    <p className="text-gray-600 mb-6">Please log in to view your personalized recommendations</p>
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
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Smart Recommendations</h1>
                                <p className="text-sm text-gray-600">Products you frequently order</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>Welcome, {user?.first_name || user?.username || user?.email}</span>
                            </div>
                            <button
                                onClick={loadRecommendations}
                                disabled={isLoading}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Package className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Unique Products</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalUniqueProducts}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Star className="h-8 w-8 text-amber-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Frequent Items</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.frequentlyOrdered}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <RefreshCw className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Reorders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalReorders}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Days Between</p>
                                <p className="text-2xl font-bold text-gray-900">{Math.round(stats.avgDaysBetweenOrders)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search recommendations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <BarChart3 className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="recommendation">By Recommendation</option>
                                    <option value="frequency">By Frequency</option>
                                    <option value="recency">By Recency</option>
                                    <option value="total_spent">By Total Spent</option>
                                </select>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {sortedRecommendations.length} recommendations found
                        </div>
                    </div>
                </div>

                {/* Recommendations Grid */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Analyzing your order patterns...</p>
                            </div>
                        </div>
                    ) : sortedRecommendations.length === 0 ? (
                        <div className="text-center py-20">
                            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
                            <p className="text-gray-600 mb-4">
                                We need more order history to generate personalized recommendations.
                                <br />
                                Order the same products multiple times to see them here!
                            </p>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {sortedRecommendations.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(item.urgency)}`}>
                                                {getUrgencyIcon(item.urgency)}
                                                <span className="ml-1 capitalize">{item.urgency}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Times Ordered:</span>
                                            <span className="font-semibold text-gray-900">{item.frequency}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Total Spent:</span>
                                            <span className="font-semibold text-green-600">${item.totalSpent.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Avg Price:</span>
                                            <span className="font-semibold text-gray-900">${item.avgPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Last Ordered:</span>
                                            <span className="text-sm text-gray-900">
                                                {Math.round(item.daysSinceLastOrder)} days ago
                                            </span>
                                        </div>
                                        {item.nextOrderPrediction && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Next Order:</span>
                                                <span className="text-sm text-amber-600">
                                                    {item.nextOrderPrediction.toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-gray-500">Recommendation Score</span>
                                            <span className="text-xs text-gray-700">{Math.round(item.recommendationScore)}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(item.recommendationScore, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium flex items-center justify-center">
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add to Cart
                                        </button>
                                        <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            <Eye className="h-4 w-4 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerRecommendationsPage;