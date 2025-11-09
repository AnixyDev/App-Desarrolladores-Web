import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
// FIX: Correctly import aliased icons from Icon.tsx
import { MenuIcon, BellIcon, LogOutIcon, UserIcon, FileTextIcon, BriefcaseIcon, Users as UsersIcon } from '../icons/Icon';
import { Link } from 'react-router-dom';

const getNotificationIcon = (link: string) => {
    if (link.includes('/invoices')) return <FileTextIcon className="w-5 h-5 text-green-400" />;
    if (link.includes('/projects')) return <BriefcaseIcon className="w-5 h-5 text-purple-400" />;
    if (link.includes('/my-job-posts')) return <UsersIcon className="w-5 h-5 text-blue-400" />;
    return <BellIcon className="w-5 h-5 text-gray-400" />;
};


const Header: React.FC<{ setSidebarOpen: (isOpen: boolean) => void; }> = ({ setSidebarOpen }) => {
    const { profile, logout, notifications, markAllAsRead } = useAppStore();
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
        <header className="h-20 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
            {/* Mobile Menu Button */}
            <button
                className="md:hidden text-slate-400 hover:text-white"
                onClick={() => setSidebarOpen(true)}
            >
                <MenuIcon className="w-6 h-6" />
            </button>

            {/* Placeholder for search or breadcrumbs on larger screens */}
            <div className="hidden md:block">
                {/* <SearchInput /> */}
            </div>

            {/* Right-side icons and user menu */}
            <div className="flex items-center space-x-4">
                <div className="relative" ref={notificationRef}>
                    <button onClick={() => setIsDropdownOpen(prev => !prev)} className="text-slate-400 hover:text-white relative">
                        <BellIcon className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white ring-2 ring-slate-950">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full w-80 pt-2 z-20">
                            <div className="bg-slate-800 border border-slate-700 rounded-md shadow-lg">
                                <div className="p-3 flex justify-between items-center border-b border-slate-700">
                                    <h4 className="font-semibold text-white">Notificaciones</h4>
                                    <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:underline">Marcar todo como leído</button>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map(notification => (
                                             <Link 
                                                key={notification.id} 
                                                to={notification.link} 
                                                onClick={() => setIsDropdownOpen(false)}
                                                className={`flex items-start gap-3 p-3 hover:bg-slate-700/50 ${!notification.isRead ? 'bg-primary-600/10' : ''}`}
                                             >
                                                <div className="shrink-0 mt-1">{getNotificationIcon(notification.link)}</div>
                                                <div>
                                                    <p className="text-sm text-slate-200">{notification.message}</p>
                                                    <p className="text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                                                </div>
                                             </Link>
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-400 text-sm py-8">No tienes notificaciones.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center space-x-2">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Perfil" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <UserIcon className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 p-1" />
                        )}
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-white">{profile?.full_name}</p>
                            <p className="text-xs text-slate-400">{profile?.plan} Plan</p>
                        </div>
                    </button>
                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full w-56 pt-2 z-20">
                            <div className="bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1">
                                <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Mi Perfil y Ajustes</Link>
                                <div className="border-t border-slate-700 my-1"></div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300"
                                >
                                    <LogOutIcon className="w-4 h-4 mr-2" />
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