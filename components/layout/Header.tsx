
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
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
        <header className="h-20 z-20 flex items-center justify-between px-6 shrink-0 sticky top-0
            bg-[#020617]/70 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
            
            {/* Mobile Menu Button */}
            <button
                className="md:hidden text-slate-400 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(true)}
            >
                <MenuIcon className="w-6 h-6" />
            </button>

            {/* Placeholder for search or breadcrumbs on larger screens */}
            <div className="hidden md:block">
                {/* <SearchInput /> */}
            </div>

            {/* Right-side icons and user menu */}
            <div className="flex items-center space-x-6">
                <div className="relative" ref={notificationRef}>
                    <button onClick={() => setIsDropdownOpen(prev => !prev)} className="text-slate-400 hover:text-white relative transition-colors p-1">
                        <BellIcon className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(240,0,184,0.6)]">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 pt-2 z-50 animate-fade-in-down">
                            <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl ring-1 ring-black/20 overflow-hidden">
                                <div className="p-3 flex justify-between items-center border-b border-white/5 bg-white/5">
                                    <h4 className="font-semibold text-white text-sm">Notificaciones</h4>
                                    <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 hover:underline">Marcar todo como leído</button>
                                </div>
                                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map(notification => (
                                             <Link 
                                                key={notification.id} 
                                                to={notification.link} 
                                                onClick={() => setIsDropdownOpen(false)}
                                                className={`flex items-start gap-3 p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!notification.isRead ? 'bg-primary-500/5' : ''}`}
                                             >
                                                <div className="shrink-0 mt-1">{getNotificationIcon(notification.link)}</div>
                                                <div>
                                                    <p className="text-sm text-slate-200 leading-snug">{notification.message}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                                                </div>
                                             </Link>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                            <BellIcon className="w-8 h-8 mb-2 opacity-20" />
                                            <p className="text-sm">No tienes notificaciones.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center space-x-3 group">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Perfil" className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary-500/50 transition-all" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-primary-500/50 transition-all">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                            </div>
                        )}
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-white leading-none group-hover:text-primary-400 transition-colors">{profile?.full_name}</p>
                            <p className="text-xs text-slate-400 mt-1">{profile?.plan} Plan</p>
                        </div>
                    </button>
                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 z-50 animate-fade-in-down">
                            <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl ring-1 ring-black/20 overflow-hidden py-1">
                                <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">Mi Perfil y Ajustes</Link>
                                <div className="border-t border-white/5 my-1"></div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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
