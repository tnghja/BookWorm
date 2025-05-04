import { useState, useEffect } from 'react'; // Removed useCallback as it wasn't used
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { Menu, X, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Keep Dropdown imports

import SignInForm from './SignInForm'; // Keep SignInForm import
import { useAuth } from './context/AuthContext'; // Keep useAuth import - path might need adjustment
import { useCartStore } from '@/store/cartStore'; // Keep useCartStore import

export default function Header() {
  const [activeLink, setActiveLink] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const items = useCartStore((state) => state.items);
  const [showSignIn, setShowSignIn] = useState(false);
  // Dynamic Cart link text based on items length
  const cartLinkText = `Cart (${items?.length || 0})`;
  const navLinks = [
    { id: 'home', name: 'Home', path: '/' },
    { id: 'shop', name: 'Shop', path: '/shop' },
    { id: 'about', name: 'About', path: '/about' },
    { id: 'cart', name: cartLinkText, path: '/cart' }, // Use dynamic text
  ];

  const handleLinkClick = (id) => {
    setActiveLink(id);
    setIsMobileMenuOpen(false);
  };

  // Effect to set active link based on current URL path
  useEffect(() => {
    const currentPath = location.pathname;
    // Find the link whose path exactly matches or is a prefix of the current path (excluding home '/')
    const activeNav = navLinks.find(link =>
      currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path))
    );
    setActiveLink(activeNav ? activeNav.id : ''); // Set to active ID or empty string
  }, [location.pathname]); // Dependency array simplified

  // Effect to reset state on logout or initial load without auth
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Only reset activeLink based on location, not necessarily to 'home'
      const currentPath = location.pathname;
      const activeNav = navLinks.find(link =>
        currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path))
      );
      setActiveLink(activeNav ? activeNav.id : '');
      // REMOVE setIsDialogOpen(false);
    }

  }, [isAuthenticated, isLoading, location.pathname, navLinks]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    // REMOVE setIsDialogOpen(false);
  };
  const handleLogin = () => {
    setShowSignIn(true);
  };

  return (
    <div className="relative top-0 left-0 z-50 flex justify-between h-16 items-center bg-black px-4 shadow-md">
      {/* Logo and Brand Name */}
      <div className="flex items-center hover:bg-gray-800 rounded-md p-1 transition-colors">
        <div className="flex-shrink-0">
          <Link to="/" onClick={() => handleLinkClick('home')} className="flex items-center gap-1 ">
            <img src={logo} alt="BookWorm Logo" className="w-10 h-10" />
            <span className="ml-2 text-lg font-bold text-white">BOOKWORM</span>
          </Link>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden sm:flex items-center gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.id}
            to={link.path}
            className={`px-3 py-2 text-sm font-medium rounded transition-colors ${activeLink === link.id
              ? 'bg-gray-700 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            onClick={() => handleLinkClick(link.id)}
          >
            {/* Directly use link.name which is now dynamic for cart */}
            {link.name}
          </Link>
        ))}
       
        {/* Auth Section (Desktop) */}
        {isLoading ? (
          <div className="px-3 py-2 text-sm font-medium text-gray-400">Loading...</div>
        ) : isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700`}>
              <User size={16} />
              <span>{user.first_name} {user.last_name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-500 text-sm hover:bg-red-50 focus:bg-red-50 transition-colors w-full focus:outline-none"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Render SignInForm component, passing the desktop trigger button as a prop
          <>
          <button onClick={() => handleLogin()} className="px-3 py-2 text-sm font-medium rounded transition-colors text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700">
            Sign In
          </button>
          <SignInForm
            open={showSignIn}
            onOpenChange={setShowSignIn}
          />
          </>
        )}
        
      </nav>

      {/* Mobile Navigation Button */}
      <div className="relative sm:hidden">
        <button
          className="p-2 text-gray-300 rounded-md hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className={`z-60 absolute right-0 top-full mt-2 w-48 bg-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
            <nav className="flex flex-col p-2 space-y-1" role="menu" aria-orientation="vertical" aria-labelledby="mobile-menu-button">
              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.path}
                  role="menuitem"
                  className={`block px-3 py-2 text-base font-medium rounded transition-colors ${activeLink === link.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  onClick={() => handleLinkClick(link.id)} // This already closes the menu
                >
                  {link.name}
                </Link>
              ))}
             
              
              
              {/* Auth Section (Mobile) */}
              {isLoading ? (
                <div className="px-3 py-2 text-base font-medium text-gray-400" role="menuitem">Loading...</div>
              ) : isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2 text-base font-medium rounded text-gray-300 flex items-center gap-2" role="menuitem">
                    <User size={18} />
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                  <button
                    onClick={handleLogout} // This closes the menu via state update
                    role="menuitem"
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-base font-medium rounded text-red-500 hover:bg-gray-800 focus:bg-gray-800 transition-colors focus:outline-none"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                // Render SignInForm component, passing the mobile trigger button as a prop
                <>
          <button onClick={() => handleLogin()} className="px-3 py-2 text-sm font-medium rounded transition-colors text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700">
            Sign In
          </button>
          <hr className="my-2 border-gray-700" />
          <SignInForm
            open={showSignIn}
            onOpenChange={setShowSignIn}
          />
          </>
              
             
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}