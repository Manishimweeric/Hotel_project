import React, { useState, useEffect } from 'react';
import {
    Home, Package, Search, Star, Crown, Building, Bed, Users, DollarSign,
    Calendar, ArrowRight, MapPin, Phone, Mail, Wifi, Car, Coffee, Tv,
    Wind, Bath, CheckCircle, Eye, ShoppingCart, Tag, Plus, Sparkles,
    ChevronLeft, ChevronRight, Menu, X, Globe, Clock, Shield, Minus,
    Heart, Filter, Award, Utensils, Camera, Navigation, AlertCircle,
    LogIn, LogOut, User
} from 'lucide-react';
import { productService, categoryService, roomService, cartService, orderService, feedbackService } from '../../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const HotelLandingPage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cart, setCart] = useState({ items: [], total_amount: 0, total_items: 0 });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [featuredRooms, setFeaturedRooms] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categoryChoices, setCategoryChoices] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    // Feedback Form State
    const [feedbackData, setFeedbackData] = useState({
        full_name: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleFeedbackChange = (e) => {
        const { name, value } = e.target;
        setFeedbackData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            await feedbackService.createFeedback(feedbackData);
            setSubmitStatus({ success: true, message: 'Thank you for your feedback!' });
            setFeedbackData({ full_name: '', message: '' });
        } catch (error) {
            console.log(error)
            setSubmitStatus({ success: false, message: 'Failed to submit feedback. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Authentication and Data Fetching
    useEffect(() => {
        checkAuthStatus();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [rooms, products, categories] = await Promise.all([
                    roomService.getRooms(),
                    productService.getProducts(),
                    categoryService.getCategories()
                ]);
                const availableRooms = (rooms.data || rooms).filter(room => !room.reserved && room.is_active);
                setFeaturedRooms(availableRooms);
                setFeaturedProducts(products.data || products);
                setCategoryChoices(categories.data || categories);
                if (isAuthenticated) await fetchCart();
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to load data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [isAuthenticated]);

    const checkAuthStatus = () => {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setIsAuthenticated(true);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
                logout();
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
        setIsAuthenticated(false);
        setUser(null);
        setCart({ items: [], total_amount: 0, total_items: 0 });
        setSuccessMessage('Logged out successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const redirectToLogin = () => {
        localStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = '/login';
    };

    const fetchCart = async () => {
        if (!isAuthenticated || !user?.id) {
            setCart({ items: [], total_amount: 0, total_items: 0 });
            return;
        }
        try {
            const cartData = await cartService.getCart(user.id);
            console.log("cartData:", cartData);
            setCart({
                items: cartData.cart_items,
                total_amount: cartData.total_amount || 0,
                total_items: cartData.total_items || 0

            });
        } catch (error) {
            console.error("Error fetching cart:", error);
            setCart({ items: [], total_amount: 0, total_items: 0 });
        }
    };

    // Hero Slides
    const heroSlides = [
        {
            title: "Welcome to Luxury Comfort",
            subtitle: "Experience unparalleled hospitality in the heart of the city",
            image: "/public/Images/hotel.jpeg"
        },
        {
            title: "Premium Accommodations",
            subtitle: "Discover our range of elegantly appointed rooms and suites",
            image: "/public/Images/hotel.jpeg"
        },
        {
            title: "Exceptional Services",
            subtitle: "From dining to wellness, we cater to your every need",
            image: "/public/Images/hotel.jpeg"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Helper Functions
    const getCategoryConfig = (category) => {
        const found = categoryChoices.find(c => c.value === category);
        return found || { name: 'Standard', gradient: 'from-blue-100 to-blue-200' };
    };

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = 'http://localhost:8000/api/';
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        return `${baseUrl}${cleanPath}`;
    };

    // Cart and Order Functions
    const addToCart = async (product, quantity = 1) => {
        if (!isAuthenticated) {
            setError('Please login to add items to cart');
            setTimeout(() => redirectToLogin(), 2000);
            return;
        }
        if (!user?.id) {
            setError('User information not found. Please login again.');
            logout();
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            await cartService.addToCart({ product_id: product.id, quantity, user_id: user.id });

            toast.success("Item added to cart");
            await fetchCart();
            setSuccessMessage(`${product.name} added to cart!`);
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error("Error adding to cart:", error);
            setError(error.response?.status === 401 ? "Session expired. Please login again." : "Failed to add item to cart. Please try again.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const updateCartItemQuantity = async (itemId, newQuantity) => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }
        if (newQuantity <= 0) {
            await removeFromCart(itemId);
            return;
        }
        try {
            setIsLoading(true);
            await cartService.updateCartItem(itemId, { quantity: newQuantity, user_id: user.id });
            await fetchCart();
        } catch (error) {
            console.error("Error updating cart item:", error);
            setError(error.response?.status === 401 ? "Session expired. Please login again." : "Failed to update item quantity.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromCart = async (itemId) => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }
        try {
            setIsLoading(true);
            await cartService.removeFromCart(itemId);
            await fetchCart();
            setSuccessMessage("Item removed from cart");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error removing from cart:", error);
            setError(error.response?.status === 401 ? "Session expired. Please login again." : "Failed to remove item from cart.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const clearCart = async () => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }
        try {
            setIsLoading(true);
            await cartService.clearCart();
            await fetchCart();
            setSuccessMessage("Cart cleared successfully");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error clearing cart:", error);
            setError(error.response?.status === 401 ? "Session expired. Please login again." : "Failed to clear cart.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const createOrder = async () => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }
        if (cart.items.length === 0) {
            setError("Your cart is empty");
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const order = await orderService.createOrder({ notes: "Order from hotel website", user_id: user.id });
            toast.success(`Order #${order.id} created successfully!`);
            setIsCartOpen(false);
            await fetchCart();
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error("Error creating order:", error);
            setError(error.response?.status === 401 ? "Session expired. Please login again." : "Failed to create order. Please try again.");
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCartClick = () => {
        if (!isAuthenticated) {
            setError('Please login to view your cart');
            setTimeout(() => redirectToLogin(), 2000);
            return;
        }
        setIsCartOpen(true);
    };

    // Alert Component
    const AlertMessage = ({ type, message, onClose }) => (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
            <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">{message}</span>
                <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );

    // Render
    return (
        <div className="min-h-screen bg-white">
            {/* Alert Messages */}
            {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
            {successMessage && <AlertMessage type="success" message={successMessage} onClose={() => setSuccessMessage('')} />}

            {/* Navigation */}
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br rounded-full shadow-2xl mr-2">
                                <img src="/Images/hotel.png" alt="Essencia Kivu Hotel" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">ESSENCIA KIVU HOTEL</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#home" className="text-gray-700 hover:text-amber-600 transition-colors">Home</a>
                            <a href="#rooms" className="text-gray-700 hover:text-amber-600 transition-colors">Rooms</a>
                            {isAuthenticated ? (
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-5 w-5 text-gray-600" />
                                        <span className="text-sm text-gray-700">{user?.first_name || user?.email}</span>
                                    </div>
                                    <a href="/customerRecommendations" className="text-gray-700 hover:text-amber-600 transition-colors">Recommendations</a>
                                    <a href="/customerChat" className="text-gray-700 hover:text-amber-600 transition-colors">Chart</a>
                                    <a href="/CustomerOrders" className="text-gray-700 hover:text-amber-600 transition-colors">Orders</a>


                                    <a href='/roomsReservation' className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors">
                                        Book Now
                                    </a>


                                    <button onClick={logout} className="flex items-center text-gray-700 hover:text-amber-600 transition-colors">
                                        <LogOut className="h-5 w-5 mr-1" /> Logout
                                    </button>
                                </div>
                            ) : (
                                <button onClick={redirectToLogin} className="flex items-center text-gray-700 hover:text-amber-600 transition-colors">
                                    <LogIn className="h-5 w-5 mr-1" /> Login
                                </button>
                            )}
                            <button onClick={handleCartClick} className="relative p-2 text-gray-700 hover:text-amber-600 transition-colors" disabled={isLoading}>
                                <ShoppingCart className="h-6 w-6" />
                                {isAuthenticated && cart.total_items > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                                        {cart.total_items}
                                    </span>
                                )}
                            </button>

                        </div>
                        <div className="md:hidden flex items-center space-x-2">
                            <button onClick={handleCartClick} className="relative p-2 text-gray-700 hover:text-amber-600 transition-colors" disabled={isLoading}>
                                <ShoppingCart className="h-6 w-6" />
                                {isAuthenticated && cart.total_items > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                                        {cart.total_items}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-amber-600">
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                    {isMenuOpen && (
                        <div className="md:hidden border-t border-gray-200">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                <a href="#home" className="block px-3 py-2 text-gray-700 hover:text-amber-600">Home</a>
                                <a href="#rooms" className="block px-3 py-2 text-gray-700 hover:text-amber-600">Rooms</a>
                                <a href="#services" className="block px-3 py-2 text-gray-700 hover:text-amber-600">Services</a>
                                <a href="#about" className="block px-3 py-2 text-gray-700 hover:text-amber-600">About</a>
                                <a href="#contact" className="block px-3 py-2 text-gray-700 hover:text-amber-600">Contact</a>
                                {isAuthenticated ? (
                                    <div className="px-3 py-2 border-t border-gray-200">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <User className="h-5 w-5 text-gray-600" />
                                            <span className="text-sm text-gray-700">{user?.first_name || user?.email}</span>
                                        </div>
                                        <button onClick={logout} className="flex items-center text-gray-700 hover:text-amber-600">
                                            <LogOut className="h-5 w-5 mr-1" /> Logout
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={redirectToLogin} className="block w-full text-left px-3 py-2 text-gray-700 hover:text-amber-600 border-t border-gray-200">
                                        <LogIn className="h-5 w-5 mr-1 inline" /> Login
                                    </button>
                                )}
                                <button className="w-full text-left bg-amber-600 text-white px-3 py-2 rounded-md hover:bg-amber-700 transition-colors">Book Now</button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" className="relative h-[35vh] overflow-hidden">
                <div className="absolute inset-0 transition-all duration-1000 bg-cover bg-center bg-no-repeat opacity-90" style={{ backgroundImage: "url('/public/Images/hotel1.jpeg')" }}></div>
                <div className="relative z-10 h-full flex items-center justify-center text-center text-white">
                    <div className="max-w-4xl mx-auto px-4">
                        <h1 className="text-5xl md:text-4xl font-bold mb-6 animate-fade-in">{heroSlides[currentSlide].title}</h1>
                        <p className="text-xl md:text-xl mb-8 opacity-90">{heroSlides[currentSlide].subtitle}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => document.getElementById('rooms').scrollIntoView({ behavior: 'smooth' })} className="bg-amber-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors transform hover:scale-105">Book Your Stay</button>
                            <button onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })} className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors">Explore Services</button>
                        </div>
                    </div>
                </div>
                <button onClick={prevSlide} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-amber-300 transition-colors"><ChevronLeft className="h-12 w-12" /></button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-amber-300 transition-colors"><ChevronRight className="h-12 w-12" /></button>
                {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {heroSlides.map((_, index) => (
                        <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full transition-colors ${currentSlide === index ? 'bg-white' : 'bg-white bg-opacity-50'}`}></button>
                    ))}
                </div> */}
            </section>

            {/* Rooms Section */}
            <section id="rooms" className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Rooms & Suites</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">Experience luxury and comfort in our carefully designed accommodations</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {isLoading && featuredRooms.length === 0 ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                                    <div className="h-48 bg-gray-200"></div>
                                    <div className="p-6">
                                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                                        <div className="h-8 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))
                        ) : featuredRooms.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No rooms available at the moment</p>
                            </div>
                        ) : (
                            featuredRooms.map((room) => {
                                const categoryConfig = getCategoryConfig(room.categories);
                                return (
                                    <div key={room.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                                        <div className={`h-48 bg-gradient-to-br flex items-center justify-center relative overflow-hidden`}>
                                            <div className="absolute top-3 left-3">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium`}>{categoryConfig?.name}</span>
                                            </div>
                                            <div className="absolute top-3 right-3">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1" /> Available
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-left">
                                                    <h3 className="text-lg font-semibold text-gray-900">Room {room.room_code}</h3>
                                                    <p className="text-xs text-gray-500">per night</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-amber-600">${room.price_per_night}</p>
                                                    <p className="text-xs text-gray-500">per night</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 mb-4">
                                                <Users className="h-4 w-4 mr-2" /> Up to {room.capacity} guests
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{room.description}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 border-t pt-3">
                                                <div className="flex items-center space-x-3">
                                                    <Wifi className="h-3 w-3" title="Free WiFi" />
                                                    <Tv className="h-3 w-3" title="TV" />
                                                    <Wind className="h-3 w-3" title="AC" />
                                                    <Bath className="h-3 w-3" title="Private Bath" />
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => { setSelectedRoom(room); setShowRoomModal(true); }} className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">
                                                    <Eye className="h-4 w-4 mr-2" /> Details
                                                </button>
                                                <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">Book Now</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Premium Services & Amenities</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">Enhance your stay with our carefully curated selection of services and products</p>
                        {!isAuthenticated && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-lg mx-auto">
                                <p className="text-amber-800 text-sm"><LogIn className="h-4 w-4 inline mr-1" /> Please login to add services to your cart</p>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {isLoading && featuredProducts.length === 0 ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                                    <div className="h-48 bg-gray-200"></div>
                                    <div className="p-6">
                                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                                        <div className="h-8 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))
                        ) : featuredProducts.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No services available at the moment</p>
                            </div>
                        ) : (
                            featuredProducts.map((product) => (
                                <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                                        <img className="h-48 w-72 rounded-lg object-cover" src={getImageUrl(product.image?.replace(/^https?:\/\/[^/]+/, ''))} alt={product.name} onError={(e) => { e.target.src = '/Images/hotel.jpeg'; }} />
                                        <div className="absolute top-3 left-3">
                                            {product.categories && product.categories.map((category, index) => (
                                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <Tag className="h-3 w-3 mr-1" /> {category.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-amber-600">${product.price}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 border-t pt-3">
                                            <span>In Stock: {product.quantity}</span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="h-3 w-3 mr-1" /> Available
                                            </span>
                                        </div>
                                        <div className="flex space-x-3 w-full">
                                            <button onClick={() => { setSelectedProduct(product); setShowProductModal(true); }} className="flex items-center justify-center px-2 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">
                                                <Eye className="h-4 w-4 mr-2" /> View
                                            </button>
                                            <button onClick={() => addToCart(product)} disabled={isLoading || !isAuthenticated} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={!isAuthenticated ? "Please login to add to cart" : ""}>
                                                <ShoppingCart className="h-4 w-4 mr-2" /> {!isAuthenticated ? 'Login to Add' : isLoading ? 'Adding...' : 'Add to Cart'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Why Choose Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Essencia Kivu Hotel?</h2>
                        <p className="text-xl text-gray-600">Experience exceptional hospitality with our premium amenities</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200 transition-colors">
                                <Award className="h-8 w-8 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">5-Star Service</h3>
                            <p className="text-gray-600">Award-winning hospitality and personalized service that exceeds expectations</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                                <MapPin className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Prime Location</h3>
                            <p className="text-gray-600">Located in the heart of the city with easy access to major attractions</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                                <Utensils className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fine Dining</h3>
                            <p className="text-gray-600">World-class cuisine prepared by renowned chefs using finest ingredients</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                                <Shield className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Safety & Security</h3>
                            <p className="text-gray-600">24/7 security and safety protocols ensuring peace of mind for all guests</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Feedback</h2>
                        <p className="text-xl text-gray-600">We value your opinion! Let us know how we can improve.</p>
                    </div>
                    <form onSubmit={handleFeedbackSubmit} className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
                        <div className="mb-6">
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                id="full_name"
                                name="full_name"
                                value={feedbackData.full_name}
                                onChange={handleFeedbackChange}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={feedbackData.message}
                                onChange={handleFeedbackChange}
                                required
                                rows="5"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                placeholder="Your feedback or suggestions"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg hover:bg-amber-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                        {submitStatus && (
                            <div className={`mt-4 p-4 rounded-lg text-center ${submitStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                {submitStatus.message}
                            </div>
                        )}
                    </form>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-16 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
                        <p className="text-xl text-gray-300">We're here to make your stay unforgettable</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Phone className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Call Us</h3>
                            <p className="text-gray-300">+250 788 123 456</p>
                            <p className="text-gray-300">24/7 Customer Service</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                            <p className="text-gray-300">info@essenciakivu.com</p>
                            <p className="text-gray-300">reservations@essenciakivu.com</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Visit Us</h3>
                            <p className="text-gray-300">Lake Kivu Shore</p>
                            <p className="text-gray-300">Gisenyi, Rwanda</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <Home className="h-8 w-8 text-amber-600 mr-3" />
                                <span className="text-xl font-bold">Essencia Kivu Hotel</span>
                            </div>
                            <p className="text-gray-300 mb-4">Experience luxury and comfort by the beautiful Lake Kivu with our premium accommodations and exceptional service.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li><a href="#rooms" className="hover:text-amber-600 transition-colors">Rooms & Suites</a></li>
                                <li><a href="#services" className="hover:text-amber-600 transition-colors">Services</a></li>
                                <li><a href="#about" className="hover:text-amber-600 transition-colors">About Us</a></li>
                                <li><a href="#contact" className="hover:text-amber-600 transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Services</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>Restaurant & Bar</li>
                                <li>Spa & Wellness</li>
                                <li>Conference Rooms</li>
                                <li>Airport Transfer</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
                            <div className="flex space-x-4">
                                <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors">
                                    <Globe className="h-5 w-5" />
                                </button>
                                <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors">
                                    <Camera className="h-5 w-5" />
                                </button>
                                <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors">
                                    <Navigation className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
                        <p>&copy; 2025 Essencia Kivu Hotel. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Cart Sidebar */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-lg font-semibold text-gray-900">Shopping Cart ({cart.total_items})</h2>
                                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                            </div>
                            {!isAuthenticated && (
                                <div className="p-4 bg-amber-50 border-b border-amber-200">
                                    <div className="flex items-center text-amber-800">
                                        <LogIn className="h-5 w-5 mr-2" />
                                        <p className="text-sm">Please login to manage your cart</p>
                                    </div>
                                    <button onClick={redirectToLogin} className="mt-2 w-full bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 transition-colors text-sm">Login Now</button>
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto p-6">
                                {!isAuthenticated ? (
                                    <div className="text-center py-12">
                                        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Please login to view your cart</p>
                                    </div>
                                ) : cart.items.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Your cart is empty</p>
                                        <p className="text-sm text-gray-400 mt-2">Add some services to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.items.map((item) => (
                                            <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                                                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <img className="h-16 w-16 rounded-lg object-cover" src={getImageUrl(item.product?.image?.replace(/^https?:\/\/[^/]+/, ''))} alt={item.product?.name || 'Product'} onError={(e) => { e.target.src = '/Images/hotel.jpeg'; }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</h4>
                                                    <p className="text-sm text-amber-600 font-semibold">${item.product?.price || 0}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} disabled={isLoading} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"><Minus className="h-4 w-4" /></button>
                                                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} disabled={isLoading} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"><Plus className="h-4 w-4" /></button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} disabled={isLoading} className="text-red-500 hover:text-red-700 disabled:opacity-50"><X className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {isAuthenticated && cart.items.length > 0 && (
                                <div className="border-t p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                                        <span className="text-2xl font-bold text-amber-600">${cart.total_amount}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <button onClick={createOrder} disabled={isLoading} className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'Processing...' : 'Place Order'}</button>
                                        <button onClick={clearCart} disabled={isLoading} className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50">Clear Cart</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Room Detail Modal */}
            {showRoomModal && selectedRoom && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <h3 className="text-xl font-semibold text-gray-900">Room {selectedRoom.room_code} Details</h3>
                            <button onClick={() => setShowRoomModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6">
                            <div className={`mb-6 p-6 bg-gradient-to-r ${getCategoryConfig(selectedRoom.categories)?.gradient || 'from-blue-100 to-blue-200'} rounded-lg`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-2xl font-bold text-gray-900 mb-2">Room {selectedRoom.room_code}</h4>
                                        <p className="text-gray-600">{getCategoryConfig(selectedRoom.categories)?.name || 'Standard'} Category</p>
                                        <p className="text-gray-700 mt-2">{selectedRoom.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-amber-600">${selectedRoom.price_per_night}</p>
                                        <p className="text-sm text-gray-500">per night</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <h5 className="font-semibold text-gray-900 mb-2">Room Features</h5>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li className="flex items-center"><Users className="h-4 w-4 mr-2" />Up to {selectedRoom.capacity} guests</li>
                                        <li className="flex items-center"><Wifi className="h-4 w-4 mr-2" />Free WiFi</li>
                                        <li className="flex items-center"><Tv className="h-4 w-4 mr-2" />Cable TV</li>
                                        <li className="flex items-center"><Wind className="h-4 w-4 mr-2" />Air Conditioning</li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-gray-900 mb-2">Amenities</h5>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li className="flex items-center"><Bath className="h-4 w-4 mr-2" />Private Bathroom</li>
                                        <li className="flex items-center"><Coffee className="h-4 w-4 mr-2" />Coffee Maker</li>
                                        <li className="flex items-center"><Car className="h-4 w-4 mr-2" />Parking Available</li>
                                        <li className="flex items-center"><Shield className="h-4 w-4 mr-2" />24/7 Security</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setShowRoomModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
                                <button className="px-6 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700">Book This Room</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {showProductModal && selectedProduct && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <h3 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h3>
                            <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h4>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {selectedProduct.categories?.map((category, index) => (
                                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <Tag className="h-3 w-3 mr-1" /> {category.name}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-gray-700">{selectedProduct.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-amber-600">${selectedProduct.price}</p>
                                        <p className="text-sm text-gray-500">Available: {selectedProduct.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setShowProductModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
                                <button onClick={() => { addToCart(selectedProduct); setShowProductModal(false); }} disabled={isLoading || !isAuthenticated} className="px-6 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed" title={!isAuthenticated ? "Please login to add to cart" : ""}>
                                    {!isAuthenticated ? 'Login Required' : isLoading ? 'Adding...' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelLandingPage;
