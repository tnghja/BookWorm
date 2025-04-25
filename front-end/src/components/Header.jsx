import { useState, useEffect, useCallback } from 'react'; // Keep useCallback for potential other uses if needed
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png'; // Ensure this path is correct
import { Menu, X, User, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Ensure path is correct
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Ensure path is correct

import SignInForm from './SignInForm'; // Ensure path is correct
import { useAuth } from '../components/context/AuthContext'; // Ensure path is correct
import { useCartStore } from '@/store/cartStore'; // Ensure path is correct

export default function Header() {
  const [activeLink, setActiveLink] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout, error } = useAuth();
  const items = useCartStore((state) => state.items);

  // console.log(user, isAuthenticated, isLoading); // Keep for debugging if needed

  const navLinks = [
    { id: 'home', name: 'Home', path: '/' },
    { id: 'shop', name: 'Shop', path: '/shop' },
    { id: 'about', name: 'About', path: '/about' },
    { id: 'cart', name: `Cart (${items?.length || 0})`, path: '/cart' },
  ];

  const handleLinkClick = (id) => {
    setActiveLink(id);
    setIsMobileMenuOpen(false); // Close mobile menu on link click
  };

  // Effect to set active link based on current URL path
  useEffect(() => {
    const currentPath = location.pathname;
    const activeNav = navLinks.find(link => currentPath === link.path || (link.id !== 'home' && currentPath.startsWith(link.path)));
    if (activeNav) {
      setActiveLink(activeNav.id);
    } else {
      setActiveLink(''); // Or set to a default if no match
    }
  }, [location.pathname, navLinks]);

  // Effect to reset state on logout
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setActiveLink(location.pathname === '/' ? 'home' : '');
      setIsMobileMenuOpen(false);
      setIsDialogOpen(false);
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  // --- Effect to close main mobile menu when sign-in dialog opens ---
  useEffect(() => {
    if (isDialogOpen) {
      // If the sign-in dialog is open, ensure the main mobile menu is closed
      setIsMobileMenuOpen(false);
    }
    // Dependency: Run when the dialog's open state changes
  }, [isDialogOpen]);
  // --- ---

  const handleLogout = () => {
    logout();
    setIsDialogOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsDialogOpen(false);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setIsDialogOpen(true);
    }
  }, [error]);

  return (
    <div className="relative top-0 left-0 z-50 flex justify-between h-16 items-center bg-cyan-100 px-4 shadow-md">
      {/* Logo and Brand Name */}
      <div className="flex items-center hover:bg-blue-300 rounded-md p-1 transition-colors">
        <div className="flex-shrink-0">
          <Link to="/" onClick={() => handleLinkClick('home')} className="flex items-center gap-1 ">
            <img src={logo} alt="BookWorm Logo" className="w-10 h-10" />
            <span className="ml-2 text-lg font-bold text-gray-800">BOOKWORM</span>
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
              ? 'bg-blue-700 text-white' // Active link style
              : 'text-gray-700 hover:text-white hover:bg-blue-400' // Inactive link style
              }`}
            onClick={() => handleLinkClick(link.id)}
          >
            {link.id === 'cart' ? `Cart (${items?.length || 0})` : link.name}
          </Link>
        ))}

        {/* Auth Section (Desktop) */}
        {isLoading ? (
          <div className="px-3 py-2 text-sm font-medium text-gray-500">Loading...</div>
        ) : isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded text-gray-800 hover:bg-blue-400 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
              <User size={16} />
              <span>{user.first_name} {user.last_name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 text-sm hover:bg-red-50 focus:bg-red-50 transition-colors w-full focus:outline-none"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Desktop Dialog: Use state setter directly for onOpenChange
          // Using isMobileSignInDialogOpen state for both, might rename if confusing
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="px-3 py-2 text-sm font-medium rounded transition-colors text-gray-700 hover:text-white hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Sign In
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign In</DialogTitle>
                <DialogDescription>
                  Enter your email and password to sign in to your account.
                </DialogDescription>
              </DialogHeader>
              <SignInForm onLoginSuccess={handleLoginSuccess} />
            </DialogContent>
          </Dialog>
        )}
      </nav>

      {/* Mobile Navigation Button */}
      <div className="relative sm:hidden">
        <button
          className="p-2 rounded-md hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className={`z-40 absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
            <nav className="flex flex-col p-2 space-y-1" role="menu" aria-orientation="vertical" aria-labelledby="mobile-menu-button">
              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.path}
                  role="menuitem"
                  className={`block px-3 py-2 text-base font-medium rounded transition-colors ${activeLink === link.id
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-700 hover:text-white hover:bg-blue-400'
                    }`}
                  onClick={() => handleLinkClick(link.id)} // Also closes menu
                >
                  {link.id === 'cart' ? `Cart (${items?.length || 0})` : link.name}
                </Link>
              ))}
              <hr className="my-2 border-gray-200" />

              {/* Auth Section (Mobile) */}
              {isLoading ? (
                <div className="px-3 py-2 text-base font-medium text-gray-500" role="menuitem">Loading...</div>
              ) : isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2 text-base font-medium rounded text-gray-800 flex items-center gap-2" role="menuitem">
                    <User size={18} />
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-base font-medium rounded text-red-600 hover:bg-red-50 focus:bg-red-50 transition-colors focus:outline-none"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                // --- Mobile Sign In Dialog (Revised Logic) ---
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    {/* Button no longer needs onClick to manage dialog state */}
                    <button
                      role="menuitem"
                      className="block w-full text-left px-3 py-2 text-base font-medium rounded text-gray-700 hover:text-white hover:bg-blue-400 transition-colors focus:outline-none"
                    >
                      Sign In
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sign In</DialogTitle>
                      <DialogDescription>
                        Enter email and password to sign in.
                      </DialogDescription>
                    </DialogHeader>
                    <SignInForm />
                  </DialogContent>
                </Dialog>
                 // --- End Mobile Sign In Dialog ---
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
