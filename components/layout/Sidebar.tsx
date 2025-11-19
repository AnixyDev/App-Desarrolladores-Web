
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
    // Allow multiple groups to be open at once
    const [openGroups, setOpenGroups] = useState<string[]>([]);

    const handleGroupClick = (label: string) => {
        setOpenGroups(prev => 
            prev.includes(label) 
                ? prev.filter(l => l !== label) 
                : [...prev, label]
        );
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 768) { // Only close on mobile
             setIsOpen(false);
        }
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                 <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            <aside className={`
                fixed md:relative inset-y-0 left-0 w-64 
                bg-[#020617]/80 backdrop-blur-xl 
                border-r border-white/5
                flex flex-col shrink-0 
                transform transition-transform duration-300 ease-out 
                z-30 
                ${isOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full'} md:translate-x-0
            `}>
                <div className="h-20 flex items-center px-6 border-b border-white/5 space-x-3 shrink-0">
                    <Logo className="h-8 w-8" />
                    <span className="text-xl font-bold text-white tracking-tight">DevFreelancer</span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {SIDEBAR_STRUCTURE.map((item, index) => {
                        if (item.type === 'link') {
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    end={item.href === '/'}
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                        isActive
                                            ? 'bg-primary-500/10 text-primary-400 shadow-[inset_0_0_0_1px_rgba(240,0,184,0.2)]'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                        }`
                                    }
                                >
                                    <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                                        (item.href === '/' ? window.location.hash === '#/' : window.location.hash.includes(item.href)) 
                                        ? 'text-primary-400' 
                                        : 'text-slate-500 group-hover:text-slate-300'
                                    }`} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        }

                        if (item.type === 'group') {
                            const isGroupOpen = openGroups.includes(item.label);
                            return (
                                <div key={item.label} className="mb-2">
                                    <button
                                        onClick={() => handleGroupClick(item.label)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            isGroupOpen ? 'text-slate-200' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <item.icon className={`w-5 h-5 mr-3 ${isGroupOpen ? 'text-primary-400' : 'text-slate-500'}`} />
                                            <span>{item.label}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isGroupOpen ? 'rotate-180 text-slate-200' : 'text-slate-600'}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isGroupOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="pt-1 pb-2 pl-3 space-y-1 ml-2.5 border-l border-white/10">
                                            {item.items.map(subItem => {
                                                return (
                                                 <NavLink
                                                    key={subItem.href}
                                                    to={subItem.href}
                                                    onClick={handleLinkClick}
                                                    className={({ isActive }) =>
                                                        `flex items-center px-3 py-2 rounded-md text-sm transition-colors relative ${
                                                        isActive
                                                            ? 'text-primary-400 font-medium bg-primary-500/5'
                                                            : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                                        }`
                                                    }
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-[13px] w-1 h-1 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(240,0,184,0.8)]"></div>}
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
            </aside>
        </>
    );
};

export default Sidebar;
