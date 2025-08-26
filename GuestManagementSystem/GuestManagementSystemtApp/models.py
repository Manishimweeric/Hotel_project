from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils import timezone
import uuid
import os
import random
from django.contrib.auth.hashers import make_password, check_password
from django.core.exceptions import ValidationError

def product_image_upload_path(instance, filename):
    # Example: products/PRD20250811ABC12345/image.jpg
    ext = filename.split('.')[-1]
    filename = f"{instance.product_code or uuid.uuid4()}.{ext}"
    return os.path.join('products', filename)

class User(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff Member'),
    ]
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    ]

    user_id = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.user_id:
            self.user_id = f"USR{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"
        super().save(*args, **kwargs)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.name


class Customer(AbstractUser):
    """Extended user model for customers"""

    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    MARITAL_STATUS_CHOICES = [
        ('S', 'Single'),
        ('M', 'Married'),
        ('D', 'Divorced'),
        ('W', 'Widowed'),
    ]
    
    STATUS_CHOICES = [
        ('A', 'Active'),
        ('I', 'Inactive'),
        ('S', 'Suspended'),
    ]

    customer_id = models.CharField(max_length=20, unique=True, editable=False)
    phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(unique=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    marital_status = models.CharField(max_length=1, choices=MARITAL_STATUS_CHOICES, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='A')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='customer_groups', 
    )

    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='customer_user_permissions',  
    )

    def save(self, *args, **kwargs):
        if not self.customer_id:
            random_digits = ''.join([str(random.randint(0, 9)) for _ in range(5)])
            self.customer_id = f"CUST{random_digits}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"
class UserToken(models.Model):
    """Custom token model for User authentication"""
    key = models.CharField(max_length=40, primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_tokens'
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_tokens'
    )
    created = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.generate_key()
        return super().save(*args, **kwargs)
    
    def generate_key(self):
        import binascii
        import os
        return binascii.hexlify(os.urandom(20)).decode()
    
    def __str__(self):
        return self.key


class ProductCategory(models.Model):
    """Product categories"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Product Categories"
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Products available in the hotel"""
    name = models.CharField(max_length=200)
    categories = models.ManyToManyField(ProductCategory, related_name='products')
    product_code = models.CharField(max_length=20, unique=True, editable=False)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to=product_image_upload_path, blank=True, null=True)  
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        if not self.product_code:
            # Generate auto product code
            self.product_code = f"PRD{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.product_code})"


class Room(models.Model):
    """Hotel rooms"""
    CATEGORY_CHOICES = [
        ('G', 'General'),
        ('V', 'VIP'),
        ('S', 'Suite'),
        ('D', 'Deluxe'),
    ]
    
    room_code = models.CharField(max_length=20, unique=True)
    categories = models.CharField(max_length=1, choices=CATEGORY_CHOICES, default='G')
    reserved = models.BooleanField(default=False)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Room {self.room_code} ({self.get_categories_display()})"


class RoomReservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('canceled', 'Canceled'),
    ]

    room = models.ForeignKey('Room', on_delete=models.PROTECT, related_name='reservations')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='room_reservations')
    check_in = models.DateField()
    check_out = models.DateField()
    guests = models.PositiveIntegerField(default=1)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Reservation #{self.id} - Room {self.room.room_code} ({self.check_in} → {self.check_out})"

    @property
    def nights(self) -> int:
        return max((self.check_out - self.check_in).days, 0)


class Cart(models.Model):
    """Shopping cart for customers"""
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cart for {self.customer.username}"
    
    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.cart_items.all())
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.cart_items.all())


class CartItem(models.Model):
    """Items in shopping cart"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['cart', 'product']
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
    @property
    def subtotal(self):
        return self.quantity * self.product.price


class Order(models.Model):
    """Customer orders"""
    STATUS_CHOICES = [
        ('P', 'Pending'),
        ('C', 'Confirmed'),
        ('PR', 'Processing'),
        ('S', 'Shipped'),
        ('D', 'Delivered'),
        ('CA', 'Cancelled'),
        ('R', 'Refunded'),
    ]
    
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default='P')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate auto order number
            self.order_number = f"ORD{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order {self.order_number} - {self.customer.username}"
    
    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    """Items in an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name} (Order: {self.order.order_number})"
    
    @property
    def subtotal(self):
        return self.quantity * self.price


class ChatBot(models.Model):
    """Chatbot conversations and sessions"""
    
    session_id = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE,
        related_name='chat_sessions', null=True, blank=True
    )
    admin_user = models.ForeignKey(
        'auth.User',  # or your custom AdminUser model
        on_delete=models.SET_NULL,
        related_name='admin_chat_sessions',
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        user_name = self.customer.username if self.customer else "Unknown"
        return f"Chat Session {self.session_id} - {user_name}"


class ChatMessage(models.Model):
    """Individual chat messages between customer and admin"""
    SENDER_CHOICES = [
        ('C', 'Customer'),
        ('A', 'Admin'),
    ]
    
    chat_session = models.ForeignKey(
        ChatBot, on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.CharField(max_length=1, choices=SENDER_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_sender_display()}: {self.message[:50]}..."
    
    class Meta:
        ordering = ['timestamp']

class Feedback(models.Model):
    """Simple feedback with only name and message."""
    full_name = models.CharField(max_length=150)
    message = models.TextField()

    def __str__(self):
        return f"{self.full_name}: {self.message[:40]}"


class AIInsight(models.Model):
    """AI-generated insights from feedback and interactions"""
    INSIGHT_TYPES = [
        ('SENTIMENT', 'Sentiment Analysis'),
        ('TREND', 'Trend Analysis'),
        ('RECOMMENDATION', 'Recommendation'),
        ('ALERT', 'Alert'),
    ]
    
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    confidence_score = models.FloatField()
    data_points = models.JSONField(default=dict)  # Store related metrics/data
    action_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"
    
    class Meta:
        ordering = ['-created_at']



class Promotion(models.Model):
    TYPE_CHOICES = [
        ('product', 'Product'),
        ('room', 'Room'),
    ]

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    number_orders = models.PositiveIntegerField(help_text="Number of items/nights this promotion applies to")
    promotion = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} [{self.get_type_display()}]"

    class Meta:
        ordering = ['-created_at'] 