
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { 
    MenuIcon as Menu, 
    BellIcon as Bell, 
    LogOutIcon as LogOut, 
    UserIcon as User, 
    FileTextIcon, 
    BriefcaseIcon,
    SearchIcon,
    SettingsIcon
} from '../icons/Icon';
import { Link } from 'react-router-dom';
import Input from '../ui/Input';

const getNotificationIcon = (link: string) => {
    if (link.includes('/invoices')) return <FileTextIcon className="w-5 h-5 text-green-400" />;
    if (link.includes('/projects')) return <BriefcaseIcon className="w-5 h-5 text-purple-400" />;
    return <Bell className="w-5 h-5 text-gray-400" />;
};

const Header: React.FC<{ setSidebarOpen: (isOpen: boolean) => void; }> = ({ setSidebarOpen }) => {
    const { profile, logout, notifications, markAllAsRead, markAsRead } = useAppStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleMarkAllRead = () => {
        markAllAsRead();
    };

    return (
        <header className="h-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-20">
            {/* Mobile Menu Button & Logo Area */}
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menú"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Global Search Bar (Hidden on Mobile) */}
            <div className="hidden md:flex flex-1 max-w-lg mx-4">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar proyectos, clientes, facturas..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg leading-5 bg-gray-900/50 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-600 text-xs border border-gray-700 rounded px-1.5 py-0.5">⌘K</span>
                    </div>
                </div>
            </div>

            {/* Right-side icons and user menu */}
            <div className="flex items-center space-x-3 sm:space-x-5">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(prev => !prev)} 
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all relative group"
                        aria-label="Notificaciones"
                    >
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-105 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500 border-2 border-gray-950"></span>
                            </span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 origin-top-right transform transition-all">
                            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black ring-opacity-5">
                                <div className="p-4 flex justify-between items-center border-b border-gray-800 bg-gray-800/50">
                                    <h4 className="font-semibold text-white flex items-center gap-2">
                                        Notificaciones 
                                        {unreadCount > 0 && <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount}</span>}
                                    </h4>
                                    <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 hover:underline">
                                        Marcar todo como leído
                                    </button>
                                </div>
                                <div className="max-h-[24rem] overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        <div className="divide-y divide-gray-800">
                                            {notifications.map(notification => (
                                                 <Link 
                                                    key={notification.id} 
                                                    to={notification.link} 
                                                    onClick={() => {
                                                        markAsRead(notification.id);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`flex items-start gap-4 p-4 hover:bg-gray-800/80 transition-colors ${!notification.isRead ? 'bg-gray-800/30' : ''}`}
                                                 >
                                                    <div className="shrink-0 mt-1 p-2 bg-gray-800 rounded-full border border-gray-700">
                                                        {getNotificationIcon(notification.link)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${!notification.isRead ? 'text-white font-medium' : 'text-gray-400'}`}>
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </p>
                                                    </div>
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-2"></div>
                                                    )}
                                                 </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Bell className="w-12 h-12 text-gray-700 mb-3" />
                                            <p className="text-gray-400 text-sm">Estás al día. No hay nuevas notificaciones.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                    <button 
                        onClick={() => setIsUserMenuOpen(prev => !prev)} 
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700"
                    >
                        <div className="relative">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Perfil" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-gray-800" />
                            ) : (
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary-600 to-purple-700 flex items-center justify-center ring-2 ring-gray-800">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-950 rounded-full"></div>
                        </div>
                        
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-white leading-none mb-1">{profile?.full_name?.split(' ')[0]}</p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-700 text-gray-300 border border-gray-600 uppercase tracking-wide">
                                {profile?.plan || 'Free'}
                            </span>
                        </div>
                    </button>

                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 z-50 origin-top-right transform transition-all">
                            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-800 sm:hidden">
                                    <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
                                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                                </div>
                                
                                <Link 
                                    to="/settings" 
                                    onClick={() => setIsUserMenuOpen(false)} 
                                    className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                >
                                    <SettingsIcon className="w-4 h-4 mr-3 text-gray-400" />
                                    Ajustes y Perfil
                                </Link>
                                <Link 
                                    to="/billing" 
                                    onClick={() => setIsUserMenuOpen(false)} 
                                    className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                >
                                    <FileTextIcon className="w-4 h-4 mr-3 text-gray-400" />
                                    Facturación
                                </Link>
                                
                                <div className="border-t border-gray-800 my-1"></div>
                                
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                >
                                    <LogOut className="w-4 h-4 mr-3" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
