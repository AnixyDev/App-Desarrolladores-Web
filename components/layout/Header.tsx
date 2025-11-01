// FIX: Add a triple-slash directive to explicitly include React types, resolving issues with JSX elements not being recognized by TypeScript.
/// <reference types="react" />

import React from 'react';
import { useAppStore } from '../../hooks/useAppStore.tsx';
import { Menu, Bell, LogOut, User } from '../icons/Icon.tsx';
import { Link } from 'react-router-dom';

interface HeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
    const { profile, logout } = useAppStore();

    return (
        <header className="h-20 bg-black/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
            {/* Mobile Menu Button */}
            <button
                className="md:hidden text-gray-400 hover:text-white"
                onClick={() => setSidebarOpen(true)}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Placeholder for search or breadcrumbs on larger screens */}
            <div className="hidden md:block">
                {/* <SearchInput /> */}
            </div>

            {/* Right-side icons and user menu */}
            <div className="flex items-center space-x-4">
                <button className="text-gray-400 hover:text-white relative">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary-500 ring-2 ring-gray-950" />
                </button>

                <div className="relative group">
                    <button className="flex items-center space-x-2">
                        <User className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 p-1" />
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-white">{profile?.full_name}</p>
                            <p className="text-xs text-gray-400">{profile?.plan} Plan</p>
                        </div>
                    </button>
                    {/* --- FIX START --- */}
                    {/* The outer div is for positioning and hover detection. pt-2 creates the visual gap without a physical one. */}
                    <div className="absolute right-0 top-full w-56 pt-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                         {/* The inner div is the visible menu card */}
                        <div className="bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1">
                            <Link to="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Mi Perfil y Ajustes</Link>
                            <div className="border-t border-gray-700 my-1"></div>
                            <button
                                onClick={logout}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                    {/* --- FIX END --- */}
                </div>
            </div>
        </header>
    );
};

export default Header;