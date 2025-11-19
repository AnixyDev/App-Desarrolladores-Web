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
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            <aside className={`fixed md:relative inset-y-0 left-0 w-64 bg-slate-950/80 backdrop-blur-sm border-r border-slate-800 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="h-20 flex items-center px-6 border-b border-slate-800 space-x-3 shrink-0">
                    <Logo className="h-8 w-8" />
                    <span className="text-xl font-bold text-white">DevFreelancer</span>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {SIDEBAR_STRUCTURE.map((item, index) => {
                        if (item.type === 'link') {
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    end={item.href === '/'}
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        }

                        if (item.type === 'group') {
                            const isGroupOpen = openGroups.includes(item.label);
                            return (
                                <div key={item.label}>
                                    <button
                                        onClick={() => handleGroupClick(item.label)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${isGroupOpen ? 'text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                    >
                                        <div className="flex items-center">
                                            <item.icon className="w-5 h-5 mr-3" />
                                            <span>{item.label}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGroupOpen ? 'rotate-180 text-white' : 'text-slate-500'}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isGroupOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="py-1 pl-4 space-y-1 border-l border-slate-800 ml-3 my-1">
                                            {item.items.map(subItem => {
                                                return (
                                                 <NavLink
                                                    key={subItem.href}
                                                    to={subItem.href}
                                                    onClick={handleLinkClick}
                                                    className={({ isActive }) =>
                                                        `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                        isActive
                                                            ? 'bg-slate-800/50 text-primary-400'
                                                            : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                                                        }`
                                                    }
                                                >
                                                    <subItem.icon className="w-4 h-4 mr-3 opacity-70" />
                                                    <span>{subItem.label}</span>
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