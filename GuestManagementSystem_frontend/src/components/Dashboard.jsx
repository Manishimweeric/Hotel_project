import React, { useState, useEffect } from 'react';
import {
    Home,
    Users,
    Bed,
    ShoppingCart,
    Package,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Star,
    Crown,
    Building,
    UserCheck,
    MapPin,
    Phone,
    Mail,
    Eye,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    PieChart,
    LineChart
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { userService, customerService, orderService, productService, roomService, reservationService, categoryService } from '../api';

const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Data states
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);

    // Stats states
    const [stats, setStats] = useState({
        customers: { total: 0, active: 0, inactive: 0, growth: 0 },
        orders: { total: 0, pending: 0, confirmed: 0, revenue: 0, growth: 0 },
        products: { total: 0, active: 0, lowStock: 0, categories: 0 },
        rooms: { total: 0, available: 0, occupied: 0, occupancyRate: 0 },
        reservations: { total: 0, pending: 0, confirmed: 0, checkedIn: 0, revenue: 0 },
        users: { total: 0, admins: 0, staff: 0, active: 0 }
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load all data in parallel
            const [
                customersResponse,
                ordersResponse,
                productsResponse,
                roomsResponse,
                reservationsResponse,
                categoriesResponse,
                usersResponse
            ] = await Promise.all([
                customerService.getCustomers(),
                orderService.getAllOrders(),
                productService.getProducts(),
                roomService.getRooms(),
                reservationService.getReservations(),
                categoryService.getCategories(),
                userService.getUsers()
            ]);

            // Set data
            const customersData = customersResponse.data || customersResponse.results || customersResponse || [];
            const ordersData = ordersResponse.data || ordersResponse.results || ordersResponse || [];
            const productsData = productsResponse.data || productsResponse.results || productsResponse || [];
            const roomsData = roomsResponse.data || roomsResponse.results || roomsResponse || [];
            const reservationsData = reservationsResponse.data || reservationsResponse.results || reservationsResponse || [];
            const categoriesData = categoriesResponse.data || categoriesResponse.results || categoriesResponse || [];
            const usersData = usersResponse.data || usersResponse.results || usersResponse || [];

            setCustomers(customersData);
            setOrders(ordersData);
            setProducts(productsData);
            setRooms(roomsData);
            setReservations(reservationsData);
            setCategories(categoriesData);
            setUsers(usersData);

            // Calculate stats
            calculateStats(customersData, ordersData, productsData, roomsData, reservationsData, usersData);
        } catch (err) {
            setError('Failed to load dashboard data');
            toast.error('Failed to load dashboard data. Please try again.');
            console.error('Error loading dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (customers, orders, products, rooms, reservations, users) => {
        // Customer stats
        const activeCustomers = customers.filter(c => c.status === 'A' || c.status === 'active').length;
        const inactiveCustomers = customers.filter(c => c.status === 'I' || c.status === 'inactive').length;

        // Order stats
        const pendingOrders = orders.filter(o => o.status === 'P' || o.status === 'pending').length;
        const confirmedOrders = orders.filter(o => o.status === 'C' || o.status === 'confirmed').length;
        const orderRevenue = orders
            .filter(o => ['D', 'C', 'delivered', 'confirmed'].includes(o.status))
            .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

        // Product stats
        const activeProducts = products.filter(p => p.is_active).length;
        const lowStockProducts = products.filter(p => p.quantity <= 10).length;

        // Room stats
        const availableRooms = rooms.filter(r => !r.reserved && r.is_active).length;
        const occupiedRooms = rooms.filter(r => r.reserved).length;
        const occupancyRate = rooms.length > 0 ? ((occupiedRooms / rooms.length) * 100).toFixed(1) : 0;

        // Reservation stats
        const pendingReservations = reservations.filter(r => r.status === 'pending').length;
        const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
        const checkedInReservations = reservations.filter(r => r.status === 'checked_in').length;
        const reservationRevenue = reservations
            .filter(r => ['checked_out', 'confirmed', 'checked_in'].includes(r.status))
            .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);

        // User stats
        const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
        const adminUsers = users.filter(u => u.role === 'ADMIN').length;
        const staffUsers = users.filter(u => u.role === 'STAFF').length;

        setStats({
            customers: {
                total: customers.length,
                active: activeCustomers,
                inactive: inactiveCustomers,
                growth: 12.5 // This would be calculated based on previous period
            },
            orders: {
                total: orders.length,
                pending: pendingOrders,
                confirmed: confirmedOrders,
                revenue: orderRevenue,
                growth: 8.2
            },
            products: {
                total: products.length,
                active: activeProducts,
                lowStock: lowStockProducts,
                categories: categories.length
            },
            rooms: {
                total: rooms.length,
                available: availableRooms,
                occupied: occupiedRooms,
                occupancyRate: parseFloat(occupancyRate)
            },
            reservations: {
                total: reservations.length,
                pending: pendingReservations,
                confirmed: confirmedReservations,
                checkedIn: checkedInReservations,
                revenue: reservationRevenue
            },
            users: {
                total: users.length,
                admins: adminUsers,
                staff: staffUsers,
                active: activeUsers
            }
        });
    };

    const refreshDashboard = async () => {
        setIsRefreshing(true);
        await loadDashboardData();
        setIsRefreshing(false);
    };

    const getRecentActivity = () => {
        const activities = [];

        // Recent customers
        const recentCustomers = customers
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 3);

        recentCustomers.forEach(customer => {
            activities.push({
                type: 'customer',
                message: `New customer registered: ${customer.first_name} ${customer.last_name}`,
                time: new Date(customer.created_at || Date.now()),
                icon: Users,
                color: 'text-blue-600'
            });
        });

        // Recent orders
        const recentOrders = orders
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 3);

        recentOrders.forEach(order => {
            activities.push({
                type: 'order',
                message: `New order #${order.order_number} - $${order.total_amount}`,
                time: new Date(order.created_at || Date.now()),
                icon: ShoppingCart,
                color: 'text-green-600'
            });
        });

        // Recent reservations
        const recentReservations = reservations
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 3);

        recentReservations.forEach(reservation => {
            activities.push({
                type: 'reservation',
                message: `New reservation for Room ${reservation.room_code || reservation.room?.room_code}`,
                time: new Date(reservation.created_at || Date.now()),
                icon: Bed,
                color: 'text-purple-600'
            });
        });

        return activities
            .sort((a, b) => b.time - a.time)
            .slice(0, 8);
    };

    const getTopProducts = () => {
        return products
            .filter(p => p.is_active)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    };

    const getRoomStatus = () => {
        const roomsByCategory = {};
        rooms.forEach(room => {
            const category = room.categories || 'General';
            if (!roomsByCategory[category]) {
                roomsByCategory[category] = { total: 0, available: 0, occupied: 0 };
            }
            roomsByCategory[category].total++;
            if (room.reserved) {
                roomsByCategory[category].occupied++;
            } else if (room.is_active) {
                roomsByCategory[category].available++;
            }
        });
        return roomsByCategory;
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = 'http://localhost:8000/api/';
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        return `${baseUrl}${cleanPath}`;
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadDashboardData}
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading dashboard data...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Main Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Customers Card */}
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.customers.total}</p>
                                        <div className="flex items-center mt-2">
                                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                            <span className="text-sm text-green-600">{stats.customers.growth}% growth</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <Users className="h-8 w-8 text-blue-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between text-sm">
                                    <span className="text-green-600">Active: {stats.customers.active}</span>
                                    <span className="text-red-600">Inactive: {stats.customers.inactive}</span>
                                </div>
                            </div>

                            {/* Orders Card */}
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.orders.total}</p>
                                        <div className="flex items-center mt-2">
                                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                            <span className="text-sm text-green-600">{stats.orders.growth}% growth</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <ShoppingCart className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between text-sm">
                                    <span className="text-yellow-600">Pending: {stats.orders.pending}</span>
                                    <span className="text-blue-600">Confirmed: {stats.orders.confirmed}</span>
                                </div>
                            </div>

                            {/* Revenue Card */}
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                        <p className="text-3xl font-bold text-gray-900">${(stats.orders.revenue + stats.reservations.revenue).toFixed(2)}</p>
                                        <div className="flex items-center mt-2">
                                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                            <span className="text-sm text-green-600">15.3% growth</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-amber-100 rounded-full">
                                        <DollarSign className="h-8 w-8 text-amber-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between text-sm">
                                    <span className="text-green-600">Orders: ${stats.orders.revenue.toFixed(2)}</span>
                                    <span className="text-purple-600">Rooms: ${stats.reservations.revenue.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Room Occupancy Card */}
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Room Occupancy</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.rooms.occupancyRate}%</p>
                                        <div className="flex items-center mt-2">
                                            <Activity className="h-4 w-4 text-purple-500 mr-1" />
                                            <span className="text-sm text-purple-600">{stats.rooms.occupied}/{stats.rooms.total} occupied</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-full">
                                        <Bed className="h-8 w-8 text-purple-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between text-sm">
                                    <span className="text-green-600">Available: {stats.rooms.available}</span>
                                    <span className="text-purple-600">Occupied: {stats.rooms.occupied}</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Products Stats */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Products Overview</h3>
                                    <Package className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Products</span>
                                        <span className="text-lg font-semibold text-gray-900">{stats.products.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Active Products</span>
                                        <span className="text-lg font-semibold text-green-600">{stats.products.active}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Low Stock</span>
                                        <span className="text-lg font-semibold text-red-600">{stats.products.lowStock}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Categories</span>
                                        <span className="text-lg font-semibold text-blue-600">{stats.products.categories}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Reservations Stats */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Reservations</h3>
                                    <Calendar className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Reservations</span>
                                        <span className="text-lg font-semibold text-gray-900">{stats.reservations.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Pending</span>
                                        <span className="text-lg font-semibold text-yellow-600">{stats.reservations.pending}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Confirmed</span>
                                        <span className="text-lg font-semibold text-blue-600">{stats.reservations.confirmed}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Checked In</span>
                                        <span className="text-lg font-semibold text-green-600">{stats.reservations.checkedIn}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Users Stats */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">System Users</h3>
                                    <UserCheck className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Users</span>
                                        <span className="text-lg font-semibold text-gray-900">{stats.users.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Active Users</span>
                                        <span className="text-lg font-semibold text-green-600">{stats.users.active}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Administrators</span>
                                        <span className="text-lg font-semibold text-purple-600">{stats.users.admins}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Staff Members</span>
                                        <span className="text-lg font-semibold text-blue-600">{stats.users.staff}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts and Analytics Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Room Status Chart */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">Room Status by Category</h3>
                                    <PieChart className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(getRoomStatus()).map(([category, data]) => (
                                        <div key={category} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">{category}</span>
                                                <span className="text-sm text-gray-500">{data.total} rooms</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full relative"
                                                    style={{ width: `${data.total > 0 ? (data.available / data.total) * 100 : 0}%` }}
                                                >
                                                    {data.occupied > 0 && (
                                                        <div
                                                            className="bg-red-600 h-2 rounded-r-full absolute right-0 top-0"
                                                            style={{ width: `${(data.occupied / data.total) * 100}%` }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Available: {data.available}</span>
                                                <span>Occupied: {data.occupied}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">Top Products (By Stock)</h3>
                                    <BarChart3 className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="space-y-4">
                                    {getTopProducts().map((product) => (
                                        <div key={product.id} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8">
                                                    {product.image ? (
                                                        <img
                                                            className="h-8 w-8 rounded object-cover"
                                                            src={getImageUrl(product.image.replace(/^https?:\/\/[^/]+/, ''))}
                                                            alt={product.name}
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded bg-amber-100 flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-amber-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                    <p className="text-sm text-gray-500">${product.price}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-semibold text-gray-900">{product.quantity}</span>
                                                <span className="text-xs text-gray-500 block">in stock</span>
                                            </div>
                                        </div>
                                    ))}
                                    {getTopProducts().length === 0 && (
                                        <div className="text-center py-4">
                                            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">No products available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                                    <Activity className="h-6 w-6 text-gray-400" />
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {getRecentActivity().map((activity, index) => {
                                        const IconComponent = activity.icon;
                                        return (
                                            <div key={index} className="flex items-start">
                                                <div className={`flex-shrink-0 p-2 rounded-full bg-gray-100`}>
                                                    <IconComponent className={`h-4 w-4 ${activity.color}`} />
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <p className="text-sm text-gray-900">{activity.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {activity.time.toLocaleDateString()} at {activity.time.toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {getRecentActivity().length === 0 && (
                                        <div className="text-center py-8">
                                            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">No recent activity</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;