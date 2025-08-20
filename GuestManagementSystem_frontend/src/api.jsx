import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('user_data');
            window.location.href = '/login';
        }
        return Promise.reject(handleError(error));
    }
);

// Error handler
const handleError = (error) => {
    if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message ||
            error.response.data?.error ||
            error.response.data?.detail ||
            'An error occurred';
        return {
            message,
            status: error.response.status,
            data: error.response.data
        };
    } else if (error.request) {
        // Request made but no response received
        return {
            message: 'Network error - please check your connection',
            status: 0
        };
    } else {
        // Something else happened
        return {
            message: error.message || 'An unexpected error occurred',
            status: 0
        };
    }
};

// ==================== Authentication Services ====================
export const authService = {
    // Login (supports both customer and staff)
    login: async (credentials) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login/`, credentials);
            if (response.data.token) {
                sessionStorage.setItem('access_token', response.data.token);
                sessionStorage.setItem('user_data', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Logout
    logout: async () => {
        try {
            await api.post('/auth/logout/');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('user_data');
            return { message: 'Successfully logged out' };
        } catch (error) {
            console.log(error);
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('user_data');
            return { message: 'Successfully logged out' };
        }
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!sessionStorage.getItem('access_token');
    },

    // Get current user data
    getCurrentUser: () => {
        const userData = sessionStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }
};

// ==================== User Management Services (Staff/Admin) ====================
export const userService = {
    // Get all users
    getUsers: async (params = {}) => {
        try {
            const response = await api.get('/users/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Create new user
    createUser: async (userData) => {
        try {
            const response = await api.post('/users/', userData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get user by ID
    getUser: async (userId) => {
        try {
            const response = await api.get(`/users/${userId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Update user
    updateUser: async (userId, userData) => {
        try {
            const response = await api.put(`/users/${userId}/`, userData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Delete user
    deleteUser: async (userId) => {
        try {
            const response = await api.delete(`/users/${userId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Reset user password
    resetPassword: async (userId, passwordData) => {
        try {
            const response = await api.post(`/users/${userId}/reset-password/`, passwordData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Customer Services ====================
export const customerService = {
    // Register new customer
    register: async (customerData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/customers/register/`, customerData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get customer profile
    getProfile: async () => {
        try {
            const response = await api.get('/customers/profile/');
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Update customer profile
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/customers/profile/', profileData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get all customers (Admin only)
    getCustomers: async (params = {}) => {
        try {
            const response = await api.get('/customers/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Product Category Services ====================
export const categoryService = {
    // Get all categories
    getCategories: async (params = {}) => {
        try {
            const response = await api.get('/categories/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Create new category
    createCategory: async (categoryData) => {
        try {
            const response = await api.post('/categories/', categoryData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get category by ID
    getCategory: async (categoryId) => {
        try {
            const response = await api.get(`/categories/${categoryId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Update category
    updateCategory: async (categoryId, categoryData) => {
        try {
            const response = await api.put(`/categories/${categoryId}/`, categoryData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Delete category
    deleteCategory: async (categoryId) => {
        try {
            const response = await api.delete(`/categories/${categoryId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Product Services ====================
export const productService = {
    // Get all products
    getProducts: async (params = {}) => {
        try {
            const response = await api.get('/products/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Create new product
    createProduct: async (productData) => {
        try {
            const response = await api.post('/products/', productData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get product by ID
    getProduct: async (productId) => {
        try {
            const response = await api.get(`/products/${productId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Update product
    updateProduct: async (productId, productData) => {
        try {
            const response = await api.put(`/products/${productId}/`, productData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Delete product
    deleteProduct: async (productId) => {
        try {
            const response = await api.delete(`/products/${productId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Search products
    searchProducts: async (query) => {
        try {
            const response = await api.get('/products/search/', { params: { q: query } });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    replenishProduct: async (productId, replenishQuantity) => {
        try {
            const payload = { replenish_quantity: replenishQuantity };
            const response = await api.patch(`/products/${productId}/`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Room Services ====================
export const roomService = {
    // Get all rooms
    getRooms: async (params = {}) => {
        try {
            const response = await api.get('/rooms/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Create new room
    createRoom: async (roomData) => {
        try {
            const response = await api.post('/rooms/', roomData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get room by ID
    getRoom: async (roomId) => {
        try {
            const response = await api.get(`/rooms/${roomId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Update room
    updateRoom: async (roomId, roomData) => {
        try {
            const response = await api.put(`/rooms/${roomId}/`, roomData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Delete room
    deleteRoom: async (roomId) => {
        try {
            const response = await api.delete(`/rooms/${roomId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Search rooms
    searchRooms: async (searchParams) => {
        try {
            const response = await api.get('/rooms/search/', { params: searchParams });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Cart Services ====================
export const cartService = {

    getCart: async (userId) => {
        try {
            const res = await api.get('/cart/', { params: { user_id: userId } });
            return res.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get cart items
    getCartItems: async () => {
        try {
            const response = await api.get('/cart/items/');
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Add item to cart
    addToCart: async (itemData) => {
        try {
            const response = await api.post('/cart/items/', itemData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Update cart item
    updateCartItem: async (itemId, itemData) => {
        try {
            const response = await api.put(`/cart/items/${itemId}/`, itemData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Remove item from cart
    removeFromCart: async (itemId) => {
        try {
            const response = await api.delete(`/cart/items/${itemId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Clear cart
    clearCart: async () => {
        try {
            const response = await api.delete('/cart/clear/');
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Order Services ====================
export const orderService = {
    // Get customer orders
    getOrders: async (params = {}) => {
        try {
            const response = await api.get('/orders/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Create new order
    createOrder: async (orderData) => {
        try {
            const response = await api.post('/orders/', orderData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get order by ID
    getOrder: async (orderId) => {
        try {
            const response = await api.get(`/orders/${orderId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Update order status (Admin only)
    updateOrderStatus: async (orderId, statusData) => {
        try {
            const response = await api.patch(`/orders/${orderId}/status/`, statusData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get all orders (Admin only)
    getAllOrders: async (params = {}) => {
        try {
            const response = await api.get('/admin/orders/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Chat Services ====================
export const chatService = {
    // Start chat session
    startChatSession: async (sessionData = {}) => {
        try {
            const response = await api.post('/chat/session/', sessionData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Send message
    sendMessage: async (messageData) => {
        try {
            const response = await api.post('/chat/message/', messageData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get chat history
    getChatHistory: async (sessionId) => {
        try {
            const response = await api.get(`/chat/history/${sessionId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Feedback Services ====================
export const feedbackService = {
    // Get customer feedback
    getFeedback: async (params = {}) => {
        try {
            const response = await api.get('/feedback/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Create feedback
    createFeedback: async (feedbackData) => {
        try {
            const response = await api.post('/feedback/', feedbackData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get feedback by ID
    getFeedbackById: async (feedbackId) => {
        try {
            const response = await api.get(`/feedback/${feedbackId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Update feedback
    updateFeedback: async (feedbackId, feedbackData) => {
        try {
            const response = await api.put(`/feedback/${feedbackId}/`, feedbackData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Delete feedback
    deleteFeedback: async (feedbackId) => {
        try {
            const response = await api.delete(`/feedback/${feedbackId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get all feedback (Admin only)
    getAllFeedback: async (params = {}) => {
        try {
            const response = await api.get('/admin/feedback/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== AI Insights Services ====================
export const insightService = {
    // Get AI insights
    getInsights: async (params = {}) => {
        try {
            const response = await api.get('/insights/', { params });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Get insight by ID
    getInsight: async (insightId) => {
        try {
            const response = await api.get(`/insights/${insightId}/`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Dashboard Services ====================
export const dashboardService = {
    // Get dashboard statistics
    getStats: async () => {
        try {
            const response = await api.get('/dashboard/stats/');
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// ==================== Utility Services ====================
export const utilService = {
    // Check if user is authenticated
    isAuthenticated: () => {
        return !!sessionStorage.getItem('access_token');
    },

    // Get stored user data
    getUserData: () => {
        const userData = sessionStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    // Clear stored data
    clearStoredData: () => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user_data');
    },

    // Format error message
    formatError: (error) => {
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        if (error.data) {
            // Handle validation errors
            if (typeof error.data === 'object') {
                const messages = [];
                for (const [field, errors] of Object.entries(error.data)) {
                    if (Array.isArray(errors)) {
                        messages.push(`${field}: ${errors.join(', ')}`);
                    } else {
                        messages.push(`${field}: ${errors}`);
                    }
                }
                return messages.join('; ');
            }
            return error.data;
        }
        return 'An unexpected error occurred';
    },

    // Get user type
    getUserType: () => {
        const userData = utilService.getUserData();
        return userData?.user_type || null;
    },

    // Check if user is staff
    isStaff: () => {
        return utilService.getUserType() === 'staff';
    },

    // Check if user is customer
    isCustomer: () => {
        return utilService.getUserType() === 'customer';
    }
};

// Export the configured axios instance for custom requests
export { api };

// Default export with all services
export default {
    auth: authService,
    user: userService,
    customer: customerService,
    category: categoryService,
    product: productService,
    room: roomService,
    cart: cartService,
    order: orderService,
    chat: chatService,
    feedback: feedbackService,
    insight: insightService,
    dashboard: dashboardService,
    util: utilService
};