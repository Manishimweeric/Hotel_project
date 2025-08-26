import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Hotel, MapPin, Phone, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService } from '../../api';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.login(formData);

            if (response.success) {
                console.log('response', response);
                localStorage.setItem('access_token', response.token);
                localStorage.setItem('user_type', response.user.user_type);
                localStorage.setItem('user_data', JSON.stringify(response.user));
                toast.success('Welcome to Essencia Kivu Hotel!');
                const type = String(response.user_type || '').toLowerCase();
                if (type === 'customer') {
                    window.location.href = '/';
                } else if (type === "staff" || type === 'administrator') {
                    window.location.href = '/dashboard/Admin-dashboard';
                } else {

                    toast.error("invalid roles")
                }
            } else {
                toast.error('Invalid email or password');
            }
        } catch (error) {
            console.error(error);
            toast.error('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-slate-800 relative overflow-hidden">
            {/* Enhanced Background Elements */}
            <div className="absolute inset-0">
                {/* Large Background Circles */}
                <div className="absolute -top-60 -left-60 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tr from-amber-400/15 to-yellow-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-amber-300/10 to-orange-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
                {/* Floating Elements */}
                <div className="absolute top-20 left-20 w-4 h-4 bg-amber-400/30 rounded-full animate-bounce"></div>
                <div className="absolute top-40 right-1/3 w-3 h-3 bg-yellow-300/40 rounded-full animate-bounce delay-300"></div>
                <div className="absolute bottom-1/3 left-1/4 w-5 h-5 bg-amber-300/25 rounded-full animate-bounce delay-700"></div>

                {/* Geometric Patterns */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-amber-400 rotate-45 animate-spin-slow"></div>
                    <div className="absolute bottom-1/4 right-1/3 w-24 h-24 border border-yellow-400 rotate-12 animate-spin-reverse"></div>
                </div>
            </div>

            <div className="relative z-10 min-h-screen grid lg:grid-cols-2 ">
                {/* Left Side - Hotel Information */}
                <div className="flex items-center justify-center p-60 lg:p-12 xl:p-16">
                    <div className="max-w-lg text-white">
                        {/* Logo Section */}
                        <div className="text-center lg:text-left mb-12">
                            <div className="inline-flex items-center justify-center w-40 h-40 bg-gradient-to-br rounded-full mb-6 shadow-2xl">
                                <img src="/Images/hotel.png" alt="Essencia Kivu Hotel" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-3">
                                ESSENCIA
                            </h1>
                            <p className="text-2xl font-light text-amber-200 tracking-wider">KIVU HOTEL</p>
                            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-300 mx-auto lg:mx-0 mt-4 rounded-full"></div>
                        </div>

                        {/* Hotel Description */}
                        <div className="space-y-6 mb-8">
                            <h2 className="text-3xl font-semibold text-amber-100">
                                Experience Luxury by Lake Kivu
                            </h2>
                            <p className="text-lg text-gray-200 leading-relaxed">
                                Discover the perfect blend of elegance and comfort at Essencia Kivu Hotel.
                                Nestled along the stunning shores of Lake Kivu, we offer an unforgettable
                                hospitality experience with breathtaking views and world-class service.
                            </p>
                        </div>

                        {/* Hotel Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                    <Star className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-amber-200 font-medium">5-Star Luxury</p>
                                    <p className="text-gray-300 text-sm">Premium Service</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-amber-200 font-medium">Lake Kivu</p>
                                    <p className="text-gray-300 text-sm">Waterfront Location</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center space-x-3 text-gray-300">
                            <Phone className="w-5 h-5 text-amber-400" />
                            <span>+250 788 123 456</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex items-center justify-center p-8 lg:p-12">
                    <div className="w-full max-w-md">
                        {/* Login Container */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-amber-200/50">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                                <p className="text-gray-600">Sign in to access your account</p>
                            </div>

                            <div className="space-y-6">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="block w-full pl-12 pr-4 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500"
                                            placeholder="Enter your email address"
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="block w-full pl-12 pr-14 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500"
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-amber-600 hover:text-amber-700 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">

                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                            Signing in...
                                        </div>
                                    ) : (
                                        'Sign In to Hotel Portal'
                                    )}
                                </button>
                                <div className="mt-1 text-center">
                                    <div className="text-center mt-4 mb-3">
                                        <p className="text-xs text-gray-600">
                                            Already have an account?{' '}
                                            <a href="/Customersignup"
                                                type="button"
                                                className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                                            >
                                                Customer Sign Up here
                                            </a>
                                        </p>
                                    </div>
                                    <div className="text-center mt-1 mb-5">
                                        <p className="text-xs text-gray-600">
                                            Back to ?{' '}
                                            <a href="/"
                                                type="button"
                                                className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                                            >
                                                Home Page
                                            </a>
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">
                                        By signing in, you agree to our Terms of Service and Privacy Policy
                                    </p>
                                    {/* Security Features */}
                                    <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
                                        <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span>Secure Login</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                            <span>SSL Protected</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                            <span>24/7 Support</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="text-center mt-8">

                            <p className="text-sm text-gray-300">
                                Need assistance?{' '}
                                <button className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                                    Contact our reception
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx={true}>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .animate-spin-reverse {
                    animation: spin-reverse 15s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;