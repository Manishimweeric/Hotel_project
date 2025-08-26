import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
    Users,
    BarChart2,
    Menu,
    X,
    Bell,
    Search,
    Settings,
    LogOut,
    User,
    Waves, Wifi, Car,
    ChevronDown,
    Home,
    ChevronRight,
    Zap,
    ChevronUp,
    Calendar,
    ShoppingBag,
    Package,
    TrendingUp,
    Brain,
    FileText,
    Activity,
    Shield,
    Heart,
    Stethoscope,
    Grid3X3,
    Layers,
    Command,
    Sparkles,
    UserCheck,
    Clock,
    History,
    Truck,
    Star,
    PieChart,
    Hotel,
    Bed,
    Coffee,
    MessageSquare,
    CreditCard,
    MapPin,
    Phone,
    Mail
} from 'lucide-react';

const EssenciaHotelDashboard = ({
    activePage,
    externalPages = [],
    onPageChange
}) => {
    const [activeMenuItem, setActiveMenuItem] = useState(activePage || '/dashboard/overview');

    const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [loading, setLoading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Refs for click outside detection

    const headerProfileDropdownRef = useRef(null);
    const menuDropdownRefs = useRef({});

    const navigate = useNavigate();

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getUserData = () => {
        try {
            const storedUserData = sessionStorage.getItem('user_data');
            const authToken = sessionStorage.getItem('access_token');

            if (storedUserData && authToken) {
                const userData = JSON.parse(storedUserData);
                return {
                    first_name: userData.user?.first_name || userData.first_name || 'Hotel',
                    last_name: userData.user?.last_name || userData.last_name || 'Manager',
                    email: userData.user?.email || userData.email || 'manager@essencia.com',
                    role: userData.user_type === 'staff' ? 'Staff' : 'Customer',
                    user_type: userData.user_type || 'customer'
                };
            }

            return {
                first_name: 'Demo',
                last_name: 'User',
                email: 'demo@essencia.com',
                role: 'Customer',
                user_type: 'customer'
            };
        } catch (error) {
            console.error('Error getting user data:', error);
            return {
                first_name: 'Demo',
                last_name: 'User',
                email: 'demo@essencia.com',
                role: 'Customer',
                user_type: 'customer'
            };
        }
    };

    const userdata = getUserData();

    const coreMenuItems = [
        {
            name: 'Dashboard',
            icon: <Grid3X3 className="w-5 h-5" />,
            path: '/dashboard/Admin-dashboard',
            view: 'overview',
            description: 'Main Dashboard',
            roles: ['staff', 'customer'],
        },


        {
            name: 'Customers',
            icon: <Users className="w-5 h-5" />,
            path: '/dashboard/customers',
            view: 'customers',
            description: 'Customer Management',
            roles: ['staff'],
        },
        {
            name: 'User Management',
            icon: <Users className="w-5 h-5" />,
            path: '/dashboard/users',
            view: 'customers',
            description: 'User Management',
            roles: ['staff'],
        },

        {
            name: 'Rooms',
            icon: <Bed className="w-5 h-5" />,
            path: '/dashboard/rooms',
            view: 'rooms',
            description: 'Room Management',
            roles: ['staff', 'customer'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'Available Rooms',
                    icon: <Bed className="w-4 h-4" />,
                    path: '/dashboard/available-rooms',
                    view: 'rooms-available',
                    description: 'Browse Rooms',
                    roles: ['staff', 'customer'],
                },
                {
                    name: 'Room Management',
                    icon: <Settings className="w-4 h-4" />,
                    path: '/dashboard/rooms',
                    view: 'rooms-manage',
                    description: 'Manage Rooms',
                    roles: ['staff'],
                }
            ]
        },
        {
            name: 'Categories',
            icon: <Layers className="w-5 h-5" />,
            path: '/dashboard/categories',
            view: 'categories',
            description: 'Product Categories',
            roles: ['staff'],
        },
        {
            name: 'promotion',
            icon: <MessageSquare className="w-5 h-5" />,
            path: '/dashboard/promotionManagement',
            view: 'chat',
            description: 'Promotion',
            roles: ['staff', 'customer'],
        },
        {
            name: 'Products',
            icon: <Package className="w-5 h-5" />,
            path: '/dashboard/products',
            view: 'products',
            description: 'Hotel Products',
            roles: ['staff', 'customer'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'Browse Products',
                    icon: <Package className="w-4 h-4" />,
                    path: '/dashboard/products/products',
                    view: 'products-browse',
                    description: 'View Products',
                    roles: ['staff', 'customer'],
                },
                {
                    name: 'My Cart',
                    icon: <ShoppingBag className="w-4 h-4" />,
                    path: '/dashboard/cart',
                    view: 'cart',
                    description: 'Shopping Cart',
                    roles: ['customer'],
                },
                {
                    name: 'Product Management',
                    icon: <Settings className="w-4 h-4" />,
                    path: '/dashboard/products',
                    view: 'products-manage',
                    description: 'Manage Products',
                    roles: ['staff'],
                },
                {
                    name: 'Product Report',
                    icon: <Settings className="w-4 h-4" />,
                    path: '/dashboard/productreports',
                    view: 'products-manage',
                    description: 'Products Reports',
                    roles: ['staff'],
                }

            ]
        },
        {
            name: 'Orders',
            icon: <ShoppingBag className="w-5 h-5" />,
            path: '/dashboard/orders',
            view: 'orders',
            description: 'Order Management',
            roles: ['staff', 'customer'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'All Orders',
                    icon: <FileText className="w-4 h-4" />,
                    path: '/dashboard/orderManagement',
                    view: 'orders-all',
                    description: 'All Orders',
                    roles: ['staff'],
                },
                // {
                //     name: 'Order Reports',
                //     icon: <PieChart className="w-4 h-4" />,
                //     path: '/dashboard/orders/reports',
                //     view: 'orders-reports',
                //     description: 'Order Analytics',
                //     roles: ['staff'],
                // }
            ]
        },

        {
            name: 'Room Reservation',
            icon: <MessageSquare className="w-5 h-5" />,
            path: '/dashboard/reservationManagement',
            view: 'chat',
            description: 'Room Reservation',
            roles: ['staff', 'customer'],
        },

        {
            name: 'Feedback',
            icon: <Star className="w-5 h-5" />,
            path: '/dashboard/feedbackManagement',
            view: 'feedback',
            description: 'Customer Feedback',
            roles: ['staff'],
        },
        {
            name: 'Chat Support',
            icon: <BarChart2 className="w-5 h-5" />,
            path: '/dashboard/adminChatDashboard',
            view: 'reports',
            description: 'Chart & Messages',
            roles: ['staff'],
        }
    ];

    const externalMenuItems = externalPages.map(page => ({
        name: page.name,
        icon: page.icon ? React.createElement(page.icon, { className: "w-5 h-5" }) : <Activity className="w-5 h-5" />,
        path: `/dashboard/${page.id || page.name.toLowerCase().replace(/\s+/g, '-')}`,
        description: page.description || `${page.name} Module`,
        badge: 'NEW',
        roles: ['admin', 'manager', 'staff'],
        isExternal: true,
        component: page.component
    }));

    const allMenuItems = [...coreMenuItems, ...externalMenuItems];

    const getFilteredMenuItems = () => {
        return allMenuItems
            .filter(item => {
                if (item.roles && !item.roles.includes(userdata.user_type)) {
                    return false;
                }

                if (item.hasSubItems && item.subItems) {
                    item.subItems = item.subItems.filter(subItem =>
                        subItem.roles.includes(userdata.user_type)
                    );
                    return item.subItems.length > 0;
                }

                return true;
            });
    };

    const menuItems = getFilteredMenuItems();

    // Click outside detection
    useEffect(() => {
        const handleClickOutside = (event) => {


            if (headerProfileDropdownRef.current && !headerProfileDropdownRef.current.contains(event.target)) {
                setHeaderDropdownOpen(false);
            }

            Object.keys(expandedMenus).forEach(menuPath => {
                if (expandedMenus[menuPath] && menuDropdownRefs.current[menuPath]) {
                    if (!menuDropdownRefs.current[menuPath].contains(event.target)) {
                        setExpandedMenus(prev => ({
                            ...prev,
                            [menuPath]: false
                        }));
                    }
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expandedMenus]);

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {

                setHeaderDropdownOpen(false);
                setExpandedMenus({});
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');

        setHeaderDropdownOpen(false);
        navigate('/login', { replace: true });
    };

    const handleMenuClick = (path, hasSubItems = false, isExternal = false) => {
        if (hasSubItems) {
            setExpandedMenus(prev => ({
                ...prev,
                [path]: !prev[path]
            }));
        } else {
            setActiveMenuItem(path);
            setMobileMenuOpen(false);
            setSidebarOpen(true);
            setExpandedMenus({});

            if (onPageChange) {
                const pageId = path.split('/').pop();
                onPageChange(pageId);
            }

            if (!isExternal) {
                navigate(path);
            }
        }
    };

    const handleProfileAction = (action) => {

        setHeaderDropdownOpen(false);

        switch (action) {
            case 'profile':
                setActiveMenuItem('/dashboard/profile');
                navigate('/dashboard/profile');
                break;
            case 'settings':
                setActiveMenuItem('/dashboard/settings');
                navigate('/dashboard/settings');
                break;
            case 'logout':
                handleLogout();
                break;
            default:
                break;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900 flex items-center justify-center relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
                </div>

                <div className="text-center space-y-8 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 border-8 border-blue-200/30 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-32 h-32 border-8 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
                        <div className="absolute top-2 left-2 w-28 h-28 border-8 border-transparent border-t-teal-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <Hotel className="w-12 h-12 text-amber-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-4">
                            <Waves className="w-10 h-10 text-teal-400 animate-bounce" />
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-blue-300 to-teal-400 bg-clip-text text-transparent">
                                    ESSENCIA
                                </h1>
                                <p className="text-2xl font-light text-blue-200 tracking-wider">KIVU HOTEL</p>
                            </div>
                            <Waves className="w-10 h-10 text-teal-400 animate-bounce delay-200" />
                        </div>
                        <p className="text-blue-300/80 text-lg">Loading your luxury hospitality experience...</p>
                        <div className="flex justify-center space-x-6 text-blue-300/60">
                            <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">Lake Kivu, Rwanda</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-amber-400" />
                                <span className="text-sm">5-Star Experience</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
            {/* Enhanced Sidebar */}
            <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-slate-900 via-blue-900 to-teal-900 text-white transition-all duration-300 flex flex-col shadow-2xl relative overflow-hidden`}>
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-500 to-transparent rounded-full blur-3xl"></div>
                </div>

                {/* Sidebar Header */}
                <div className="p-6 border-b border-white/10 relative z-10">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white/20">
                            <Hotel className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                        {sidebarOpen && (
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-100 bg-clip-text text-transparent">
                                    ESSENCIA
                                </h1>
                                <p className="text-sm text-blue-300 font-medium tracking-wide">KIVU HOTEL</p>
                                <div className="flex items-center space-x-2 text-xs text-blue-200/80">
                                    <MapPin className="w-3 h-3" />
                                    <span>Lake Kivu, Rwanda</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Time and Weather Widget */}
                {sidebarOpen && (
                    <div className="px-6 py-4 border-b border-white/10 relative z-10">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-sm text-blue-200">
                                        {currentTime.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-semibold text-amber-300">24°C</p>
                                    <p className="text-xs text-blue-200">Sunny</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sidebar Toggle */}
                <div className="px-6 py-4 relative z-10">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-center p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 shadow-lg backdrop-blur-sm group"
                    >
                        {sidebarOpen ? (
                            <ChevronLeft className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors" />
                        ) : (
                            <Menu className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors" />
                        )}
                    </button>
                </div>

                {/* Enhanced Sidebar Menu */}
                <div className="flex-1 overflow-y-auto px-4 pb-6 relative z-10">
                    <nav className="space-y-2">
                        {menuItems.map((item, index) => (
                            <div key={`${item.path}-${index}`} className="relative">
                                <button
                                    onClick={() => handleMenuClick(item.path, item.hasSubItems, item.isExternal)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group relative overflow-hidden ${activeMenuItem === item.path
                                        ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-2xl scale-105 ring-2 ring-amber-400/50'
                                        : 'text-blue-200 hover:text-white hover:bg-white/10 hover:scale-102 hover:shadow-lg'
                                        }`}
                                    title={!sidebarOpen ? item.name : ''}
                                >
                                    {/* Animated background gradient */}
                                    {activeMenuItem === item.path && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-amber-600/30 rounded-xl blur-xl animate-pulse"></div>
                                    )}

                                    <div className={`relative z-10 transition-all duration-300 ${activeMenuItem === item.path
                                        ? 'text-white drop-shadow-lg'
                                        : 'text-blue-300 group-hover:text-white group-hover:scale-110'
                                        }`}>
                                        {item.icon}
                                    </div>
                                    {sidebarOpen && (
                                        <>
                                            <span className="relative z-10 font-medium text-sm flex-1">{item.name}</span>
                                            {item.badge && (
                                                <span className="relative z-10 px-2 py-0.5 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold shadow-lg animate-pulse">
                                                    {item.badge}
                                                </span>
                                            )}
                                            {item.hasSubItems && (
                                                <ChevronDown className={`relative z-10 w-4 h-4 ml-auto transition-transform duration-300 ${expandedMenus[item.path] ? 'rotate-180' : ''
                                                    }`} />
                                            )}
                                        </>
                                    )}
                                </button>

                                {/* Enhanced Sub-items */}
                                {sidebarOpen && item.hasSubItems && expandedMenus[item.path] && (
                                    <div className="ml-8 mt-2 space-y-1 border-l-2 border-gradient-to-b from-amber-400/50 to-blue-400/50 pl-4">
                                        {item.subItems?.map((subItem, subIndex) => (
                                            <button
                                                key={`sub-${subItem.path}-${subIndex}`}
                                                onClick={() => handleMenuClick(subItem.path, false, subItem.isExternal)}
                                                className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left transition-all duration-300 group ${activeMenuItem === subItem.path
                                                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg scale-105'
                                                    : 'text-blue-300 hover:text-white hover:bg-white/10 hover:scale-102'
                                                    }`}
                                            >
                                                <div className={`transition-all duration-300 ${activeMenuItem === subItem.path
                                                    ? 'text-white'
                                                    : 'text-blue-400 group-hover:text-white group-hover:scale-110'
                                                    }`}>
                                                    {subItem.icon}
                                                </div>
                                                <span className="text-sm font-medium">{subItem.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>


            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Enhanced Top Header Bar */}
                <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200/50 px-8 py-6 sticky top-0 z-40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 rounded-xl transition-all duration-200"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                                    Essencia Kivu Hotel
                                </h1>
                                <p className="text-slate-600 flex items-center space-x-2">
                                    <Waves className="w-4 h-4 text-teal-500" />
                                    <span>Experience luxury by Lake Kivu</span>
                                    <div className="flex items-center space-x-1 ml-4">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} className="w-3 h-3 text-amber-400 fill-current" />
                                        ))}
                                    </div>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Enhanced Search Bar */}
                            <div className="relative hidden md:block">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search hotels, rooms, guests..."
                                    className="pl-12 pr-6 py-3 w-80 border border-slate-200 rounded-2xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                                />
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="flex items-center space-x-2">
                                <button className="p-3 text-slate-500 hover:text-white hover:bg-teal-500 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md">
                                    <Settings className="w-6 h-6" />
                                </button>

                                {/* Notifications */}
                                <button className="relative p-3 text-slate-500 hover:text-white hover:bg-blue-500 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md">
                                    <Bell className="w-6 h-6" />
                                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                </button>

                                {/* Header User Profile */}
                                <div className="relative ml-4" ref={headerProfileDropdownRef}>
                                    <button
                                        onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                                        className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-teal-50 hover:from-blue-100 hover:to-teal-100 transition-all duration-300 group shadow-sm hover:shadow-md border border-slate-200/50"
                                    >
                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/50">
                                            <span className="text-white text-sm font-bold">
                                                {userdata.first_name?.[0]?.toUpperCase()}{userdata.last_name?.[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="hidden lg:flex flex-col text-left">
                                            <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                                                {userdata.first_name} {userdata.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500 group-hover:text-slate-600">{userdata.role}</p>
                                        </div>
                                        <div className="hidden lg:flex items-center">
                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                                            <span className="text-xs text-green-600 font-medium">Online</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-all duration-300 group-hover:text-slate-600 ${headerDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {headerDropdownOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 backdrop-blur-sm">
                                            <div className="px-4 py-3 border-b border-slate-100">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                                                        <span className="text-white text-sm font-bold">
                                                            {userdata.first_name?.[0]?.toUpperCase()}{userdata.last_name?.[0]?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-900">
                                                            {userdata.first_name} {userdata.last_name}
                                                        </p>
                                                        <p className="text-sm text-slate-500">{userdata.email}</p>
                                                        <div className="flex items-center mt-1">
                                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                                                            <span className="text-xs text-green-600 font-medium">Online</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-2 py-2">
                                                <div className="border-t border-slate-100 mt-2 pt-2">
                                                    <button
                                                        onClick={() => handleProfileAction('logout')}
                                                        className="flex items-center w-full px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                                                    >
                                                        <LogOut className="w-5 h-5 mr-3 group-hover:text-red-700" />
                                                        <div className="flex-1 text-left">
                                                            <p className="font-medium">Sign Out</p>
                                                            <p className="text-xs text-red-500">End your session</p>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="hidden xl:flex items-center space-x-4 ml-4 pl-4 border-l border-slate-200">
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-slate-700">85%</p>
                                        <p className="text-xs text-slate-500">Occupancy</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-green-600">+12%</p>
                                        <p className="text-xs text-slate-500">Revenue</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-blue-600">4.8</p>
                                        <p className="text-xs text-slate-500">Rating</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hotel Amenities Banner */}
                    <div className="mt-4 flex items-center justify-center space-x-8 text-slate-500 text-sm">
                        <div className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
                            <Wifi className="w-4 h-4" />
                            <span>Free WiFi</span>
                        </div>
                        <div className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
                            <Car className="w-4 h-4" />
                            <span>Parking</span>
                        </div>
                        <div className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
                            <Coffee className="w-4 h-4" />
                            <span>Restaurant</span>
                        </div>
                        <div className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
                            <Waves className="w-4 h-4" />
                            <span>Lake View</span>
                        </div>
                        <div className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
                            <Phone className="w-4 h-4" />
                            <span>24/7 Support</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 bg-slate-50 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Enhanced Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
                    <div className="w-80 bg-gradient-to-b from-slate-900 via-blue-900 to-teal-900 text-white h-full overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Hotel className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-amber-100">ESSENCIA</h1>
                                        <p className="text-sm text-blue-300">KIVU HOTEL</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <nav className="p-4 space-y-2">
                            {menuItems.map((item, index) => (
                                <div key={`mobile-${item.path}-${index}`}>
                                    <button
                                        onClick={() => handleMenuClick(item.path, item.hasSubItems, item.isExternal)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${activeMenuItem === item.path
                                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                                            : 'text-blue-200 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {item.icon}
                                        <span className="font-medium flex-1">{item.name}</span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold">
                                                {item.badge}
                                            </span>
                                        )}
                                        {item.hasSubItems && (
                                            <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${expandedMenus[item.path] ? 'rotate-180' : ''
                                                }`} />
                                        )}
                                    </button>

                                    {item.hasSubItems && expandedMenus[item.path] && (
                                        <div className="ml-8 mt-2 space-y-1 border-l-2 border-amber-400/50 pl-4">
                                            {item.subItems?.map((subItem, subIndex) => (
                                                <button
                                                    key={`mobile-sub-${subItem.path}-${subIndex}`}
                                                    onClick={() => handleMenuClick(subItem.path, false, subItem.isExternal)}
                                                    className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left transition-all duration-300 ${activeMenuItem === subItem.path
                                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                                                        : 'text-blue-300 hover:text-white hover:bg-white/10'
                                                        }`}
                                                >
                                                    {subItem.icon}
                                                    <span className="text-sm font-medium">{subItem.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* Mobile User Profile */}
                        <div className="p-4 border-t border-white/10 mt-auto">
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">
                                            {userdata.first_name?.[0]?.toUpperCase()}{userdata.last_name?.[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {userdata.first_name} {userdata.last_name}
                                        </p>
                                        <p className="text-xs text-blue-300">{userdata.role}</p>
                                        <div className="flex items-center mt-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                                            <span className="text-xs text-green-300">Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ChevronLeft component
const ChevronLeft = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

export default EssenciaHotelDashboard;