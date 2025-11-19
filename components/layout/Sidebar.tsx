
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SIDEBAR_STRUCTURE } from '../../constants';
import { useAppStore } from '../../hooks/useAppStore';
import { Logo } from '../icons/Logo';
import { ChevronDown } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { profile } = useAppStore();
    const [openGroups, setOpenGroups] = useState<string[]>([]);

    const handleGroupClick = (label: string) => {
        setOpenGroups(prev => 
            prev.includes(label) 
                ? prev.filter(l => l !== label) 
                : [...prev, label]
        );
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
             setIsOpen(false);
        }
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                 <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            <aside className={`
                fixed md:relative inset-y-0 left-0 w-64 
                bg-[#020617] 
                flex flex-col shrink-0 
                transform transition-transform duration-300 ease-out 
                z-30 
                border-r border-white/[0.05]
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0
            `}>
                <div className="h-20 flex items-center px-6 space-x-3 shrink-0">
                    <Logo className="h-8 w-8" />
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">DevFreelancer</span>
                </div>
                
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {SIDEBAR_STRUCTURE.map((item, index) => {
                        if (item.type === 'link') {
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    end={item.href === '/'}
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                                        isActive
                                            ? 'text-white bg-white/[0.08]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-primary rounded-r-full"></div>}
                                            <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                                                isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'
                                            }`} />
                                            <span>{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            );
                        }

                        if (item.type === 'group') {
                            const isGroupOpen = openGroups.includes(item.label);
                            return (
                                <div key={item.label} className="mt-4 mb-1">
                                    <button
                                        onClick={() => handleGroupClick(item.label)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                                            isGroupOpen ? 'text-slate-200' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <span>{item.label}</span>
                                        </div>
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isGroupOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isGroupOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="mt-1 space-y-0.5">
                                            {item.items.map(subItem => {
                                                return (
                                                 <NavLink
                                                    key={subItem.href}
                                                    to={subItem.href}
                                                    onClick={handleLinkClick}
                                                    className={({ isActive }) =>
                                                        `flex items-center pl-9 pr-3 py-2 rounded-lg text-sm transition-colors relative ${
                                                        isActive
                                                            ? 'text-white bg-white/[0.08]'
                                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                                        }`
                                                    }
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                             {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-primary-400 rounded-r-full ml-1"></div>}
                                                            <span>{subItem.label}</span>
                                                        </>
                                                    )}
                                                </NavLink>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </nav>
                
                {/* User Profile Mini-Card at bottom */}
                <div className="p-4 border-t border-white/[0.05] bg-black/20">
                    <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                        ) : (
                             <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-xs font-bold border border-primary-500/30">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;