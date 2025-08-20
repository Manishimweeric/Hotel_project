from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.utils.translation import gettext_lazy as _

from django.shortcuts import get_object_or_404
from .models import (
    User, Customer, ProductCategory, Product, Room, Cart, CartItem,
    Order, OrderItem, ChatBot, ChatMessage, Feedback, AIInsight
)
# ============================================================================
# AUTHENTICATION SERIALIZERS
# ============================================================================

class CustomerLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError(_('Must include email and password'))
        
        try:
            customer = Customer.objects.get(email=email)
        except Customer.DoesNotExist:
            raise serializers.ValidationError(_('Invalid credentials'))
        
        if not customer.is_active:
            raise serializers.ValidationError(_('Customer account is inactive'))
        
        if not check_password(password, customer.password):
            raise serializers.ValidationError(_('Invalid credentials'))
        
        attrs['customer'] = customer
        return attrs


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError(_('Must include email and password'))
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(_('Invalid credentials'))
        
        if user.status == 'INACTIVE':
            raise serializers.ValidationError(_('Staff account is inactive'))
        
        if not check_password(password, user.password):
            raise serializers.ValidationError(_('Invalid credentials'))

        attrs['user'] = user
        return attrs


# ============================================================================
# USER MANAGEMENT SERIALIZERS
# ============================================================================

class UserListSerializer(serializers.ModelSerializer):
    """Serializer for admin/staff users - simplified"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'user_id', 'name', 'email', 'phone', 'role', 'role_display',
            'status', 'status_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for creating admin/staff users - simplified"""

    class Meta:
        model = User
        fields = ['name', 'email', 'phone', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Enhanced serializer for updating admin/staff users"""
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['name', 'phone', 'role', 'status', 'password', 'confirm_password']
    
    def validate(self, attrs):
        """Validate password confirmation if password is being updated"""
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError("Passwords don't match.")
        
        return attrs
    
    def validate_email(self, value):
        """Don't allow email updates through this serializer for security"""
        if 'email' in self.initial_data:
            raise serializers.ValidationError("Email cannot be updated through this endpoint.")
        return value
    
    def validate_password(self, value):
        """Validate password strength"""
        if value:  # Only validate if password is provided
            if len(value) < 8:
                raise serializers.ValidationError("Password must be at least 8 characters long.")
            
            has_letter = any(c.isalpha() for c in value)
            has_number = any(c.isdigit() for c in value)
            
            if not has_letter:
                raise serializers.ValidationError("Password must contain at least one letter.")
            if not has_number:
                raise serializers.ValidationError("Password must contain at least one number.")
        
        return value
    
    def update(self, instance, validated_data):
        """Update user instance with optional password change"""
        # Remove confirm_password as it's not needed for update
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset"""
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def validate_new_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        has_letter = any(c.isalpha() for c in value)
        has_number = any(c.isdigit() for c in value)
        
        if not has_letter:
            raise serializers.ValidationError("Password must contain at least one letter.")
        if not has_number:
            raise serializers.ValidationError("Password must contain at least one number.")
        
        return value


# ============================================================================
# CUSTOMER SERIALIZERS
# ============================================================================

class CustomerRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for customer registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'username', 'email', 'first_name', 'last_name', 'phone',
            'gender', 'marital_status', 'location', 'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = Customer.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for customer profile"""
    class Meta:
        model = Customer
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'gender', 'marital_status', 'location', 'created_at', 'updated_at',
            'is_active', 'status'
        ]
        read_only_fields = ['id', 'username', 'created_at', 'updated_at']


# ============================================================================
# PRODUCT AND CATEGORY SERIALIZERS
# ============================================================================

class ProductCategorySerializer(serializers.ModelSerializer):
    """Serializer for product categories"""
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'description', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products"""
    categories = ProductCategorySerializer(many=True, read_only=True)
    category_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'categories', 'category_ids', 'product_code',
            'cost', 'price', 'quantity', 'description', 'image',  # ✅ Added image
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'product_code', 'created_at', 'updated_at']

    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids', [])
        product = Product.objects.create(**validated_data)
        if category_ids:
            product.categories.set(category_ids)
        return product

    def update(self, instance, validated_data):
        category_ids = validated_data.pop('category_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if category_ids is not None:
            instance.categories.set(category_ids)
        return instance


# ============================================================================
# ROOM SERIALIZERS
# ============================================================================

class RoomSerializer(serializers.ModelSerializer):
    """Serializer for rooms"""
    category_display = serializers.CharField(source='get_categories_display', read_only=True)
    
    class Meta:
        model = Room
        fields = [
            'id', 'room_code', 'categories', 'category_display', 'reserved',
            'price_per_night', 'capacity', 'description', 'created_at',
            'updated_at', 'is_active'
        ]


# ============================================================================
# CART AND ORDER SERIALIZERS
# ============================================================================

class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal', 'created_at', 'updated_at']
    
    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
            if product.quantity <= 0:
                raise serializers.ValidationError("Product is out of stock.")
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")
        return value


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart"""
    cart_items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'customer', 'cart_items', 'total_amount', 'total_items', 'created_at', 'updated_at']
        read_only_fields = ['customer']


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    product = ProductSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'subtotal', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders"""
    order_items = OrderItemSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'status', 'status_display',
            'total_amount', 'notes', 'order_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_number', 'customer', 'created_at', 'updated_at']


class CreateOrderSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(write_only=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        user_id = attrs.get('user_id')

        # ✅ Customer IS the user model → look up by id/pk
        customer = get_object_or_404(Customer, id=user_id)

        # Ensure the customer has a cart with items
        try:
            cart = Cart.objects.get(customer=customer)  # or customer_id=user_id
        except Cart.DoesNotExist:
            raise serializers.ValidationError({'cart': 'Cart does not exist.'})

        if not cart.cart_items.exists():
            raise serializers.ValidationError({'cart': 'Cart is empty.'})

        attrs['customer'] = customer
        attrs['cart'] = cart
        return attrs


# ============================================================================
# CHAT AND MESSAGING SERIALIZERS
# ============================================================================

class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    sender_display = serializers.CharField(source='get_sender_display', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'sender', 'sender_display', 'message', 'intent',
            'confidence_score', 'timestamp'
        ]


class ChatBotSerializer(serializers.ModelSerializer):
    """Serializer for chatbot sessions"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    session_status_display = serializers.CharField(source='get_session_status_display', read_only=True)
    
    class Meta:
        model = ChatBot
        fields = [
            'id', 'session_id', 'customer', 'guest_name', 'guest_email',
            'session_status', 'session_status_display', 'messages',
            'created_at', 'updated_at'
        ]


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending messages to chatbot"""
    message = serializers.CharField(max_length=1000)
    session_id = serializers.CharField(required=False)
    guest_name = serializers.CharField(required=False, max_length=100)
    guest_email = serializers.EmailField(required=False)


# ============================================================================
# FEEDBACK SERIALIZERS
# ============================================================================

class FeedbackSerializer(serializers.ModelSerializer):
    """Serializer for customer feedback"""
    customer = CustomerSerializer(read_only=True)
    order = OrderSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    sentiment_display = serializers.CharField(source='get_sentiment_display', read_only=True)
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'customer', 'order', 'room', 'rating', 'rating_display',
            'comment', 'sentiment', 'sentiment_display', 'sentiment_score',
            'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['customer', 'sentiment', 'sentiment_score']


class CreateFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for creating feedback"""
    class Meta:
        model = Feedback
        fields = ['order', 'room', 'rating', 'comment', 'is_public']
    
    def validate(self, attrs):
        if not attrs.get('order') and not attrs.get('room'):
            raise serializers.ValidationError("Feedback must be associated with either an order or room.")
        return attrs


# ============================================================================
# AI INSIGHTS SERIALIZERS
# ============================================================================

class AIInsightSerializer(serializers.ModelSerializer):
    """Serializer for AI insights"""
    insight_type_display = serializers.CharField(source='get_insight_type_display', read_only=True)
    
    class Meta:
        model = AIInsight
        fields = [
            'id', 'insight_type', 'insight_type_display', 'title', 'description',
            'confidence_score', 'data_points', 'action_required', 'is_active',
            'created_at'
        ]
