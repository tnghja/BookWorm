import React from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import './App.css'
import Header from "./components/Header.jsx"
import Homepage from "./pages/Homepage.jsx"
import ListProduct from "./pages/ListProduct.jsx"
import Footer from "./components/Footer.jsx"
import BookPage from "./pages/BookPage.jsx"
import CartPage from './pages/CartPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage.jsx'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { CurrencyProvider } from './components/context/CurrencyContext'
const queryClient = new QueryClient()


// Layout component that wraps the content
const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
      <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/shop" element={<ListProduct />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/signin" element={<LoginPage />} />
          <Route path="/product/:id" element={<BookPage/>} />
          <Route path="/cart" element={<CartPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
      </CurrencyProvider>
    </QueryClientProvider>
    
  )
}

export default App

