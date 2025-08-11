import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Star, UserCheck, Heart, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { customerService } from '../../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CustomerSignupPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        gender: '',
        marital_status: '',
        location: '',
        password: '',
        password_confirm: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [completedSteps, setCompletedSteps] = useState([]);

    const totalSteps = 4;

    const genderChoices = [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' },
        { value: 'O', label: 'Other' }
    ];

    const maritalStatusChoices = [
        { value: 'S', label: 'Single' },
        { value: 'M', label: 'Married' },
        { value: 'D', label: 'Divorced' },
        { value: 'W', label: 'Widowed' }
    ];

    const stepTitles = {
        1: 'Account Details',
        2: 'Personal Information',
        3: 'Contact & Location',
        4: 'Security Setup'
    };

    const stepFields = {
        1: ['username', 'email'],
        2: ['first_name', 'last_name', 'gender', 'marital_status'],
        3: ['phone', 'location'],
        4: ['password', 'password_confirm']
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateStep = (step) => {
        const newErrors = {};
        const fieldsToValidate = stepFields[step];

        fieldsToValidate.forEach(field => {
            if (!formData[field]) {
                switch (field) {
                    case 'username':
                        newErrors[field] = 'Username is required';
                        break;
                    case 'email':
                        newErrors[field] = 'Email is required';
                        break;
                    case 'first_name':
                        newErrors[field] = 'First name is required';
                        break;
                    case 'last_name':
                        newErrors[field] = 'Last name is required';
                        break;
                    case 'phone':
                        newErrors[field] = 'Phone number is required';
                        break;
                    case 'gender':
                        newErrors[field] = 'Gender is required';
                        break;
                    case 'marital_status':
                        newErrors[field] = 'Marital status is required';
                        break;
                    case 'location':
                        newErrors[field] = 'Location is required';
                        break;
                    case 'password':
                        newErrors[field] = 'Password is required';
                        break;
                    case 'password_confirm':
                        newErrors[field] = 'Password confirmation is required';
                        break;
                }
            }
        });

        // Additional validations
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }


        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }

        if (step === 4 && formData.password !== formData.password_confirm) {
            newErrors.password_confirm = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (!completedSteps.includes(currentStep)) {
                setCompletedSteps([...completedSteps, currentStep]);
            }
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) {
            return;
        }

        setIsLoading(true);
        try {
            await customerService.register(formData);
            console.log('Customer registration data:', formData);
            toast.success('Registration successful! Welcome to Essencia Kivu Hotel!');
            window.location.href = '/login';
            setFormData({
                username: '',
                email: '',
                first_name: '',
                last_name: '',
                phone: '',
                gender: '',
                marital_status: '',
                location: '',
                password: '',
                password_confirm: ''
            });
            setCurrentStep(1);
            setCompletedSteps([]);
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((step) => (
                <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${step === currentStep
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : completedSteps.includes(step)
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-gray-300 text-gray-500'
                        }`}>
                        {completedSteps.includes(step) ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <span className="text-sm font-semibold">{step}</span>
                        )}
                    </div>
                    {step < 4 && (
                        <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${completedSteps.includes(step) ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="space-y-1">
                <label htmlFor="username" className="block text-xs font-semibold text-gray-700">
                    Username
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-amber-600" />
                    </div>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500 text-sm ${errors.username ? 'border-red-300' : 'border-amber-200'}`}
                        placeholder="Choose a username"
                    />
                </div>
                {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
            </div>
            <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700">
                    Email Address
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-amber-600" />
                    </div>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500 text-sm ${errors.email ? 'border-red-300' : 'border-amber-200'}`}
                        placeholder="your.email@example.com"
                    />
                </div>
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label htmlFor="first_name" className="block text-xs font-semibold text-gray-700">
                        First Name
                    </label>
                    <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500 text-sm ${errors.first_name ? 'border-red-300' : 'border-amber-200'}`}
                        placeholder="First name"
                    />
                    {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name}</p>}
                </div>
                <div className="space-y-1">
                    <label htmlFor="last_name" className="block text-xs font-semibold text-gray-700">
                        Last Name
                    </label>
                    <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500 text-sm ${errors.last_name ? 'border-red-300' : 'border-amber-200'}`}
                        placeholder="Last name"
                    />
                    {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label htmlFor="gender" className="block text-xs font-semibold text-gray-700">
                        Gender
                    </label>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 text-sm ${errors.gender ? 'border-red-300' : 'border-amber-200'}`}
                    >
                        <option value="">Select</option>
                        {genderChoices.map(choice => (
                            <option key={choice.value} value={choice.value}>
                                {choice.label}
                            </option>
                        ))}
                    </select>
                    {errors.gender && <p className="text-red-500 text-xs">{errors.gender}</p>}
                </div>
                <div className="space-y-1">
                    <label htmlFor="marital_status" className="block text-xs font-semibold text-gray-700">
                        Marital Status
                    </label>
                    <select
                        id="marital_status"
                        name="marital_status"
                        value={formData.marital_status}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 text-sm ${errors.marital_status ? 'border-red-300' : 'border-amber-200'}`}
                    >
                        <option value="">Select</option>
                        {maritalStatusChoices.map(choice => (
                            <option key={choice.value} value={choice.value}>
                                {choice.label}
                            </option>
                        ))}
                    </select>
                    {errors.marital_status && <p className="text-red-500 text-xs">{errors.marital_status}</p>}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4">
            <div className="space-y-1">
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700">
                    Phone Number
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-amber-600" />
                    </div>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500 text-sm ${errors.phone ? 'border-red-300' : 'border-amber-200'}`}
                        placeholder="+250 789 123 456"
                    />
                </div>
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
            </div>
            <div className="space-y-1">
                <label htmlFor="location" className="block text-xs font-semibold text-gray-700">
                    Location
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-amber-600" />
                    </div>
                    <input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500 text-sm ${errors.location ? 'border-red-300' : 'border-amber-200'}`}
                        placeholder="City, Country"
                    />
                </div>
                {errors.location && <p className="text-red-500 text-xs">{errors.location}</p>}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-4">
            <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
                    Password
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-amber-600" />
                    </div>
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500 text-sm ${errors.password ? 'border-red-300' : 'border-amber-200'}`}
                        placeholder="Create a strong password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-600 hover:text-amber-700 transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>
            <div className="space-y-1">
                <label htmlFor="password_confirm" className="block text-xs font-semibold text-gray-700">
                    Confirm Password
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-amber-600" />
                    </div>
                    <input
                        id="password_confirm"
                        name="password_confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.password_confirm}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500 text-sm ${errors.password_confirm ? 'border-red-300' : 'border-amber-200'}`}
                        placeholder="Confirm your password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-600 hover:text-amber-700 transition-colors"
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {errors.password_confirm && <p className="text-red-500 text-xs">{errors.password_confirm}</p>}
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            case 4:
                return renderStep4();
            default:
                return renderStep1();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-slate-800 relative overflow-hidden">
            {/* Background animations */}
            <div className="absolute inset-0">
                <div className="absolute -top-60 -left-60 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tr from-amber-400/15 to-yellow-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-amber-300/10 to-orange-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
                <div className="absolute top-20 left-20 w-4 h-4 bg-amber-400/30 rounded-full animate-bounce"></div>
                <div className="absolute top-40 right-1/3 w-3 h-3 bg-yellow-300/40 rounded-full animate-bounce delay-300"></div>
                <div className="absolute bottom-1/3 left-1/4 w-5 h-5 bg-amber-300/25 rounded-full animate-bounce delay-700"></div>
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-amber-400 rotate-45 animate-spin-slow"></div>
                    <div className="absolute bottom-1/4 right-1/3 w-24 h-24 border border-yellow-400 rotate-12 animate-spin-reverse"></div>
                </div>
            </div>

            <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
                {/* Left side - Hotel info */}
                <div className="flex items-center justify-center p-8 lg:p-12 xl:p-16">
                    <div className="max-w-lg text-white">
                        <div className="text-center lg:text-left mb-12">
                            <div className="inline-flex items-center justify-center w-40 h-40 bg-gradient-to-br rounded-full mb-6 shadow-2xl">
                                <img src="/Images/hotel.png" alt="Essencia Kivu Hotel" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-3">
                                JOIN ESSENCIA
                            </h1>
                            <p className="text-xl font-light text-amber-200 tracking-wider">KIVU HOTEL</p>
                            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-300 mx-auto lg:mx-0 mt-4 rounded-full"></div>
                        </div>
                        <div className="space-y-6 mb-8">
                            <h2 className="text-2xl font-semibold text-amber-100">
                                Become Our VIP Guest
                            </h2>
                            <p className="text-base text-gray-200 leading-relaxed">
                                Create your account and unlock exclusive benefits, special rates, and
                                personalized service at Rwanda's premier lakeside destination.
                            </p>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                    <Star className="w-4 h-4 text-amber-400" />
                                </div>
                                <span className="text-amber-200">Exclusive member rates & offers</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                    <UserCheck className="w-4 h-4 text-amber-400" />
                                </div>
                                <span className="text-amber-200">Priority booking & check-in</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-amber-400" />
                                </div>
                                <span className="text-amber-200">Personalized service experience</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-300">
                            <Phone className="w-4 h-4 text-amber-400" />
                            <span className="text-sm">+250 788 123 456</span>
                        </div>
                    </div>
                </div>

                {/* Right side - Multi-step form */}
                <div className="flex items-center justify-center p-4 lg:p-8">
                    <div className="w-full max-w-md">
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-amber-200/50">
                            {/* Step indicator */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Create an Account</h2>
                                <p className="text-gray-600">Sign Up to access your account</p>
                            </div>
                            {renderStepIndicator()}

                            {/* Form header */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                                    {stepTitles[currentStep]}
                                </h2>
                                <p className="text-gray-600 text-sm">
                                    Step {currentStep} of {totalSteps}
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => e.preventDefault()}>
                                {/* Current step content */}
                                {renderCurrentStep()}

                                {/* Navigation buttons */}
                                <div className="flex justify-between mt-8">
                                    {currentStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Previous
                                        </button>
                                    )}

                                    {currentStep < totalSteps ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="flex items-center ml-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            Next
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="ml-auto px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Creating...
                                                </div>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Footer links */}
                            <div className="text-center mt-6">
                                <p className="text-xs text-gray-600">
                                    Already have an account?{' '}
                                    <a href="/login" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                                        Customer Sign in here
                                    </a>
                                </p>
                            </div>

                            <div className="text-center mt-4">
                                <p className="text-xs text-gray-600">
                                    By creating an account, you agree to our{' '}
                                    <button className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                                        Terms & Conditions
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
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

export default CustomerSignupPage;