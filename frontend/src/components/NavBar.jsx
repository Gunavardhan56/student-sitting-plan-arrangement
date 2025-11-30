import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Upload Students', href: '/upload-students', icon: '👨‍🎓' },
    { name: 'Upload Classrooms', href: '/upload-classrooms', icon: '🏫' },
    { name: 'Generate Seating', href: '/generate-seating', icon: '📋' },
    { name: 'Seating History', href: '/seating-history', icon: '📚' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center py-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">
            🎓 Seating Planner
          </h1>
        </div>

        {/* User Info */}
        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600">Welcome back,</p>
          <p className="font-semibold text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500">ID: {user?.empId}</p>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive(item.href)
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <span className="mr-3 text-lg">🚪</span>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;