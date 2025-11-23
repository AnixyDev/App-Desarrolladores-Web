import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SIDEBAR_STRUCTURE } from '../../constants';
import { useAppStore } from '../../hooks/useAppStore';
import { Logo } from '../icons/Logo';
import { ChevronDown, X } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { profile } = useAppStore();
    const location = useLocation();
    const [openGroups, setOpenGroups] = useState<string[]>(['Ventas', 'Finanzas']); // Default open for better UX

    const handleGroupClick = (label: string) => {
        setOpenGroups(prev => 
            prev.includes(label) 
                ? prev.filter(l => l !== label) 
                : [...prev, label]
        );
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
             setIsOpen(false);
        }
    }

    return (
        <>
            {/* Mobile Overlay with Blur */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            ></div>

            <aside className={`
                fixed lg:relative inset-y-0 left-0 w-72
                bg-[#020617]/95 border-r border-white/[0.06]
                flex flex-col shrink-0 
                transform transition-transform duration-300 ease-out 
                z-50 lg:translate-x-0 shadow-2xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Header Logo */}
                <div className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-3">
                        <Logo className="h-8 w-8" />
                        <span className="text-lg font-bold tracking-tight text-white">DevFreelancer</span>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="lg:hidden text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {SIDEBAR_STRUCTURE.map((item, index) => {
                        if (item.type === 'link') {
                            const isActive = item.href === '/' 
                                ? location.pathname === '/' 
                                : location.pathname.startsWith(item.href);

                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    end={item.href === '/'}
                                    onClick={handleLinkClick}
                                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                                        isActive
                                            ? 'text-white bg-white/[0.08] shadow-sm border border-white/[0.05]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                                    }`}
                                >
                                    <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                                        isActive ? 'text-fuchsia-400' : 'text-slate-500 group-hover:text-slate-300'
                                    }`} />
                                    <span>{item.label}</span>
                                    {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(232,121,249,0.6)]"></div>}
                                </NavLink>
                            );
                        }

                        if (item.type === 'group') {
                            const isGroupOpen = openGroups.includes(item.label);
                            return (
                                <div key={item.label} className="mt-6 first:mt-2">
                                    <button
                                        onClick={() => handleGroupClick(item.label)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <span>{item.label}</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isGroupOpen ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                        {item.items.map(subItem => {
                                            const isActive = location.pathname.startsWith(subItem.href);
                                            return (
                                                <NavLink
                                                    key={subItem.href}
                                                    to={subItem.href}
                                                    onClick={handleLinkClick}
                                                    className={`flex items-center pl-4 pr-3 py-2 rounded-lg text-sm transition-colors relative mx-2 ${
                                                        isActive
                                                            ? 'text-white bg-white/[0.06]'
                                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                                                    }`}
                                                >
                                                    <span className={`w-1 h-1 rounded-full mr-3 transition-colors ${isActive ? 'bg-fuchsia-400' : 'bg-slate-600'}`}></span>
                                                    {subItem.icon && <subItem.icon className={`w-4 h-4 mr-2 ${isActive ? 'text-fuchsia-300' : 'text-slate-600'}`}/>}
                                                    <span>{subItem.label}</span>
                                                </NavLink>
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </nav>
                
                {/* User Profile Footer */}
                <div className="p-4 border-t border-white/[0.06] bg-black/20">
                    <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-white/10 shadow-sm" />
                        ) : (
                             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;