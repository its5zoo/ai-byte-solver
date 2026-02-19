import {
    LayoutDashboard, FolderOpen, History, User, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { AILogo } from '../ui/AILogo';

type SidebarView = 'projects' | 'history';

interface IDESidebarProps {
    activeView: SidebarView;
    onViewChange: (view: SidebarView) => void;
    onClose: () => void;
}

const NAV_ITEMS: { id: SidebarView | 'dashboard' | 'profile'; icon: React.FC<any>; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'projects', icon: FolderOpen, label: 'Projects' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
];

export default function IDESidebar({ activeView, onViewChange, onClose }: IDESidebarProps) {
    return (
        <div
            className="flex flex-col items-center border-r border-[#1e293b] bg-[#111827] transition-all duration-200 shrink-0"
            style={{ width: 52 }}
        >
            {/* Logo */}
            <div className="flex h-12 items-center justify-center border-b border-[#1e293b] w-full p-2">
                <div className="h-8 w-8">
                    <AILogo className="w-full h-full" />
                </div>
            </div>

            {/* Nav items */}
            <div className="flex flex-1 flex-col items-center gap-1 py-2 w-full px-1">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeView;

                    if (item.id === 'dashboard') {
                        return (
                            <Link
                                key="dashboard"
                                to="/chat"
                                title="Dashboard"
                                className={cn(
                                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                                    'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                                )}
                            >
                                <Icon className="h-4.5 w-4.5" />
                            </Link>
                        );
                    }

                    if (item.id === 'profile') {
                        return (
                            <Link
                                key="profile"
                                to="/profile"
                                title="Profile"
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1e293b] hover:text-white transition-colors"
                            >
                                <Icon className="h-4.5 w-4.5" />
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            title={item.label}
                            onClick={() => onViewChange(item.id as SidebarView)}
                            className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                                isActive
                                    ? 'bg-[#6366f1]/20 text-[#6366f1] border border-[#6366f1]/30'
                                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    );
                })}
            </div>

            {/* Close IDE button */}
            <div className="pb-2 px-1 w-full flex justify-center">
                <button
                    onClick={onClose}
                    title="Close IDE"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
