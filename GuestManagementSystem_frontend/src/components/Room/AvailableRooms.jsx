import React, { useState, useEffect } from 'react';
import {
    Home,
    Search,
    Filter,
    Eye,
    Plus,
    RefreshCw,
    Users,
    DollarSign,
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
    Bed,
    Star,
    Crown,
    Building,
    MapPin,
    Wifi,
    Car,
    Coffee,
    Tv,
    Wind,
    Bath,
    CheckCircle
} from 'lucide-react';
import { roomService } from '../../api';

const AvailableRoomsPage = () => {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPriceRange, setFilterPriceRange] = useState('all');
    const [sortBy, setSortBy] = useState('price_asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [roomsPerPage] = useState(12);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    const categoryChoices = [
        { value: 'G', label: 'General', icon: Bed, color: 'text-gray-600', bg: 'bg-gray-100', gradient: 'from-gray-50 to-gray-100' },
        { value: 'V', label: 'VIP', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100', gradient: 'from-yellow-50 to-yellow-100' },
        { value: 'S', label: 'Suite', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100', gradient: 'from-purple-50 to-purple-100' },
        { value: 'D', label: 'Deluxe', icon: Building, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-50 to-blue-100' }
    ];

    const priceRanges = [
        { value: 'all', label: 'All Prices' },
        { value: '0-100', label: 'Under $100' },
        { value: '100-200', label: '$100 - $200' },
        { value: '200-300', label: '$200 - $300' },
        { value: '300+', label: '$300+' }
    ];

    useEffect(() => {
        loadAvailableRooms();
    }, []);

    const loadAvailableRooms = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await roomService.getRooms();
            const availableRooms = (response.data || response).filter(room =>
                !room.reserved && room.is_active
            );
            setRooms(availableRooms);
            console.log('Available Rooms:', availableRooms);
        } catch (err) {
            setError('Failed to load available rooms. Please try again.');
            console.error('Error loading rooms:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshRooms = async () => {
        setIsRefreshing(true);
        await loadAvailableRooms();
        setIsRefreshing(false);
    };

    const handleViewDetails = (room) => {
        setSelectedRoomDetail(room);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedRoomDetail(null);
    };

    const handleBookRoom = (room) => {
        setSelectedRoomDetail(room);
        setShowBookingModal(true);
    };

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setSelectedRoomDetail(null);
    };

    const filteredAndSortedRooms = rooms
        .filter(room => {
            const matchesSearch =
                room.room_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = filterCategory === 'all' || room.categories === filterCategory;

            let matchesPrice = true;
            if (filterPriceRange !== 'all') {
                const price = parseFloat(room.price_per_night);
                switch (filterPriceRange) {
                    case '0-100':
                        matchesPrice = price < 100;
                        break;
                    case '100-200':
                        matchesPrice = price >= 100 && price < 200;
                        break;
                    case '200-300':
                        matchesPrice = price >= 200 && price < 300;
                        break;
                    case '300+':
                        matchesPrice = price >= 300;
                        break;
                }
            }

            return matchesSearch && matchesCategory && matchesPrice;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'price_asc':
                    return parseFloat(a.price_per_night) - parseFloat(b.price_per_night);
                case 'price_desc':
                    return parseFloat(b.price_per_night) - parseFloat(a.price_per_night);
                case 'capacity_asc':
                    return a.capacity - b.capacity;
                case 'capacity_desc':
                    return b.capacity - a.capacity;
                case 'room_code':
                    return a.room_code.localeCompare(b.room_code);
                default:
                    return 0;
            }
        });

    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = filteredAndSortedRooms.slice(indexOfFirstRoom, indexOfLastRoom);
    const totalPages = Math.ceil(filteredAndSortedRooms.length / roomsPerPage);

    const getCategoryConfig = (category) => {
        return categoryChoices.find(c => c.value === category) || categoryChoices[0];
    };

    const getCategoryLabel = (category) => {
        const config = getCategoryConfig(category);
        return config.label;
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Rooms</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadAvailableRooms}
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
                            <Home className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Available Rooms</h1>
                                <p className="text-sm text-gray-600">Find and book your perfect stay</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshRooms}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex items-center space-x-4 flex-wrap gap-2">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search rooms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <Home className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="all">All Categories</option>
                                    {categoryChoices.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <DollarSign className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterPriceRange}
                                    onChange={(e) => setFilterPriceRange(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    {priceRanges.map(range => (
                                        <option key={range.value} value={range.value}>
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="capacity_asc">Capacity: Low to High</option>
                                    <option value="capacity_desc">Capacity: High to Low</option>
                                    <option value="room_code">Room Number</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                {filteredAndSortedRooms.length} available rooms
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rooms Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading available rooms...</p>
                        </div>
                    </div>
                ) : currentRooms.length === 0 ? (
                    <div className="text-center py-20">
                        <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No available rooms found</h3>
                        <p className="text-gray-600">
                            {searchTerm || filterCategory !== 'all' || filterPriceRange !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'All rooms are currently booked. Please check back later.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {currentRooms.map((room) => {
                                const categoryConfig = getCategoryConfig(room.categories);
                                const CategoryIcon = categoryConfig.icon;
                                return (
                                    <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                                        {/* Room Image Placeholder */}
                                        <div className={`h-48 bg-gradient-to-br ${categoryConfig.gradient} flex items-center justify-center relative`}>
                                            <CategoryIcon className={`h-16 w-16 ${categoryConfig.color} opacity-50`} />
                                            <div className="absolute top-3 left-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryConfig.bg} ${categoryConfig.color}`}>
                                                    {categoryConfig.label}
                                                </span>
                                            </div>
                                            <div className="absolute top-3 right-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Available
                                                </span>
                                            </div>
                                        </div>

                                        {/* Room Details */}
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Room {room.room_code}
                                                </h3>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-amber-600">
                                                        ${room.price_per_night}
                                                    </p>
                                                    <p className="text-xs text-gray-500">per night</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-sm text-gray-600 mb-4">
                                                <Users className="h-4 w-4 mr-2" />
                                                Up to {room.capacity} guests
                                            </div>

                                            {room.description && (
                                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                    {room.description}
                                                </p>
                                            )}

                                            {/* Amenities */}
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 border-t pt-3">
                                                <div className="flex items-center space-x-3">
                                                    <Wifi className="h-3 w-3" title="Free WiFi" />
                                                    <Tv className="h-3 w-3" title="TV" />
                                                    <Wind className="h-3 w-3" title="AC" />
                                                    <Bath className="h-3 w-3" title="Private Bath" />
                                                </div>
                                                <span className="text-gray-400">ID: {room.id}</span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewDetails(room)}
                                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Details
                                                </button>
                                                <button
                                                    onClick={() => handleBookRoom(room)}
                                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{indexOfFirstRoom + 1}</span> to{' '}
                                            <span className="font-medium">
                                                {Math.min(indexOfLastRoom, filteredAndSortedRooms.length)}
                                            </span>{' '}
                                            of <span className="font-medium">{filteredAndSortedRooms.length}</span> results
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

            {/* Room Detail Modal */}
            {showDetailModal && selectedRoomDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <div className={`h-12 w-12 rounded-lg ${getCategoryConfig(selectedRoomDetail.categories).bg} flex items-center justify-center mr-4`}>
                                    {(() => {
                                        const CategoryIcon = getCategoryConfig(selectedRoomDetail.categories).icon;
                                        return <CategoryIcon className={`h-6 w-6 ${getCategoryConfig(selectedRoomDetail.categories).color}`} />;
                                    })()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Room {selectedRoomDetail.room_code}
                                    </h3>
                                    <p className="text-sm text-gray-600">{getCategoryLabel(selectedRoomDetail.categories)} Room</p>
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
                            {/* Room Hero Section */}
                            <div className={`mb-8 p-6 bg-gradient-to-r ${getCategoryConfig(selectedRoomDetail.categories).gradient} rounded-lg border`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-2xl font-bold text-gray-900 mb-2">Room {selectedRoomDetail.room_code}</h4>
                                        <p className="text-gray-600">{getCategoryLabel(selectedRoomDetail.categories)} Category</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-amber-600">${selectedRoomDetail.price_per_night}</p>
                                        <p className="text-sm text-gray-500">per night</p>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-2">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Available Now
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Room Details Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Basic Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Home className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Room Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Room Number</span>
                                            <span className="text-sm font-medium text-gray-900">{selectedRoomDetail.room_code}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Category</span>
                                            <span className="text-sm font-medium text-gray-900">{getCategoryLabel(selectedRoomDetail.categories)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Max Guests</span>
                                            <span className="text-sm font-medium text-gray-900">{selectedRoomDetail.capacity} guests</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Price per Night</span>
                                            <span className="text-sm font-medium text-gray-900">${selectedRoomDetail.price_per_night}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Star className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Amenities</h5>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Wifi className="h-4 w-4 mr-2" />
                                            Free WiFi
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Tv className="h-4 w-4 mr-2" />
                                            Cable TV
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Wind className="h-4 w-4 mr-2" />
                                            Air Conditioning
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Bath className="h-4 w-4 mr-2" />
                                            Private Bathroom
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Coffee className="h-4 w-4 mr-2" />
                                            Coffee Maker
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Car className="h-4 w-4 mr-2" />
                                            Parking Available
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedRoomDetail.description && (
                                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                    <h5 className="text-lg font-medium text-gray-900 mb-3">Description</h5>
                                    <p className="text-gray-600 leading-relaxed">{selectedRoomDetail.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    Available for immediate booking • Room ID: {selectedRoomDetail.id}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={closeDetailModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => handleBookRoom(selectedRoomDetail)}
                                        className="px-6 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        Book This Room
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedRoomDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Calendar className="h-6 w-6 text-amber-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Book Room {selectedRoomDetail.room_code}</h3>
                            </div>
                            <button
                                onClick={closeBookingModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className={`h-16 w-16 rounded-full ${getCategoryConfig(selectedRoomDetail.categories).bg} flex items-center justify-center mx-auto mb-4`}>
                                    {(() => {
                                        const CategoryIcon = getCategoryConfig(selectedRoomDetail.categories).icon;
                                        return <CategoryIcon className={`h-8 w-8 ${getCategoryConfig(selectedRoomDetail.categories).color}`} />;
                                    })()}
                                </div>
                                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                                    Room {selectedRoomDetail.room_code}
                                </h4>
                                <p className="text-gray-600 mb-2">{getCategoryLabel(selectedRoomDetail.categories)} Category</p>
                                <p className="text-2xl font-bold text-amber-600">${selectedRoomDetail.price_per_night}/night</p>
                            </div>

                            {/* Booking Form Placeholder */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Check-in Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Check-out Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Number of Guests
                                    </label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                                        {[...Array(selectedRoomDetail.capacity)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1} {i + 1 === 1 ? 'Guest' : 'Guests'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Room Summary */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-2">Booking Summary</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Room:</span>
                                        <span className="text-gray-900">Room {selectedRoomDetail.room_code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Category:</span>
                                        <span className="text-gray-900">{getCategoryLabel(selectedRoomDetail.categories)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Max Capacity:</span>
                                        <span className="text-gray-900">{selectedRoomDetail.capacity} guests</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-2 border-t">
                                        <span className="text-gray-900">Price per night:</span>
                                        <span className="text-amber-600">${selectedRoomDetail.price_per_night}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={closeBookingModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // Here you would typically handle the booking logic
                                        alert('Booking functionality would be implemented here');
                                        closeBookingModal();
                                    }}
                                    className="px-6 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailableRoomsPage;