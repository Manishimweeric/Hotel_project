
import { Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/autho/login';
import Layout from './components/layout/layout';
import CustomerSignupPage from './components/autho/CustomerSignup';
import ViewCustomer from './components/customer/ViewCustomer';
import UsersManagement from './components/User/UsersManagement';
import Rooms from './components/Room/Rooms';
import AvailableRooms from './components/Room/AvailableRooms';
import ProductManagement from './components/product/ProductManagement';
import CategoryManagement from './components/product/CategoryManagement';
import HotelLanding from './components/Hotel/HotelLanding';
import ProductReport from './components/product/productReport';
import OrderManagement from './components/Order/OrderManagement'
import RoomsReservation from './components/Room/RoomsReservation';
import ReservationManagement from './components/Room/ReservationManagement';
import Dashboard from './components/Dashboard';
import PromotionManagement from './components/Promotion/PromotionManagement';
import FeedbackManagement from './components/Feedback/FeedbackManagement';
import CustomerChat from './components/customer/CustomerChat';
import AdminChatDashboard from './components/Chart/AdminChatDashboard';
import CustomerOrders from './components/Order/CustomerOrders';
import CustomerRecommendations from './components/Order/CustomerRecommendations';
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HotelLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={<Layout />}></Route>
        <Route path="/Customersignup" element={<CustomerSignupPage />} />
        <Route path="/roomsReservation" element={<RoomsReservation />} />
        <Route path="/customerChat" element={<CustomerChat />} />
        <Route path="/CustomerOrders" element={<CustomerOrders />} />
        <Route path="/customerRecommendations" element={<CustomerRecommendations />} />

        <Route path="/dashboard" element={<Layout />}>
          <Route path="Admin-dashboard" element={<Dashboard />}></Route>
          <Route path="customers" element={<ViewCustomer />}></Route>
          <Route path="users" element={<UsersManagement />}></Route>
          <Route path="rooms" element={<Rooms />}></Route>
          <Route path="available-rooms" element={<AvailableRooms />}></Route>
          <Route path="products" element={<ProductManagement />}></Route>
          <Route path="categories" element={<CategoryManagement />}></Route>
          <Route path="productreports" element={<ProductReport />}></Route>
          <Route path="orderManagement" element={<OrderManagement />}></Route>
          <Route path="reservationManagement" element={<ReservationManagement />}></Route>
          <Route path="promotionManagement" element={<PromotionManagement />}></Route>
          <Route path="feedbackManagement" element={<FeedbackManagement />}></Route>
          <Route path="adminChatDashboard" element={<AdminChatDashboard />}></Route>

        </Route>
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="light"
        toastStyle={{
          backgroundColor: '#ffffff',
          color: '#333333',
          borderRadius: '8px',
          border: '1px solid #ddd',
          padding: '16px',
          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
          maxWidth: '700px',
          minWidth: '200px',
          fontSize: '16px',
        }}
      />
    </>
  );
}

export default App;
