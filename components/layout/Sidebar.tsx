
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SIDEBAR_STRUCTURE } from '../../constants';
import { Logo } from '../icons/Logo';
import { ChevronDown } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const [openGroup, setOpenGroup] = useState<string | null>(null);
    const location = useLocation();

    // Auto-expand group if a child is active
    useEffect(() => {
        const currentPath = location.pathname;
        const activeGroup = SIDEBAR_STRUCTURE.find(item => 
            item.type === 'group' && 
            item.items?.some(subItem => currentPath.startsWith(subItem.href))
        );
        
        if (activeGroup && openGroup !== activeGroup.label) {
            setOpenGroup(activeGroup.label);
        }
    }, [location.pathname]); // Run only when path changes

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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside className={`
                fixed md:relative inset-y-0 left-0 w-64 
                bg-gray-950 border-r border-gray-800 
                flex flex-col shrink-0 
                transform transition-transform duration-300 ease-in-out z-30 
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            `}>
                <div className="h-20 flex items-center px-6 border-b border-gray-800 space-x-3 bg-gray-950/50">
                    <Logo className="h-8 w-8" />
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-500">
                        DevFreelancer
                    </span>
                </div>
                
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
                    {SIDEBAR_STRUCTURE.map((item) => {
                        if (item.type === 'link') {
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    end={item.href === '/'}
                                    onClick={handleLinkClick}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-fuchsia-900/40 to-purple-900/20 text-fuchsia-400 border-l-2 border-fuchsia-500'
                                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100 border-l-2 border-transparent'
                                        }`
                                    }
                                >
                                    <item.icon className={`w-5 h-5 mr-3 transition-colors`} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        }

                        if (item.type === 'group') {
                            const isGroupOpen = openGroup === item.label;
                            // Check if any child is active to highlight the group parent lightly
                            const isChildActive = item.items?.some(sub => location.pathname.startsWith(sub.href));

                            return (
                                <div key={item.label} className="mb-1">
                                    <button
                                        onClick={() => handleGroupClick(item.label)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            isChildActive ? 'text-gray-200' : 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <item.icon className={`w-5 h-5 mr-3 ${isChildActive ? 'text-fuchsia-500' : ''}`} />
                                            <span>{item.label}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isGroupOpen ? 'rotate-180 text-gray-200' : 'text-gray-600'}`} />
                                    </button>
                                    
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isGroupOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="pt-1 pb-2 pl-4 space-y-1 relative">
                                            {/* Line indicator for the group */}
                                            <div className="absolute left-[22px] top-0 bottom-2 w-px bg-gray-800" />
                                            
                                            {item.items.map(subItem => (
                                                 <NavLink
                                                    key={subItem.href}
                                                    to={subItem.href}
                                                    onClick={handleLinkClick}
                                                    className={({ isActive }) =>
                                                        `flex items-center px-3 py-2 rounded-md text-sm transition-colors relative z-10 ${
                                                        isActive
                                                            ? 'text-white bg-gray-800 font-medium'
                                                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                                                        }`
                                                    }
                                                >
                                                    {/* Dot for bullet point */}
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-3 ${location.pathname.startsWith(subItem.href) ? 'bg-fuchsia-500' : 'bg-gray-700'}`}></span>
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
                
                <div className="p-4 border-t border-gray-800 text-xs text-gray-600 text-center">
                    v2.0.0 &copy; 2024 DevFreelancer
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
