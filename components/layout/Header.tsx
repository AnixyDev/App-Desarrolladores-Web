import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { MenuIcon, BellIcon, LogOutIcon, UserIcon, FileTextIcon, BriefcaseIcon, Users as UsersIcon, SettingsIcon } from '../icons/Icon';
import { Link, useLocation } from 'react-router-dom';

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
    const location = useLocation();
    
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
    
    // Determine Page Title based on path (Simple Mapping)
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/clients')) return 'Clientes';
        if (path.startsWith('/projects')) return 'Proyectos';
        if (path.startsWith('/invoices')) return 'Facturas';
        if (path.startsWith('/settings')) return 'Configuración';
        return 'DevFreelancer';
    }

    return (
        <header className="h-16 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0
            bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300">
            
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-white/[0.05]"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menú"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>

                {/* Page Title */}
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-400 lg:hidden">DevFreelancer</span>
                    <h1 className="text-lg font-semibold text-white tracking-tight leading-none">{getPageTitle()}</h1>
                </div>
            </div>

            {/* Right-side icons */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(prev => !prev)} 
                        className={`relative p-2.5 rounded-full transition-all duration-200 ${isDropdownOpen ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'}`}
                        aria-label="Notificaciones"
                    >
                        <BellIcon className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-fuchsia-500 border-2 border-[#020617]"></span>
                            </span>
                        )}
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 pt-2 z-50 animate-fade-in-down origin-top-right">
                            <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-white/5 backdrop-blur-3xl">
                                <div className="px-4 py-3 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                                    <h4 className="font-semibold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                                        Notificaciones 
                                        {unreadCount > 0 && <span className="px-1.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 text-[10px] rounded-full border border-fuchsia-500/30">{unreadCount}</span>}
                                    </h4>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-xs text-fuchsia-400 hover:text-fuchsia-300 hover:underline transition-colors">
                                            Marcar leídas
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map(notification => (
                                             <Link 
                                                key={notification.id} 
                                                to={notification.link} 
                                                onClick={() => setIsDropdownOpen(false)}
                                                className={`flex items-start gap-4 p-4 border-b border-white/5 hover:bg-white/[0.04] transition-colors group ${!notification.isRead ? 'bg-fuchsia-500/[0.03]' : ''}`}
                                             >
                                                <div className="shrink-0 mt-1 p-2 rounded-full bg-slate-800/80 border border-white/5 group-hover:border-white/10 transition-colors">
                                                    {getNotificationIcon(notification.link)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm leading-snug break-words ${!notification.isRead ? 'text-white font-medium' : 'text-slate-300'}`}>{notification.message}</p>
                                                    <p className="text-xs text-slate-500 mt-1.5">{new Date(notification.createdAt).toLocaleString()}</p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 rounded-full bg-fuchsia-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(232,121,249,0.5)]"></div>
                                                )}
                                             </Link>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                            <BellIcon className="w-10 h-10 mb-3 opacity-20" />
                                            <p className="text-sm">Estás al día.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative pl-2 sm:pl-4 border-l border-white/10" ref={userMenuRef}>
                    <button 
                        onClick={() => setIsUserMenuOpen(prev => !prev)} 
                        className={`flex items-center gap-3 group p-1 rounded-full transition-all duration-200 ${isUserMenuOpen ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}
                        aria-label="Menú de usuario"
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Perfil" className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-fuchsia-500/50 transition-all shadow-sm" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                                <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            </div>
                        )}
                    </button>
                    
                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-64 z-50 animate-fade-in-down origin-top-right">
                            <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl shadow-black/80 overflow-hidden p-1 ring-1 ring-white/5 backdrop-blur-3xl">
                                <div className="px-4 py-3 border-b border-white/5 mb-1 bg-white/[0.02]">
                                    <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{profile?.email}</p>
                                </div>
                                <div className="p-1 space-y-0.5">
                                    <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                        <SettingsIcon className="w-4 h-4 text-slate-400" />
                                        Configuración
                                    </Link>
                                    <Link to="/public-profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                        <UserIcon className="w-4 h-4 text-slate-400" />
                                        Ver Perfil Público
                                    </Link>
                                </div>
                                <div className="border-t border-white/5 my-1"></div>
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsUserMenuOpen(false);
                                        }}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                    >
                                        <LogOutIcon className="w-4 h-4" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;