import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import App from './App.jsx'
import store from './radux/Store'
import Navbar from './pages/componant/Navbar'
import Footer from './pages/componant/Footer'  // ✅ استيراد Footer
import './index.css'
import Login from './pages/login'
import Contact from './pages/Contac'
import About from './pages/About'
import Register from './pages/Register'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Datamaneg from './pages/Datamaneg'
import AddProduct from './pages/AddProduct'
import DataUsers from './pages/DataUsers'
import AddAd from './pages/AddAd'
import DataProducts from './pages/DataProducts'
import DataReports from './pages/DataReports'
import DataAds from './pages/DataAds'
import DataBids from './pages/DataBids'
import EditProduct from './pages/EditProduct'
import AddReport from './pages/AddReport'
import AdminShowUsers from './pages/AdminShowUsers'
import AddUsers from './pages/AddUsers'
import EditUser from './pages/EditUser'
import EditReport from './pages/EditReport'
import EditAd from './pages/Editad.jsx'
import Myprodect from './pages/Myprodect.jsx'
import MyPurchases from './pages/MyPurchases.jsx'
import Reportdelivery from './pages/Reportdelivery.jsx'

// ✅ استيراد مكونات التاجر الفرعية
import MerchantProducts from './pages/MerchantProducts'
import MerchantBids from './pages/MerchantBids'
import MerchantOrders from './pages/MerchantOrders'

import AuctionPage from './pages/bid.jsx'
import ProductDetailsFixed from './pages/productroom.jsx'
import Bid from './pages/bidroom.jsx'
import FixedPriceProducts from './pages/productsals.jsx'
import MyBids from './pages/mybid.jsx'
import MerchantAddProduct from './pages/MerchantProductsadd.jsx'

// ✅ مكون Wrapper لتغليف الصفحات بالـ Navbar والـ Footer
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <Routes>
          {/* ✅ استخدام Layout لجميع الصفحات */}
          <Route path='/' element={
            <Layout>
              <App />
            </Layout>
          } />

          <Route path='Report-delivery' element={
            <Layout>
              <Reportdelivery />
            </Layout>
          } />

          {/* ============================================= */}
          {/* ✅ مسارات التاجر (Myprodect) مع Routes فرعية */}
          {/* ============================================= */}
          <Route path='/my-products' element={
            <Layout>
              <Myprodect />
            </Layout>
          }>
            <Route path='my-purchases' element={<MyPurchases />} />
            <Route path='add-product' element={<MerchantAddProduct />} />
            <Route path='my-bids' element={<MyBids />} />
            <Route path='products' element={<MerchantProducts />} />
            <Route path='bids' element={<MerchantBids />} />
            <Route path='orders' element={<MerchantOrders />} />
            <Route path='edit-product/:id' element={<EditProduct />} />
          </Route>

          {/* ============================================= */}
          {/* ✅ مسارات المزادات والمنتجات */}
          {/* ============================================= */}
          <Route path='/bid' element={
            <Layout>
              <AuctionPage />
            </Layout>
          } />
          <Route path='/active/:id' element={
            <Layout>
              <Bid />
            </Layout>
          } />
          <Route path='/sold/:id' element={
            <Layout>
              <ProductDetailsFixed />
            </Layout>
          } />
          <Route path='/products' element={
            <Layout>
              <FixedPriceProducts />
            </Layout>
          } />

          {/* ============================================= */}
          {/* ✅ مسارات المصادقة */}
          {/* ============================================= */}
          <Route path='/login' element={
            <Layout>
              <Login />
            </Layout>
          } />
          <Route path='/Register' element={
            <Layout>
              <Register />
            </Layout>
          } />
          <Route path='/profile' element={
            <Layout>
              <Profile />
            </Layout>
          } />
          <Route path='/edit-profile' element={
            <Layout>
              <EditProfile />
            </Layout>
          } />
          <Route path='/About' element={
            <Layout>
              <About />
            </Layout>
          } />
          <Route path='/Contact' element={
            <Layout>
              <Contact />
            </Layout>
          } />

          {/* ============================================= */}
          {/* ✅ مسارات المشرف (Datamaneg) */}
          {/* ============================================= */}
          <Route path='/datamaneg' element={
            <Layout>
              <Datamaneg />
            </Layout>
          }>
            <Route path='users' element={<DataUsers />} />
            <Route path='add-user' element={<AddUsers />} />
            <Route path='add-product' element={<AddProduct />} />
            <Route path='add-ad' element={<AddAd />} />
            <Route path='add-report' element={<AddReport />} />
            <Route path='products' element={<DataProducts />} />
            <Route path='reports' element={<DataReports />} />
            <Route path='ads' element={<DataAds />} />
            <Route path='bids' element={<DataBids />} />
            <Route path='edit-product/:id' element={<EditProduct />} />
            <Route path='edit-report/:id' element={<EditReport />} />
            <Route path='edit-ad/:id' element={<EditAd />} />
            <Route path='edit-User/:user_name' element={<EditUser />} />
          </Route>

        </Routes>
      </Router>
    </Provider>
  </StrictMode>,
)