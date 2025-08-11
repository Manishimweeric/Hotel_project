
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import Http404
from rest_framework.parsers import MultiPartParser, FormParser

from .models import (
    User, Customer, ProductCategory, Product, Room, Cart, CartItem,
    Order, OrderItem, ChatBot, ChatMessage, Feedback, AIInsight, UserToken
)
from .serializers import (
    CustomerLoginSerializer, UserLoginSerializer, UserSerializer, UserUpdateSerializer,
    PasswordResetSerializer, UserListSerializer, CustomerRegistrationSerializer,
    CustomerSerializer, ProductCategorySerializer, ProductSerializer,
    RoomSerializer, CartSerializer, CartItemSerializer, OrderSerializer,
    CreateOrderSerializer, OrderItemSerializer, ChatBotSerializer,
    ChatMessageSerializer, SendMessageSerializer, FeedbackSerializer,
    CreateFeedbackSerializer, AIInsightSerializer
)


# ============================================================================
# AUTHENTICATION VIEWS
# ============================================================================

class LoginView(APIView):
    """Enhanced login view for both customers and staff using separate serializers"""
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        print(f"Login attempt with data: {data}")

        # Try user (staff) login first
        user_serializer = UserLoginSerializer(data=data)
        if user_serializer.is_valid():
            user = user_serializer.validated_data['user']
            token, created = UserToken.objects.get_or_create(user=user)
            return Response({
                'success': True,
                'message': 'Login successful',
                'token': token.key,
                'user_type': 'staff',
                'user': UserListSerializer(user).data,
                'expires_in': 86400
            }, status=status.HTTP_200_OK)
        
        customer_serializer = CustomerLoginSerializer(data=data)
        if customer_serializer.is_valid():
            customer = customer_serializer.validated_data['customer']
            token, created = UserToken.objects.get_or_create(customer=customer)
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'token': token.key,
                'user_type': 'customer',
                'user': CustomerSerializer(customer).data,
                'customer_id': str(customer.id),
                'expires_in': 86400
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Incorrect email or password'
        }, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """Logout view for both user types"""
    def post(self, request):
        try:
            # Try to delete customer token first
            if hasattr(request.user, 'auth_token'):
                request.user.auth_token.delete()
            # Try to delete staff token
            elif hasattr(request.user, 'auth_token'):
                request.user.auth_token.delete()
            return Response({'message': 'Successfully logged out'})
        except Exception:
            return Response({'message': 'Successfully logged out'})

# ============================================================================
# USER MANAGEMENT VIEWS (STAFF)
# ============================================================================

class UserListCreateView(generics.ListCreateAPIView):
    """List all users or create a new user"""
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserSerializer
        return UserListSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a user"""
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserListSerializer


class PasswordResetView(APIView):
    """Reset user password"""
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = PasswordResetSerializer(data=request.data)
            if serializer.is_valid():
                new_password = serializer.validated_data['new_password']
                user.set_password(new_password)
                user.save()
                return Response({'message': 'Password reset successfully'})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# ============================================================================
# CUSTOMER VIEWS
# ============================================================================

class CustomerRegistrationView(generics.CreateAPIView):
    """Customer registration"""
    queryset = Customer.objects.all()
    serializer_class = CustomerRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CustomerProfileView(generics.RetrieveUpdateAPIView):
    """Customer profile management"""
    serializer_class = CustomerSerializer
    
    def get_object(self):
        return self.request.user


class CustomerListView(generics.ListAPIView):
    """List all customers (Admin only)"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


# ============================================================================
# PRODUCT CATEGORY VIEWS
# ============================================================================

class ProductCategoryListCreateView(generics.ListCreateAPIView):
    """List all categories or create new category"""
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer


class ProductCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a category"""
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer


# ============================================================================
# PRODUCT VIEWS
# ============================================================================


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    parser_classes = (MultiPartParser, FormParser)  # ✅ Allows image upload

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(categories__id=category)
        return queryset


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    parser_classes = (MultiPartParser, FormParser)  # ✅ 


# ============================================================================
# ROOM VIEWS
# ============================================================================

class RoomListCreateView(generics.ListCreateAPIView):
    """List all rooms (active and inactive) or create new room"""
    queryset = Room.objects.all()  # Show all rooms regardless of is_active
    serializer_class = RoomSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        available = self.request.query_params.get('available', None)
        category = self.request.query_params.get('category', None)

        if available == 'true':
            queryset = queryset.filter(reserved=False)
        if category:
            queryset = queryset.filter(categories=category)
        return queryset


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a room"""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


# ============================================================================
# CART VIEWS
# ============================================================================

class CartView(APIView):
    """Get current user's cart"""
    def get(self, request):
        cart, created = Cart.objects.get_or_create(customer=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemListCreateView(APIView):
    """Add item to cart or list cart items"""
    def get(self, request):
        cart, created = Cart.objects.get_or_create(customer=request.user)
        items = cart.cart_items.all()
        serializer = CartItemSerializer(items, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        cart, created = Cart.objects.get_or_create(customer=request.user)
        
        # Check if item already exists in cart
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
            cart_item.quantity += quantity
            cart_item.save()
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data)
        except CartItem.DoesNotExist:
            request.data['cart'] = cart.id
            serializer = CartItemSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(cart=cart)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Update or delete cart item"""
    serializer_class = CartItemSerializer
    
    def get_queryset(self):
        cart = get_object_or_404(Cart, customer=self.request.user)
        return CartItem.objects.filter(cart=cart)


class ClearCartView(APIView):
    """Clear all items from cart"""
    def delete(self, request):
        cart = get_object_or_404(Cart, customer=request.user)
        cart.cart_items.all().delete()
        return Response({'message': 'Cart cleared successfully'})


# ============================================================================
# ORDER VIEWS
# ============================================================================

class OrderListCreateView(generics.ListCreateAPIView):
    """List customer orders or create new order"""
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateOrderSerializer
        return OrderSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                # Get user's cart
                cart = get_object_or_404(Cart, customer=request.user)
                cart_items = cart.cart_items.all()
                
                if not cart_items.exists():
                    return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Create order
                order = Order.objects.create(
                    customer=request.user,
                    total_amount=cart.total_amount,
                    notes=serializer.validated_data.get('notes', '')
                )
                
                # Create order items
                for cart_item in cart_items:
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        price=cart_item.product.price
                    )
                    
                    # Update product quantity
                    product = cart_item.product
                    product.quantity -= cart_item.quantity
                    product.save()
                
                # Clear cart
                cart_items.delete()
                
                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(generics.RetrieveAPIView):
    """Retrieve order details"""
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)


class AllOrdersView(generics.ListAPIView):
    """List all orders (Admin only)"""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer


class UpdateOrderStatusView(APIView):
    """Update order status (Admin only)"""
    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        status_value = request.data.get('status')
        
        if status_value not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = status_value
        order.save()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)


# ============================================================================
# CHAT VIEWS
# ============================================================================

class ChatSessionView(APIView):
    """Start or get chat session"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        import uuid
        session_id = str(uuid.uuid4())
        
        chat_session = ChatBot.objects.create(
            session_id=session_id,
            customer=request.user if request.user.is_authenticated else None,
            guest_name=request.data.get('guest_name'),
            guest_email=request.data.get('guest_email')
        )
        
        serializer = ChatBotSerializer(chat_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SendMessageView(APIView):
    """Send message to chatbot"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data['session_id']
            message_text = serializer.validated_data['message']
            
            try:
                chat_session = ChatBot.objects.get(session_id=session_id)
                
                # Create user message
                user_message = ChatMessage.objects.create(
                    chat_session=chat_session,
                    sender='U',
                    message=message_text
                )
                
                # Simple bot response (you can integrate with actual AI here)
                bot_response = self.generate_bot_response(message_text)
                
                bot_message = ChatMessage.objects.create(
                    chat_session=chat_session,
                    sender='B',
                    message=bot_response,
                    intent='general',
                    confidence_score=0.8
                )
                
                return Response({
                    'user_message': ChatMessageSerializer(user_message).data,
                    'bot_response': ChatMessageSerializer(bot_message).data
                })
                
            except ChatBot.DoesNotExist:
                return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def generate_bot_response(self, message):
        """Generate simple bot response - integrate with AI service"""
        message_lower = message.lower()
        
        if 'hello' in message_lower or 'hi' in message_lower:
            return "Hello! Welcome to our hotel. How can I assist you today?"
        elif 'room' in message_lower:
            return "I can help you with room bookings. What type of room are you looking for?"
        elif 'price' in message_lower or 'cost' in message_lower:
            return "Our room prices vary by category. Would you like me to show you our current rates?"
        elif 'book' in message_lower:
            return "I'd be happy to help you with a booking. Let me connect you with our booking system."
        else:
            return "Thank you for your message. Let me help you with that. Could you please provide more details?"


class ChatHistoryView(generics.RetrieveAPIView):
    """Get chat session history"""
    queryset = ChatBot.objects.all()
    serializer_class = ChatBotSerializer
    lookup_field = 'session_id'


# ============================================================================
# FEEDBACK VIEWS
# ============================================================================

class FeedbackListCreateView(generics.ListCreateAPIView):
    """List feedback or create new feedback"""
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Feedback.objects.none()
        return Feedback.objects.filter(customer=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateFeedbackSerializer
        return FeedbackSerializer
    
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class AllFeedbackView(generics.ListAPIView):
    """List all feedback (Admin only)"""
    queryset = Feedback.objects.filter(is_public=True)
    serializer_class = FeedbackSerializer


class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete feedback"""
    serializer_class = FeedbackSerializer
    
    def get_queryset(self):
        return Feedback.objects.filter(customer=self.request.user)


# ============================================================================
# AI INSIGHTS VIEWS
# ============================================================================

class AIInsightListView(generics.ListAPIView):
    """List AI insights (Admin only)"""
    queryset = AIInsight.objects.filter(is_active=True)
    serializer_class = AIInsightSerializer


class AIInsightDetailView(generics.RetrieveAPIView):
    """Get specific AI insight"""
    queryset = AIInsight.objects.all()
    serializer_class = AIInsightSerializer


# ============================================================================
# DASHBOARD AND UTILITY VIEWS
# ============================================================================

@api_view(['GET'])
def dashboard_stats(request):
    """Get dashboard statistics"""
    stats = {
        'total_customers': Customer.objects.count(),
        'total_orders': Order.objects.count(),
        'total_products': Product.objects.filter(is_active=True).count(),
        'total_rooms': Room.objects.filter(is_active=True).count(),
        'active_chat_sessions': ChatBot.objects.filter(session_status='A').count(),
        'recent_feedback_count': Feedback.objects.filter(created_at__date=timezone.now().date()).count(),
    }
    return Response(stats)


from django.db import models

@api_view(['GET'])
def search_products(request):
    """Search products by name or description"""
    query = request.GET.get('q', '')
    if query:
        products = Product.objects.filter(
            models.Q(name__icontains=query) | 
            models.Q(description__icontains=query),
            is_active=True
        )
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    return Response([])


@api_view(['GET'])
def search_rooms(request):
    """Search available rooms"""
    category = request.GET.get('category', '')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    
    rooms = Room.objects.filter(is_active=True, reserved=False)
    
    if category:
        rooms = rooms.filter(categories=category)
    if min_price:
        rooms = rooms.filter(price_per_night__gte=min_price)
    if max_price:
        rooms = rooms.filter(price_per_night__lte=max_price)
    
    serializer = RoomSerializer(rooms, many=True)
    return Response(serializer.data)