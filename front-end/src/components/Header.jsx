import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function Header() {
  const [activeLink, setActiveLink] = useState('home')
  
  const navLinks = [
    { id: 'home', name: 'Home', path: '/' },
    { id: 'shop', name: 'Shop', path: '/shop' },
    { id: 'about', name: 'About', path: '/about' },
    { id: 'cart', name: 'Cart (0)', path: '/cart' },
    { id: 'signin', name: 'Sign in', path: '/signin' }
  ]
  
  const handleClick = (id) => {
    setActiveLink(id)
  }

  return (
    <div className="top-0 left-0 flex justify-between h-16 items-center bg-cyan-100">
      {/* Logo */}
      <div className="flex items-center ml-1.5">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-1">
            <img src={logo} alt="BookWorm Logo" className="w-10 h-10" />
            <span className="ml-2 text-lg font-bold text-gray-800">BOOKWORM</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex space-x-8 gap-0.5">
        {navLinks.map((link) => (
          <Link 
            key={link.id}
            to={link.path} 
            className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
              activeLink === link.id 
                ? 'bg-blue-700 text-white' 
                : 'text-gray-500 hover:text-white hover:bg-blue-400'
            }`}
            onClick={() => handleClick(link.id)}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
