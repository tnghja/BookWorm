import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from "./components/Header.jsx"
import Homepage from "./pages/Homepage.jsx"
import Footer from "./components/Footer.jsx"
// Placeholder pages
const Shop = () => <div className="p-8"><h1 className="text-2xl font-bold">Shop Page</h1></div>
const About = () => <div className="p-8"><h1 className="text-2xl font-bold">About Page</h1></div>
const Cart = () => <div className="p-8"><h1 className="text-2xl font-bold">Cart Page</h1></div>
const SignIn = () => <div className="p-8"><h1 className="text-2xl font-bold">Sign In Page</h1></div>

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/signin" element={<SignIn />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
