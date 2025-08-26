import React, { useState, useEffect } from 'react';
import {
    Home, Search, Star, Crown, Building, Bed, Users, DollarSign,
    Calendar, ArrowRight, MapPin, Phone, Mail, Wifi, Car, Coffee, Tv,
    Wind, Bath, CheckCircle, Eye, Filter, Plus, Minus, X, Menu,
    ChevronLeft, ChevronRight, AlertCircle, LogIn, LogOut, User,
    CalendarDays, Clock, Shield, Award, Heart, BookOpen
} from 'lucide-react';
import { roomService, reservationService } from '../../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RoomsReservationPage = () => {
    // State Management
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [guestCount, setGuestCount] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Reservation Modal State
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [reservationData, setReservationData] = useState({
        check_in: '',
        check_out: '',
        guests: 1,
        notes: ''
    });

    // User Authentication
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Initialize
    useEffect(() => {
        checkAuthStatus();
        fetchRooms();
    }, []);

    useEffect(() => {
        filterRooms();
    }, [rooms, selectedCategory, priceRange, guestCount]);

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
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
        setIsAuthenticated(false);
        setUser(null);
        setSuccessMessage('Logged out successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const redirectToLogin = () => {
        localStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = '/login';
    };

    const fetchRooms = async () => {
        setIsLoading(true);
        try {
            const response = await roomService.getRooms();
            const roomsData = response.data || response;
            const availableRooms = roomsData.filter(room => room.is_active);
            setRooms(availableRooms);

            // Extract unique categories
            const uniqueCategories = [...new Set(availableRooms.map(room => room.categories))].filter(Boolean);
            setCategories(uniqueCategories);

            // Set price range based on available rooms
            if (availableRooms.length > 0) {
                const prices = availableRooms.map(room => parseFloat(room.price_per_night));
                setPriceRange([Math.min(...prices), Math.max(...prices)]);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
            setError("Failed to load rooms. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const filterRooms = () => {
        let filtered = rooms;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(room => room.categories === selectedCategory);
        }

        // Filter by price range
        filtered = filtered.filter(room => {
            const price = parseFloat(room.price_per_night);
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Filter by guest capacity
        filtered = filtered.filter(room => room.capacity >= guestCount);

        setFilteredRooms(filtered);
    };

    const getCategoryConfig = (category) => {
        const configs = {
            'standard': { name: 'Standard', gradient: 'from-blue-100 to-blue-200', color: 'blue' },
            'deluxe': { name: 'Deluxe', gradient: 'from-purple-100 to-purple-200', color: 'purple' },
            'suite': { name: 'Suite', gradient: 'from-amber-100 to-amber-200', color: 'amber' },
            'presidential': { name: 'Presidential', gradient: 'from-red-100 to-red-200', color: 'red' }
        };
        return configs[category] || { name: 'Standard', gradient: 'from-gray-100 to-gray-200', color: 'gray' };
    };

    const handleReservation = (room) => {
        if (!isAuthenticated) {
            setError('Please login to make a reservation');
            setTimeout(() => redirectToLogin(), 2000);
            return;
        }
        setSelectedRoom(room);
        setReservationData(prev => ({ ...prev, guests: guestCount }));
        setShowReservationModal(true);
    };

    const calculateTotal = () => {
        if (!selectedRoom || !reservationData.check_in || !reservationData.check_out) return 0;

        const checkIn = new Date(reservationData.check_in);
        const checkOut = new Date(reservationData.check_out);
        const nights = Math.max(0, (checkOut - checkIn) / (1000 * 60 * 60 * 24));

        return nights * parseFloat(selectedRoom.price_per_night);
    };

    const calculateNights = () => {
        if (!reservationData.check_in || !reservationData.check_out) return 0;

        const checkIn = new Date(reservationData.check_in);
        const checkOut = new Date(reservationData.check_out);
        const nights = Math.max(0, (checkOut - checkIn) / (1000 * 60 * 60 * 24));

        return nights;
    };

    const handleReservationSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated || !user?.id) {
            setError('Please login to make a reservation');
            return;
        }

        if (!reservationData.check_in || !reservationData.check_out) {
            setError('Please select check-in and check-out dates');
            return;
        }

        if (new Date(reservationData.check_in) >= new Date(reservationData.check_out)) {
            setError('Check-out date must be after check-in date');
            return;
        }

        if (reservationData.guests > selectedRoom.capacity) {
            setError(`Maximum guests for this room is ${selectedRoom.capacity}`);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const reservationPayload = {
                room: selectedRoom.id,
                customer: user.id,
                check_in: reservationData.check_in,
                check_out: reservationData.check_out,
                guests: parseInt(reservationData.guests),
                notes: reservationData.notes || ''
            };

            const response = await reservationService.create(reservationPayload);

            toast.success(`Reservation created successfully! Reservation #${response.id}`);
            setSuccessMessage(`Room ${selectedRoom.room_code} reserved successfully for ${calculateNights()} nights!`);
            setShowReservationModal(false);
            setReservationData({ check_in: '', check_out: '', guests: 1, notes: '' });

            // Refresh rooms to update availability
            await fetchRooms();

        } catch (error) {
            console.error("Error creating reservation:", error);
            setError(error.response?.data?.message || error.message || "Failed to create reservation. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Get minimum date (today)
    const getMinDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Get minimum checkout date (day after checkin)
    const getMinCheckoutDate = () => {
        if (!reservationData.check_in) return getMinDate();
        const checkIn = new Date(reservationData.check_in);
        checkIn.setDate(checkIn.getDate() + 1);
        return checkIn.toISOString().split('T')[0];
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Alert Messages */}
            {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
            {successMessage && <AlertMessage type="success" message={successMessage} onClose={() => setSuccessMessage('')} />}

            {/* Navigation */}
            <nav className="bg-white shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br rounded-full shadow-2xl mr-2">
                                <img src="/Images/hotel.png" alt="Essencia Kivu Hotel" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">ESSENCIA KIVU HOTEL</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="/" className="text-gray-700 hover:text-amber-600 transition-colors">Home</a>

                            {isAuthenticated ? (
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-5 w-5 text-gray-600" />
                                        <span className="text-sm text-gray-700">Welcome, {user?.first_name || user?.email}</span>
                                    </div>
                                    <button onClick={logout} className="flex items-center text-gray-700 hover:text-amber-600 transition-colors">
                                        <LogOut className="h-5 w-5 mr-1" /> Logout
                                    </button>
                                </div>
                            ) : (
                                <button onClick={redirectToLogin} className="flex items-center text-gray-700 hover:text-amber-600 transition-colors">
                                    <LogIn className="h-5 w-5 mr-1" /> Login
                                </button>
                            )}
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-amber-600">
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                    {isMenuOpen && (
                        <div className="md:hidden border-t border-gray-200">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                <a href="/" className="block px-3 py-2 text-gray-700 hover:text-amber-600">Home</a>
                                <a href="/rooms" className="block px-3 py-2 text-amber-600 font-semibold">Rooms</a>
                                <a href="/services" className="block px-3 py-2 text-gray-700 hover:text-amber-600">Services</a>
                                <a href="/about" className="block px-3 py-2 text-gray-700 hover:text-amber-600">About</a>
                                <a href="/contact" className="block px-3 py-2 text-gray-700 hover:text-amber-600">Contact</a>
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
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Page Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Luxury Accommodations</h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">Choose from our selection of elegantly appointed rooms and suites, each designed for comfort and luxury</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Filter className="h-5 w-5 mr-2" />
                                Filter Rooms
                            </h3>

                            {/* Category Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Room Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {getCategoryConfig(category).name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Guest Count */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Number of Guests</label>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="text-lg font-semibold w-8 text-center">{guestCount}</span>
                                    <button
                                        onClick={() => setGuestCount(guestCount + 1)}
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                <p className="font-medium mb-1">Showing {filteredRooms.length} of {rooms.length} rooms</p>
                                <p>Perfect for {guestCount} guest{guestCount > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* Rooms Grid */}
                    <div className="lg:w-3/4">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                                        <div className="h-64 bg-gray-200"></div>
                                        <div className="p-6">
                                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded mb-4"></div>
                                            <div className="h-8 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredRooms.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms found</h3>
                                <p className="text-gray-600 mb-4">Try adjusting your filters to see more options</p>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('all');
                                        setGuestCount(1);
                                        setPriceRange([0, 1000]);
                                    }}
                                    className="text-amber-600 hover:text-amber-700 font-medium"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredRooms.map((room) => {
                                    const categoryConfig = getCategoryConfig(room.categories);
                                    return (
                                        <div key={room.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                            <div className={`h-64 bg-gradient-to-br ${categoryConfig.gradient} relative overflow-hidden`}>
                                                <div className="absolute top-4 left-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-90`}>
                                                        <Crown className="h-4 w-4 mr-1" />
                                                        {categoryConfig.name}
                                                    </span>
                                                </div>
                                                <div className="absolute top-4 right-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${room.reserved ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        {room.reserved ? 'Reserved' : 'Available'}
                                                    </span>
                                                </div>
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3">
                                                        <h3 className="text-xl font-bold text-gray-900">Room {room.room_code}</h3>
                                                        <p className="text-sm text-gray-600">{room.description}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center text-gray-600">
                                                        <Users className="h-5 w-5 mr-2" />
                                                        <span>Up to {room.capacity} guests</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-amber-600">${room.price_per_night}</p>
                                                        <p className="text-sm text-gray-500">per night</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 gap-4 mb-6 py-4 border-t border-gray-100">
                                                    <div className="text-center">
                                                        <Wifi className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                                        <span className="text-xs text-gray-600">WiFi</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <Tv className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                                        <span className="text-xs text-gray-600">TV</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <Wind className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                                        <span className="text-xs text-gray-600">AC</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <Bath className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                                        <span className="text-xs text-gray-600">Bath</span>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-3">
                                                    <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                                                        <Eye className="h-4 w-4 inline mr-2" />
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleReservation(room)}
                                                        disabled={room.reserved || isLoading}
                                                        className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Calendar className="h-4 w-4 inline mr-2" />
                                                        {room.reserved ? 'Reserved' : 'Book Now'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reservation Modal */}
            {showReservationModal && selectedRoom && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <h3 className="text-xl font-semibold text-gray-900">Reserve Room {selectedRoom.room_code}</h3>
                            <button onClick={() => setShowReservationModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleReservationSubmit} className="p-6">
                            {/* Room Info */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">Room {selectedRoom.room_code}</h4>
                                        <p className="text-sm text-gray-600">{getCategoryConfig(selectedRoom.categories).name} Category</p>
                                        <p className="text-sm text-gray-600 mt-1">Capacity: Up to {selectedRoom.capacity} guests</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-amber-600">${selectedRoom.price_per_night}</p>
                                        <p className="text-sm text-gray-500">per night</p>
                                    </div>
                                </div>
                            </div>

                            {/* Check-in Date */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <CalendarDays className="h-4 w-4 inline mr-1" />
                                    Check-in Date
                                </label>
                                <input
                                    type="date"
                                    value={reservationData.check_in}
                                    min={getMinDate()}
                                    onChange={(e) => setReservationData(prev => ({ ...prev, check_in: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                    required
                                />
                            </div>

                            {/* Check-out Date */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <CalendarDays className="h-4 w-4 inline mr-1" />
                                    Check-out Date
                                </label>
                                <input
                                    type="date"
                                    value={reservationData.check_out}
                                    min={getMinCheckoutDate()}
                                    onChange={(e) => setReservationData(prev => ({ ...prev, check_out: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                    required
                                />
                            </div>

                            {/* Number of Guests */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Users className="h-4 w-4 inline mr-1" />
                                    Number of Guests
                                </label>
                                <div className="flex items-center space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setReservationData(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="text-lg font-semibold w-12 text-center">{reservationData.guests}</span>
                                    <button
                                        type="button"
                                        onClick={() => setReservationData(prev => ({ ...prev, guests: Math.min(selectedRoom.capacity, prev.guests + 1) }))}
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Maximum: {selectedRoom.capacity} guests</p>
                            </div>

                            {/* Special Notes */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <BookOpen className="h-4 w-4 inline mr-1" />
                                    Special Requests (Optional)
                                </label>
                                <textarea
                                    value={reservationData.notes}
                                    onChange={(e) => setReservationData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any special requests or requirements..."
                                    rows="3"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>

                            {/* Reservation Summary */}
                            {reservationData.check_in && reservationData.check_out && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <h5 className="font-semibold text-gray-900 mb-3">Reservation Summary</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Check-in:</span>
                                            <span className="font-medium">{new Date(reservationData.check_in).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Check-out:</span>
                                            <span className="font-medium">{new Date(reservationData.check_out).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Nights:</span>
                                            <span className="font-medium">{calculateNights()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Guests:</span>
                                            <span className="font-medium">{reservationData.guests}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Rate per night:</span>
                                            <span className="font-medium">${selectedRoom.price_per_night}</span>
                                        </div>
                                        <div className="border-t border-amber-300 pt-2 mt-3">
                                            <div className="flex justify-between">
                                                <span className="font-semibold text-gray-900">Total Amount:</span>
                                                <span className="font-bold text-xl text-amber-600">${calculateTotal()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Login Warning */}
                            {!isAuthenticated && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                                        <p className="text-sm text-yellow-800">Please login to complete your reservation</p>
                                    </div>
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowReservationModal(false)}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !isAuthenticated || !reservationData.check_in || !reservationData.check_out}
                                    className="px-6 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Clock className="h-4 w-4 inline mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : !isAuthenticated ? (
                                        <>
                                            <LogIn className="h-4 w-4 inline mr-2" />
                                            Login Required
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 inline mr-2" />
                                            Confirm Reservation
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-12 mt-16">
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
                                <li><a href="/" className="hover:text-amber-600 transition-colors">Home</a></li>
                                <li><a href="/rooms" className="hover:text-amber-600 transition-colors">Rooms & Suites</a></li>
                                <li><a href="/services" className="hover:text-amber-600 transition-colors">Services</a></li>
                                <li><a href="/contact" className="hover:text-amber-600 transition-colors">Contact</a></li>
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
                            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
                            <div className="space-y-2 text-gray-300">
                                <p className="flex items-center"><Phone className="h-4 w-4 mr-2" />+250 788 123 456</p>
                                <p className="flex items-center"><Mail className="h-4 w-4 mr-2" />info@essenciakivu.com</p>
                                <p className="flex items-center"><MapPin className="h-4 w-4 mr-2" />Lake Kivu Shore, Gisenyi</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
                        <p>&copy; 2025 Essencia Kivu Hotel. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default RoomsReservationPage;