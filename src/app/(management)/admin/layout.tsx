"use client";

import { FileText, Map as MapIcon, Users, Settings, LogOut, ChevronLeft, LayoutDashboard, Layers, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    
    if (!token || !userStr) {
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    } else {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/admin/login');
      } else {
        setCurrentUser(user);
        setIsAuthorized(true);

        // Redirect developer away from restricted admin pages
        if (user.email === 'developer@ezzoning.com') {
          if (pathname === '/admin' || pathname === '/admin/users' || pathname === '/admin/add-district') {
            router.push('/admin/districts');
          }
        }
      }
    }
  }, [pathname, router]);

  const handleSignOut = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="text-brand-ocean animate-pulse font-black uppercase tracking-[0.3em] text-sm">
          Securing Terminal Access...
        </div>
      </div>
    );
  }

  const isDeveloper = currentUser?.email === 'developer@ezzoning.com';

  const navItems = isDeveloper
    ? [
        { name: 'District Registry', href: '/admin/districts', icon: MapIcon, title: 'District Registry' },
      ]
    : [
        { name: 'Analytics', href: '/admin', icon: LayoutDashboard, title: 'Command Center' },
        { name: 'District Registry', href: '/admin/districts', icon: MapIcon, title: 'District Registry' },
        { name: 'User Management', href: '/admin/users', icon: Users, title: 'User Management' },
      ];

  const currentPage = navItems.find(item => item.href === pathname || (pathname.startsWith(item.href) && item.href !== '/admin')) || { title: 'Admin Console' };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden font-sans selection:bg-brand-gold/20">
      
      {/* Mobile Navbar */}
      <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-40 relative">
          <div className="flex items-center gap-2">
             <img src="/logo.png" alt="ezZoning Logo" className="h-8 w-auto" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline-block">Management Console</span>
          </div>
          <button 
             onClick={() => setSidebarOpen(true)}
             className="p-2 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
          >
             <Menu className="w-5 h-5 text-brand-slate" />
          </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
           className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
           onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 shadow-2xl md:shadow-sm transition-transform duration-300 ease-in-out`}>
        <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex flex-col gap-1 md:gap-2">
            <img src="/logo.png" alt="ezZoning Logo" className="h-6 md:h-8 w-auto self-start" />
            <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:inline-block">Management Console</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
             <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'text-brand-ocean bg-brand-ocean/5 shadow-sm border border-brand-ocean/10' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-brand-slate'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-brand-ocean' : 'text-slate-300 group-hover:text-brand-slate'} transition-colors`} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <Link href="/" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-ocean transition-all px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-slate-200">
            <ChevronLeft className="w-4 h-4" />
            Core Platform
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-30" />
        
        {/* Standardized Admin Navbar */}
        <header className="relative z-30 px-4 md:px-8 py-6 md:py-8 flex items-center justify-between border-b border-slate-200/60 bg-white/50 backdrop-blur-sm shrink-0">
          <div className="flex-1 min-w-0 pr-4">
             <h1 className="text-xl md:text-3xl font-black text-brand-slate tracking-tight italic uppercase leading-none truncate">
               {currentPage.title.split(' ').map((word, i) => (
                 <span key={i} className={i === 1 ? "text-brand-ocean" : ""}>{word} </span>
               ))}
             </h1>
             <p className="text-slate-600 mt-2 font-black uppercase tracking-widest text-[9px]">Management & System Analytics Dashboard</p>
          </div>

          <div className="group relative">
            <button className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm hover:border-brand-ocean transition-all duration-300">
              <div className="w-7 h-7 rounded-lg bg-brand-ocean/10 flex items-center justify-center text-brand-ocean">
                <Users className="w-4 h-4" />
              </div>
            </button>

            {/* Dropdown */}
            <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-slate-200 rounded-[2rem] shadow-premium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-3 px-2 z-50">
              <div className="px-4 py-2 border-b border-slate-50 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isDeveloper ? 'Developer Access' : 'Admin Access'}</p>
                <p className="text-xs font-bold text-slate-900 truncate italic uppercase tracking-tight">{currentUser?.email || 'Security Officer'}</p>
              </div>
              <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-brand-ocean rounded-xl transition-all">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl flex items-center gap-3 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
