
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { MenuIcon, BellIcon, LogOutIcon, UserIcon, FileTextIcon, BriefcaseIcon, Users as UsersIcon, SettingsIcon } from '../icons/Icon';
import { Link } from 'react-router-dom';

const getNotificationIcon = (link: string) => {
    if (link.includes('/invoices')) return <FileTextIcon className="w-4 h-4 text-green-400" />;
    if (link.includes('/projects')) return <BriefcaseIcon className="w-4 h-4 text-purple-400" />;
    if (link.includes('/my-job-posts')) return <UsersIcon className="w-4 h-4 text-blue-400" />;
    return <BellIcon className="w-4 h-4 text-gray-400" />;
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
        <header className="h-16 z-20 flex items-center justify-between px-6 shrink-0 sticky top-0
            bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.05] transition-all duration-300">
            
            {/* Mobile Menu Button */}
            <button
                className="md:hidden text-slate-400 hover:text-white transition-colors p-2 -ml-2"
                onClick={() => setSidebarOpen(true)}
            >
                <MenuIcon className="w-6 h-6" />
            </button>

            {/* Breadcrumbs or Context Title */}
            <div className="hidden md:block">
                <div className="text-sm font-medium text-slate-400">
                    {/* Placeholder for breadcrumbs logic */}
                    <span className="text-white">Dashboard</span>
                </div>
            </div>

            {/* Right-side icons and user menu */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(prev => !prev)} 
                        className="text-slate-400 hover:text-white relative transition-colors p-2 hover:bg-white/[0.05] rounded-full"
                    >
                        <BellIcon className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary-500 ring-2 ring-[#020617]"></span>
                        )}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 pt-2 z-50 animate-fade-in-down origin-top-right">
                            <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-black/50">
                                <div className="p-3 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                                    <h4 className="font-semibold text-white text-xs uppercase tracking-wide">Notificaciones</h4>
                                    <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 hover:underline">Marcar leídas</button>
                                </div>
                                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map(notification => (
                                             <Link 
                                                key={notification.id} 
                                                to={notification.link} 
                                                onClick={() => setIsDropdownOpen(false)}
                                                className={`flex items-start gap-3 p-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors ${!notification.isRead ? 'bg-primary-500/[0.03]' : ''}`}
                                             >
                                                <div className="shrink-0 mt-0.5 p-1.5 rounded-full bg-slate-800 border border-slate-700">
                                                    {getNotificationIcon(notification.link)}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-200 leading-snug">{notification.message}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                                                </div>
                                             </Link>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                            <BellIcon className="w-8 h-8 mb-2 opacity-20" />
                                            <p className="text-sm">Todo al día.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-white/10 mx-1"></div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center gap-3 group p-1 rounded-full hover:bg-white/[0.04] transition-colors pr-3">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Perfil" className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary-500/30 transition-all" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center ring-1 ring-white/10">
                                <UserIcon className="w-4 h-4 text-slate-400" />
                            </div>
                        )}
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-medium text-white group-hover:text-primary-400 transition-colors">{profile?.full_name?.split(' ')[0]}</p>
                        </div>
                    </button>
                    
                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 z-50 animate-fade-in-down origin-top-right">
                            <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden p-1">
                                <div className="px-3 py-2 border-b border-white/5 mb-1">
                                    <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
                                    <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                                </div>
                                <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                    <SettingsIcon className="w-4 h-4" />
                                    Configuración
                                </Link>
                                <div className="border-t border-white/5 my-1"></div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                >
                                    <LogOutIcon className="w-4 h-4" />
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