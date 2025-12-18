import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SIDEBAR_STRUCTURE } from '../../constants';
import { Logo } from '../icons/Logo';
import { ChevronDown, X } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const [openGroup, setOpenGroup] = useState<string | null>(null);

    const handleGroupClick = (label: string) => {
        setOpenGroup(openGroup === label ? null : label);
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 768) { 
             setIsOpen(false);
        }
    }

    return (
        <>
            {/* Overlay for mobile with Blur effect */}
            {isOpen && (
                 <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            <aside className={`fixed md:relative inset-y-0 left-0 w-[280px] md:w-64 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 transform transition-all duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0 shadow-2xl shadow-primary-500/10' : '-translate-x-full'} md:translate-x-0`}>
                
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-black text-white tracking-tighter italic">DEVFL</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {SIDEBAR_STRUCTURE.map((item, index) => {
                        if (item.type === 'link') {
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    end={item.href === '/'}
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `flex items-center px-4 py-3 text-gray-400 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                                        isActive
                                            ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20 shadow-[0_0_15px_rgba(217,70,239,0.1)]'
                                            : 'hover:bg-gray-900 hover:text-white border border-transparent'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        }

                        if (item.type === 'group') {
                            const isGroupOpen = openGroup === item.label;
                            return (
                                <div key={item.label} className="space-y-1">
                                    <button
                                        onClick={() => handleGroupClick(item.label)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-gray-400 rounded-xl text-sm font-semibold transition-all group ${isGroupOpen ? 'text-white' : 'hover:bg-gray-900 hover:text-white'}`}
                                    >
                                        <div className="flex items-center">
                                            <item.icon className={`w-5 h-5 mr-3 transition-colors ${isGroupOpen ? 'text-primary-400' : 'group-hover:text-white'}`} />
                                            <span>{item.label}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isGroupOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isGroupOpen ? 'max-h-96' : 'max-h-0'}`}>
                                        <div className="py-1 pl-6 space-y-1 border-l-2 border-gray-800 ml-6 mt-1">
                                            {item.items.map(subItem => (
                                                 <NavLink
                                                    key={subItem.href}
                                                    to={subItem.href}
                                                    onClick={handleLinkClick}
                                                    className={({ isActive }) =>
                                                        `flex items-center px-4 py-2.5 text-gray-400 rounded-lg text-sm font-medium transition-all ${
                                                        isActive
                                                            ? 'text-primary-400'
                                                            : 'hover:text-white'
                                                        }`
                                                    }
                                                >
                                                    <subItem.icon className="w-4 h-4 mr-3" />
                                                    <span>{subItem.label}</span>
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800 bg-gray-900/20">
                    <div className="bg-gradient-to-r from-primary-900/40 to-purple-900/40 p-4 rounded-2xl border border-primary-500/20">
                        <p className="text-xs font-bold text-primary-300 uppercase mb-1">Tu Almacenamiento</p>
                        <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-primary-500 h-full w-[12%] rounded-full shadow-[0_0_8px_rgba(217,70,239,0.8)]"></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">1.2 GB de 10 GB usados</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;