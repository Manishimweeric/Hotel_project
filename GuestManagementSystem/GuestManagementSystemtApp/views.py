
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
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework import status as http_status
from django.core.mail import send_mail

from .models import (
    User, Customer, ProductCategory, Product, Room, Cart, CartItem,
    Order, OrderItem, ChatBot, ChatMessage, Feedback, AIInsight, UserToken,RoomReservation,Promotion
)
from .serializers import (
    CustomerLoginSerializer, UserLoginSerializer, UserSerializer, UserUpdateSerializer,
    PasswordResetSerializer, UserListSerializer, CustomerRegistrationSerializer,
    CustomerSerializer, ProductCategorySerializer, ProductSerializer,
    RoomSerializer, CartSerializer, CartItemSerializer, OrderSerializer,
    CreateOrderSerializer, OrderItemSerializer, ChatBotSerializer,
    ChatMessageSerializer, FeedbackSerializer,ChatBotDetailSerializer,
    AIInsightSerializer,RoomReservationSerializer,
    CreateRoomReservationSerializer,UpdateRoomReservationSerializer,PromotionSerializer,ReservationStatusUpdateSerializer
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
    parser_classes = (MultiPartParser, FormParser)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # If "replenish_quantity" is provided in request, add it instead of replacing
        replenish_qty = request.data.get('replenish_quantity')
        if replenish_qty is not None:
            try:
                replenish_qty = int(replenish_qty)
            except ValueError:
                return Response({"error": "replenish_quantity must be an integer"},
                                status=status.HTTP_400_BAD_REQUEST)

            # Add replenishment
            instance.quantity += replenish_qty
            instance.save()

            serializer = self.get_serializer(instance)
            return Response(serializer.data)

        # Otherwise, proceed with normal update (replace 


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


class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific reservation.
    """
    serializer_class = RoomReservationSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return RoomReservation.objects.select_related('room', 'customer')

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateRoomReservationSerializer
        return RoomReservationSerializer



class AllReservationView(APIView):
    def get(self, request):
        reservations = RoomReservation.objects.select_related('room').order_by('-created_at')
        serializer = RoomReservationSerializer(reservations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ReservationListCreateView(generics.ListCreateAPIView):
    """
    List current user's reservations (filter by ?user_id=) or create a reservation.
    Mirrors OrderListCreateView style.
    """
    serializer_class = RoomReservationSerializer  # overridden on POST


    def all_Reservation(self):
        return RoomReservation.objects.select_related('room').order_by('-created_at')

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if not user_id:
            return RoomReservation.objects.none()
        return RoomReservation.objects.filter(customer_id=user_id).select_related('room')
    


    def get_serializer_class(self):
        return CreateRoomReservationSerializer if self.request.method == 'POST' else RoomReservationSerializer
    
    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        reservation: RoomReservation = self.get_object()
        partial = kwargs.pop('partial', True)

        # Use status-only serializer
        serializer = ReservationStatusUpdateSerializer(
            reservation, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Side effects on room.reserved flag based on new state
        room = reservation.room
        if not room.reserved:
                room.reserved = True
                room.save(update_fields=['reserved'])

        # Return full reservation payload
        return Response(RoomReservationSerializer(reservation).data, status=status.HTTP_200_OK)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()
        today = timezone.localdate()
        room = reservation.room
        if not room.reserved:
            room.reserved = True
            room.save(update_fields=['reserved'])
        
        is_currently_occupied = reservation.check_in <= today < reservation.check_out
        if is_currently_occupied and not room.reserved:
            room.reserved = True
            room.save(update_fields=['reserved'])

        out = RoomReservationSerializer(reservation)
        return Response(out.data, status=status.HTTP_201_CREATED)


class ReservationStatusUpdateView(generics.UpdateAPIView):
    """
    PATCH /reservations/<pk>/status/
    Body: { "status": "<pending|confirmed|checked_in|checked_out|canceled>" }
    """
    queryset = RoomReservation.objects.select_related("room")
    serializer_class = ReservationStatusUpdateSerializer
    http_method_names = ["patch"]  # status-only endpoint

    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        reservation = self.get_object()
        serializer = self.get_serializer(reservation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Optional side-effect: keep room.reserved flag in sync
        room = reservation.room
        if reservation.status in ("confirmed", "checked_in") and not room.reserved:
            room.reserved = True
            room.save(update_fields=["reserved"])
        elif reservation.status in ("checked_out", "canceled") and room.reserved:
            # Free the room only if there is no other active reservation
            has_active = room.reservations.filter(
                status__in=["pending", "confirmed", "checked_in"]
            ).exclude(pk=reservation.pk).exists()
            if not has_active:
                room.reserved = False
                room.save(update_fields=["reserved"])

        # Return the full reservation payload
        return Response(RoomReservationSerializer(reservation).data, status=status.HTTP_200_OK)

class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve/Update/Cancel a reservation (DELETE = soft-cancel).
    - Update is limited to notes/status by default unless you broaden serializer.
    - Deleting marks status='canceled' instead of hard delete, and may free the room.reserved flag.
    """
    serializer_class = RoomReservationSerializer

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if not user_id:
            return RoomReservation.objects.none()
        return RoomReservation.objects.filter(customer_id=user_id).select_related('room')

    def perform_destroy(self, instance: RoomReservation):
        # Soft cancel
        instance.status = 'canceled'
        instance.save(update_fields=['status', 'updated_at'])

        # If no other active reservations overlap today, free the room.reserved flag
        room = instance.room
        today = timezone.localdate()
        still_occupied = RoomReservation.objects.filter(
            room=room,
            status__in=['pending', 'confirmed', 'checked_in'],
            check_in__lte=today,
            check_out__gt=today,
        ).exists()

        if room.reserved and not still_occupied:
            room.reserved = False
            room.save(update_fields=['reserved'])

# ============================================================================
# CART VIEWS
# ============================================================================
class CartView(APIView):
    """Get cart for a given user_id"""

    def get(self, request):
        user_id = request.query_params.get("user_id")  # 👈 expect user_id in query
        if not user_id:
            return Response({"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        customer = get_object_or_404(Customer, id=user_id)
        cart, _ = Cart.objects.get_or_create(customer=customer)

        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CartItemListCreateView(APIView):
    """Add item to cart or list cart items"""

    def _get_or_create_cart(self, user_id):
        # Fetch Customer using user_id
        customer = get_object_or_404(Customer, id=user_id)
        cart, _ = Cart.objects.get_or_create(customer=customer)
        return cart

    def get(self, request):
        user_id = request.query_params.get("user_id")  # 👈 allow user_id in query
        if not user_id:
            return Response({"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        cart = self._get_or_create_cart(user_id)
        items = cart.cart_items.all()
        serializer = CartItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        cart = self._get_or_create_cart(user_id)

        product_id = request.data.get("product_id")
        try:
            quantity = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            return Response({"detail": "quantity must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            return Response({"detail": "quantity must be > 0"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        # Add or update cart item
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if created:
            cart_item.quantity = quantity
        else:
            cart_item.quantity += quantity
        cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    
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
    serializer_class = OrderSerializer  # overridden for POST below

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if not user_id:
            return Order.objects.none()
        return Order.objects.filter(customer_id=user_id)  # ✅

    def get_serializer_class(self):
        return CreateOrderSerializer if self.request.method == 'POST' else OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data) 
        serializer.is_valid(raise_exception=True)

        customer = serializer.validated_data['customer']
        cart = serializer.validated_data['cart']
        notes = serializer.validated_data.get('notes', '')

        from django.db import transaction
        with transaction.atomic():
            order = Order.objects.create(
                customer=customer,
                total_amount=cart.total_amount,
                notes=notes,
            )

            cart_items = cart.cart_items.select_related('product')
            # create order items + decrement stock
            from .models import OrderItem
            bulk = []
            for ci in cart_items:
                bulk.append(OrderItem(
                    order=order,
                    product=ci.product,
                    quantity=ci.quantity,
                    price=ci.product.price,
                ))
                ci.product.quantity = max(0, ci.product.quantity - ci.quantity)
                ci.product.save(update_fields=['quantity'])
            OrderItem.objects.bulk_create(bulk)

            cart_items.delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if not user_id:
            return Order.objects.none()
        return Order.objects.filter(customer_id=user_id)  # ✅



# views.py
from rest_framework import generics, permissions
from django.db.models import Prefetch
from .models import Order, OrderItem
from .serializers import OrderDetailSerializer, OrderSerializer  

class OrderDetailView(generics.RetrieveAPIView):
    """
    Get a single order (with items).
    - If ?user_id is provided, scope to that customer (good for customer-side).
    - If no ?user_id and the requester is staff, allow access (admin-side).
    """
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        base_qs = (
            Order.objects
            .select_related('customer')
            .prefetch_related(
                Prefetch('order_items', queryset=OrderItem.objects.select_related('product').order_by('created_at'))
            )
            .order_by('-created_at')
        )

        user_id = self.request.query_params.get("user_id")
        if user_id:
            return base_qs.filter(customer_id=user_id)

        # If no user_id, only allow staff/admin to reach any order
        if self.request.user and self.request.user.is_staff:
            return base_qs

        # Non-staff without user_id can't see anything
        return Order.objects.none()


class AllOrdersView(generics.ListAPIView):
    """List all orders (Admin only)"""
    serializer_class = OrderSerializer
    queryset = (
        Order.objects
        .prefetch_related('order_items')
        .order_by('-created_at')  # default order by newest
    )

    # Optional: enable ?ordering=created_at or -created_at (and others)
    from rest_framework.filters import OrderingFilter, SearchFilter
    filter_backends = [OrderingFilter, SearchFilter]
    ordering_fields = ['created_at', 'status']  # add fields you need
    search_fields = ['order_number', 'customer__username', 'customer__first_name', 'customer__last_name']




from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as http_status

from .models import Order
from .serializers import OrderSerializer


class UpdateOrderStatusView(APIView):
    """Update order status (Admin only) and notify customer via email"""

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        status_value = request.data.get('status')

        # Validate status
        if status_value not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=http_status.HTTP_400_BAD_REQUEST)

        # Update status
        order.status = status_value
        order.save()

        # Prepare email recipient (supports order.customer or order.user)
        customer = getattr(order, 'customer', None) or getattr(order, 'user', None)
        customer_email = getattr(customer, 'email', None)
        customer_first_name = (getattr(customer, 'first_name', None) or '').strip() or 'Customer'

        # Use human-friendly status label if available
        try:
            status_label = order.get_status_display()
        except Exception:
            status_label = status_value.upper()

        email_sent = False
        email_error = None

        if customer_email:
            try:
                send_mail(
                    subject='Your Order Status Updated',
                    message=(
                        f"Dear {customer_first_name},\n\n"
                        f"Your order #{order.id} status has been updated to: {status_label}.\n\n"
                        "Thank you for choosing Guest Management System . We appreciate your trust and look forward to serving you.\n\n"
                        "Best regards,\n"
                        "The Guest Management System Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[customer_email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as e:
                # Order status is already updated; surface email failure but keep 200
                email_error = str(e)

        serializer = OrderSerializer(order)
        payload = {
            'order': serializer.data,
            'message': f'Order status updated to {status_label}',
            'email_sent': email_sent
        }
        if email_error:
            payload['email_error'] = f'Failed to send email: {email_error}'

        return Response(payload, status=http_status.HTTP_200_OK)


# ============================================================================
# CHAT VIEWS
# ============================================================================

class ChatSessionListCreateView(generics.ListCreateAPIView):
    """List all chat sessions or create a new one"""
    queryset = ChatBot.objects.all().order_by('-updated_at')
    serializer_class = ChatBotSerializer


class ChatSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a chat session"""
    queryset = ChatBot.objects.all()
    serializer_class = ChatBotDetailSerializer


class ChatMessageListCreateView(generics.ListCreateAPIView):
    """List or create messages (filter by chat_session if ?chat_session=id)"""
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        chat_session = self.request.query_params.get("chat_session")
        qs = ChatMessage.objects.all().order_by("timestamp")
        if chat_session:
            qs = qs.filter(chat_session_id=chat_session)
        return qs


class ChatSessionMessagesView(generics.ListAPIView):
    """List all messages in a specific chat session"""
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        session_id = self.kwargs['pk']
        return ChatMessage.objects.filter(chat_session_id=session_id).order_by("timestamp")


class ChatSessionSendMessageView(APIView):
    """Send a message to a specific chat session"""

    def post(self, request, pk):
        try:
            session = ChatBot.objects.get(pk=pk)
        except ChatBot.DoesNotExist:
            return Response({"detail": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND)

        data = {
            "chat_session": session.id,
            "sender": request.data.get("sender"),
            "message": request.data.get("message"),
        }
        serializer = ChatMessageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
# ============================================================================
# FEEDBACK VIEWS
# ============================================================================

class FeedbackListCreateView(generics.ListCreateAPIView):
    """
    GET: List feedback
    POST: Create feedback (name + message only)
    """
    queryset = Feedback.objects.all().order_by('-id')
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.AllowAny] 


class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a single feedback
    PUT/PATCH/DELETE: Admin only
    """
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.AllowAny()]
        return [permissions.AllowAny()]


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


class PromotionListCreateView(generics.ListCreateAPIView):
    """
    GET: List promotions (search/order supported)
    POST: Create a promotion (admin only by default)
    """
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'type']                # ?search=room
    ordering_fields = ['created_at', 'number_orders']  # ?ordering=-promotion



class PromotionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a promotion
    PUT/PATCH/DELETE: Update/remove (admin only)
    """
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.AllowAny()]
        return [permissions.AllowAny()]