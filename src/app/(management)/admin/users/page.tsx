"use client";

import { Search, Filter, MoreVertical, ShieldCheck, Mail, Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";

interface UserData {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  subscription?: {
    status: string;
    planTier?: string;
    currentPeriodEnd?: string;
  } | null;
}

export default function UsersDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 pb-8 relative">
      <div className="max-w-6xl mx-auto space-y-6 relative z-10 pt-6">

        {/* Filters and Search */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm relative z-10">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-300" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-brand-ocean focus:ring-1 focus:ring-brand-ocean rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all shadow-inner"
              placeholder="Search by email..."
            />
          </div>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <Filter className="h-4 w-4 text-slate-300" />
             </div>
             <select
               value={roleFilter}
               onChange={(e) => {
                 setRoleFilter(e.target.value);
                 setCurrentPage(1);
               }}
               className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-brand-ocean focus:ring-1 focus:ring-brand-ocean rounded-xl pl-11 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none transition-all shadow-inner cursor-pointer appearance-none"
             >
               <option value="ALL">All Roles</option>
               <option value="ADMIN">Admin</option>
               <option value="SUBSCRIBER">Subscriber</option>
             </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden relative flex flex-col z-10">
          
          {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md z-10">
               <Loader2 className="w-10 h-10 text-brand-ocean animate-spin" />
             </div>
          )}

          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] w-16 border-r border-slate-100">
                    S. No.
                  </th>
                  <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-slate-100">
                    User Account
                  </th>
                  <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-slate-100">
                    Subscription
                  </th>
                  <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-slate-100">
                    Role
                  </th>
                  <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Joined
                  </th>
                  <th scope="col" className="relative px-8 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {paginatedUsers.length > 0 ? paginatedUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-3.5 whitespace-nowrap border-r border-slate-50 text-center">
                      <span className="text-[11px] font-black text-slate-400 tabular-nums">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-8 py-3.5 whitespace-nowrap border-r border-slate-50 text-left">
                      <span className="text-sm font-black text-brand-slate tracking-tight group-hover:text-brand-ocean transition-colors">
                        {user.email}
                      </span>
                    </td>
                     <td className="px-8 py-3.5 whitespace-nowrap border-r border-slate-50 text-center">
                       {(() => {
                         if (user.role === 'ADMIN') {
                           return (
                             <span className="px-2.5 py-1 inline-flex text-[9px] uppercase tracking-[0.2em] font-black rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm transition-all duration-300 group-hover:bg-emerald-100">
                               Full Access
                             </span>
                           );
                         }

                         const tier = user.subscription?.planTier || 'FREE';

                         if (tier === 'UNLIMITED') {
                           return (
                             <span className="px-2.5 py-1 inline-flex text-[9px] uppercase tracking-[0.2em] font-black rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shadow-sm transition-all duration-300 group-hover:bg-amber-100">
                               Unlimited
                             </span>
                           );
                         }
                         if (tier === 'BASIC') {
                           return (
                             <span className="px-2.5 py-1 inline-flex text-[9px] uppercase tracking-[0.2em] font-black rounded-lg bg-brand-ocean/10 text-brand-ocean border border-brand-ocean/20 shadow-sm transition-all duration-300 group-hover:bg-brand-ocean/20">
                               Basic Plan
                             </span>
                           );
                         }
                         if (tier === 'PAYG') {
                           return (
                             <span className="px-2.5 py-1 inline-flex text-[9px] uppercase tracking-[0.2em] font-black rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shadow-sm transition-all duration-300 group-hover:bg-purple-100">
                               Pay-As-You-Go
                             </span>
                           );
                         }
                         
                         return (
                            <span className="px-2.5 py-1 inline-flex text-[9px] uppercase tracking-[0.2em] font-black rounded-lg bg-slate-50 text-slate-400 border border-slate-100 shadow-sm transition-all duration-300 group-hover:bg-slate-100">
                              Free Search
                            </span>
                         );
                       })()}
                     </td>
                    <td className="px-8 py-3.5 whitespace-nowrap border-r border-slate-50 text-center align-middle">
                      {user.role === 'ADMIN' ? (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-brand-ocean bg-brand-ocean/10 px-2.5 py-1 rounded-md border border-brand-ocean/20 w-fit mx-auto transition-all duration-300 group-hover:bg-brand-ocean/20">
                          <ShieldCheck className="w-3.5 h-3.5" /> SECURITY ADMIN
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 w-fit mx-auto transition-all duration-300 group-hover:bg-slate-200">
                          <User className="w-3.5 h-3.5" /> PLATFORM SUBSCRIBER
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-3.5 whitespace-nowrap text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-3.5 whitespace-nowrap text-right">
                      <button className="p-2 rounded-lg text-slate-300 hover:text-brand-ocean hover:bg-brand-ocean/5 transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  !loading && (
                    <tr>
                      <td colSpan={5} className="px-10 py-24 text-center">
                        <p className="text-lg font-black text-brand-slate tracking-tight">No subscribers found</p>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="bg-slate-50/30 px-8 py-4 border-t border-slate-50 flex items-center justify-between">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               Page {currentPage} of {totalPages || 1} — {filteredUsers.length} total
             </div>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  Next
                </button>
             </div>
          </div>
        </div>

        {/* Decorative Background Element */}
        <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-brand-ocean/5 blur-[120px] rounded-full -mr-40 -mt-20 pointer-events-none z-0" />
      </div>
    </div>
  );
}
