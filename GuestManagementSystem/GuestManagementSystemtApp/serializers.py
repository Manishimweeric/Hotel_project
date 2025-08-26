from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import date

from .models import Room, RoomReservation

from django.shortcuts import get_object_or_404
from .models import (
    User, Customer, ProductCategory, Product, Room, Cart, CartItem,
    Order, OrderItem, ChatBot, ChatMessage, Feedback, AIInsight,Promotion
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

class OrderDetailSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    items_total = serializers.SerializerMethodField()

    class Meta:
        model = Order
        # include whatever fields your Order has (example below)
        fields = [
            'id', 'order_number', 'status', 'customer', 'created_at', 'updated_at',
            'items_count', 'items_total', 'order_items'
        ]

    def get_items_count(self, obj):
        return obj.order_items.count()

    def get_items_total(self, obj):
        # Sum of item subtotals
        total = sum((oi.subtotal for oi in obj.order_items.all()), start=0)
        # Ensure Decimal result even if no items
        from decimal import Decimal
        return Decimal(total)

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


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'chat_session', 'sender', 'message', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class ChatBotSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ChatBot
        fields = [
            'id', 'session_id', 'customer', 'admin_user',
            'created_at', 'updated_at', 'last_message'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_message']

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-timestamp').first()
        if not msg:
            return None
        return ChatMessageSerializer(msg).data

class ChatBotDetailSerializer(ChatBotSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    guest_first_name = serializers.CharField(source='customer.first_name', read_only=True)
    guest_last_name = serializers.CharField(source='customer.last_name', read_only=True)

    class Meta(ChatBotSerializer.Meta):
        fields = ChatBotSerializer.Meta.fields + [
            'messages',
            'guest_first_name',
            'guest_last_name',
        ]

# ============================================================================
# FEEDBACK SERIALIZERS
# ============================================================================

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'full_name', 'message']  # id is read-only PK
        read_only_fields = ['id']

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


class ReservationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomReservation
        fields = ["status"]  # status-only

    def validate_status(self, value):
        allowed_statuses = dict(RoomReservation.STATUS_CHOICES).keys()
        if value not in allowed_statuses:
            raise serializers.ValidationError("Invalid status value.")
        current = self.instance.status if self.instance else None
        allowed_transitions = {
            "pending": {"confirmed", "canceled"},
            "confirmed": {"checked_in", "canceled"},
            "checked_in": {"checked_out"},
            "checked_out": set(),
            "canceled": set(),
        }
        if current and value != current:
            if value not in allowed_transitions.get(current, set()):
                raise serializers.ValidationError(f"Illegal transition {current} → {value}.")
        return value


class RoomReservationSerializer(serializers.ModelSerializer):
    room_code = serializers.CharField(source='room.room_code', read_only=True)
    guest_first_name = serializers.CharField(source='customer.first_name', read_only=True)
    guest_last_name = serializers.CharField(source='customer.last_name', read_only=True)

    category_display = serializers.CharField(source='room.get_categories_display', read_only=True)
    nights = serializers.IntegerField(read_only=True)

    class Meta:
        model = RoomReservation
        fields = [
            'id', 'room', 'room_code', 'category_display',
            'customer', 'check_in', 'check_out', 'guests',
            'total_amount', 'notes', 'status', 'nights',
            'created_at', 'updated_at','guest_first_name','guest_last_name'
        ]
        read_only_fields = ['total_amount', 'status', 'created_at', 'updated_at']

class CreateRoomReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomReservation
        fields = ['room', 'customer', 'check_in', 'check_out', 'guests', 'notes']

    def validate(self, attrs):
        room: Room = attrs['room']
        check_in: date = attrs['check_in']
        check_out: date = attrs['check_out']
        guests: int = attrs.get('guests', 1)

        if check_in >= check_out:
            raise serializers.ValidationError("check_out must be after check_in.")

        if guests > room.capacity:
            raise serializers.ValidationError(f"Guests exceed room capacity ({room.capacity}).")

        # Prevent overlapping reservations (ignore canceled/checked_out)
        overlap = RoomReservation.objects.filter(
            room=room,
            status__in=['pending', 'confirmed', 'checked_in'],
            check_in__lt=check_out,
            check_out__gt=check_in,
        ).exists()

        if overlap:
            raise serializers.ValidationError("This room is already reserved in the selected date range.")

        return attrs

    def create(self, validated_data):
        room: Room = validated_data['room']
        check_in: date = validated_data['check_in']
        check_out: date = validated_data['check_out']

        nights = (check_out - check_in).days
        total = room.price_per_night * nights

        reservation = RoomReservation.objects.create(
            **validated_data,
            total_amount=total,
            status='confirmed',
        )
        return reservation
    
class UpdateRoomReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomReservation
        fields = ['status', 'notes']

    def update(self, instance, validated_data):
        # Update reservation
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update room reserved status based on new status and dates
        today = timezone.localdate()
        room = instance.room
        
        if instance.status in ['checked_in']:
            # Mark room as reserved when checked in
            if not room.reserved:
                room.reserved = True
                room.save(update_fields=['reserved'])
        elif instance.status in ['checked_out', 'canceled']:
            # Check if room should be unreserved
            has_active_reservations = RoomReservation.objects.filter(
                room=room,
                status__in=['pending', 'confirmed', 'checked_in'],
                check_in__lte=today,
                check_out__gt=today
            ).exclude(id=instance.id).exists()
            
            if not has_active_reservations and room.reserved:
                room.reserved = False
                room.save(update_fields=['reserved'])

        return instance
    


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'title', 'type', 'number_orders', 'promotion', 'created_at', 'updated_at']
