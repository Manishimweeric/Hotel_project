from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Authentication URLs
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    
    # User Management URLs (Staff/Admin)
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/reset-password/', views.PasswordResetView.as_view(), name='user-password-reset'),
    
    # Customer URLs
    path('customers/register/', views.CustomerRegistrationView.as_view(), name='customer-register'),
    path('customers/profile/', views.CustomerProfileView.as_view(), name='customer-profile'),
    path('customers/', views.CustomerListView.as_view(), name='customer-list'),
    
    # Product Category URLs
    path('categories/', views.ProductCategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', views.ProductCategoryDetailView.as_view(), name='category-detail'),
    
    # Product URLs
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/search/', views.search_products, name='product-search'),
  
    # Room URLs
    path('rooms/', views.RoomListCreateView.as_view(), name='room-list-create'),
    path('rooms/<int:pk>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('rooms/search/', views.search_rooms, name='room-search'),
    
    # Cart URLs
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/items/', views.CartItemListCreateView.as_view(), name='cart-item-list-create'),
    path('cart/items/<int:pk>/', views.CartItemDetailView.as_view(), name='cart-item-detail'),
    path('cart/clear/', views.ClearCartView.as_view(), name='cart-clear'),
    
    # Order URLs
    path('orders/', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/status/', views.UpdateOrderStatusView.as_view(), name='order-status-update'),
    path('admin/orders/', views.AllOrdersView.as_view(), name='admin-order-list'),
    
    # Chat URLs
    path('chat/sessions/', views.ChatSessionListCreateView.as_view(), name='chat-session-list-create'),
    path('chat/sessions/<int:pk>/', views.ChatSessionDetailView.as_view(), name='chat-session-detail'),

    # Chat messages (global list/create)
    path('chat/messages/', views.ChatMessageListCreateView.as_view(), name='chat-message-list-create'),

    # Messages within a session
    path('chat/sessions/<int:pk>/messages/', views.ChatSessionMessagesView.as_view(), name='chat-session-messages'),
    path('chat/sessions/<int:pk>/send/', views.ChatSessionSendMessageView.as_view(), name='chat-session-send'),
    # Feedback URLs
    path('feedback/', views.FeedbackListCreateView.as_view(), name='feedback-list-create'),
    path('feedback/<int:pk>/', views.FeedbackDetailView.as_view(), name='feedback-detail'),
    
    # AI Insights URLs
    path('insights/', views.AIInsightListView.as_view(), name='insight-list'),
    path('insights/<int:pk>/', views.AIInsightDetailView.as_view(), name='insight-detail'),
    
    # Dashboard URLs
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),

    path('reservations/', views.ReservationListCreateView.as_view(), name='reservation-list-create'),
    path('reservations/<int:pk>/', views.ReservationDetailView.as_view(), name='reservation-detail'),
    path("reservations/<int:pk>/status/",views.ReservationStatusUpdateView.as_view(),name="reservation-status-update",),
    
    path('reservations/all_Reservation/', views.AllReservationView.as_view(), name='all-reservations'),

    path('promotions/', views.PromotionListCreateView.as_view(), name='promotion-list-create'),
    path('promotions/<int:pk>/', views.PromotionDetailView.as_view(), name='promotion-detail'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
