// FIX: Add a triple-slash directive to explicitly include React types, resolving issues with JSX elements not being recognized by TypeScript.
/// <reference types="react" />

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
// FIX: Add .ts extension to constants import
import { SIDEBAR_STRUCTURE } from '../../constants.ts';
import { Logo } from '../icons/Logo.tsx';
import { ChevronDown } from 'lucide-react';

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

            <aside className={`fixed md:relative inset-y-0 left-0 w-64 bg-black/80 backdrop-blur-sm border-r border-gray-800 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="h-20 flex items-center px-6 border-b border-gray-800 space-x-3">
                    <Logo className="h-8 w-8" />
                    <span className="text-xl font-bold text-white">DevFreelancer</span>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                    {SIDEBAR_STRUCTURE.map((item, index) => {
                        if (item.type === 'link') {
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    end={item.href === '/'}
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-gray-300 rounded-md text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary-600/20 text-primary-400'
                                            : 'hover:bg-gray-800 hover:text-white'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        }

                        if (item.type === 'group') {
                            const isGroupOpen = openGroup === item.label;
                            return (
                                <div key={item.label}>
                                    <button
                                        onClick={() => handleGroupClick(item.label)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-gray-300 rounded-md text-sm font-medium hover:bg-gray-800 hover:text-white transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <item.icon className="w-5 h-5 mr-3" />
                                            <span>{item.label}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isGroupOpen ? 'max-h-screen' : 'max-h-0'}`}>
                                        <div className="py-1 pl-4 space-y-1">
                                            {item.items.map(subItem => (
                                                 <NavLink
                                                    key={subItem.href}
                                                    to={subItem.href}
                                                    onClick={handleLinkClick}
                                                    className={({ isActive }) =>
                                                        `flex items-center px-3 py-2 text-gray-400 rounded-md text-sm font-medium transition-colors ${
                                                        isActive
                                                            ? 'bg-gray-700 text-white'
                                                            : 'hover:bg-gray-700/50 hover:text-gray-200'
                                                        }`
                                                    }
                                                >
                                                    <subItem.icon className="w-5 h-5 mr-3" />
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
            </aside>
        </>
    );
};

export default Sidebar;