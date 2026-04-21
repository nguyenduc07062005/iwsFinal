import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Library, Plus, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Không gian', path: '/' },
    { name: 'Bộ sưu tập', path: '/collections' },
    { name: 'Môn học', path: '/subjects' },
    { name: 'Yêu thích', path: '/favorites' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl glass rounded-full px-6 py-3 flex items-center justify-between z-50 shadow-sm transition-all duration-300',
        isScrolled && 'bg-white/90 py-2'
      )}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 cursor-pointer group">
        <div className="bg-gradient-to-tr from-brand-600 to-accent text-white w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md group-hover:shadow-lg transition-all duration-300">
          <Library size={20} />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-800">StudyVault</span>
      </Link>

      {/* Links (Desktop) */}
      <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-600">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              'hover:text-brand-600 transition-colors relative py-1',
              location.pathname === link.path && 'text-brand-600'
            )}
          >
            {link.name}
            {location.pathname === link.path && (
              <motion.div
                layoutId="nav-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full"
              />
            )}
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="hidden sm:flex bg-brand-900 hover:bg-brand-600 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 items-center gap-2">
          <Plus size={16} /> Tạo mới
        </button>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/auth" 
            className="hidden sm:block text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link to="/profile" className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer">
            <img
              src="https://ui-avatars.com/api/?name=Sinh+Vien&background=random"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-slate-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 mt-4 glass rounded-3xl p-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'text-lg font-bold text-slate-700 hover:text-brand-600',
                    location.pathname === link.path && 'text-brand-600'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-slate-100" />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-brand-900 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Tạo mới
            </button>
            <Link
              to="/auth"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-center py-3 border border-slate-200 rounded-2xl font-bold text-slate-600"
            >
              Đăng nhập / Đăng ký
            </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
