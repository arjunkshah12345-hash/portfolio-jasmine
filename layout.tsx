import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const links = [
    { path: '/', label: 'index' },
    { path: '/about', label: 'about' },
    { path: '/work', label: 'work' },
    { path: '/writing', label: 'writing' },
    { path: '/contact', label: 'contact' }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="fixed top-0 left-0 w-full p-6 md:p-12 flex justify-between items-start z-50 pointer-events-none mix-blend-difference text-paper"
      >
        <Link to="/" className="font-mono text-[10px] tracking-widest uppercase pointer-events-auto">
          A. Shah
        </Link>
        
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {links.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              className={`font-mono text-[10px] tracking-widest uppercase transition-opacity duration-300 hover:opacity-100 ${location.pathname === link.path ? 'opacity-100' : 'opacity-40'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </motion.nav>

      <main className="flex-grow flex items-center justify-center p-6 md:p-24 lg:p-32 pt-32 md:pt-48 min-h-screen">
        {children}
      </main>
      
      {/* Subtle vignette */}
      <div className="pointer-events-none fixed inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.02)] z-[-1]"></div>
    </div>
  );
};

export default Layout;