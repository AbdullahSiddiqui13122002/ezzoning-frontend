"use client";

import { useState, useEffect } from "react";
import { Users, FileText, Map as MapIcon, ArrowUpRight, TrendingUp, Crown, Zap, Loader2 } from "lucide-react";
import Link from "next/link";

interface Stats {
  activeProUsers: number;
  totalDistricts: number;
  mrr: number;
  totalUsers: number;
}

interface ChartItem {
  date: string;
  label: string;
  count: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({ activeProUsers: 0, totalDistricts: 0, mrr: 0, totalUsers: 0 });
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('admin_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics?range=${timeRange}`, { headers });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setChartData(data.chartData);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [timeRange]);

  const activityList = [
    { title: "New Signups", desc: `${stats.totalUsers} total users registered.`, time: "Live Telemetry", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Pro Conversions", desc: `${stats.activeProUsers} users are on Pro.`, time: "Secure Log", icon: Crown, color: "text-brand-ocean", bg: "bg-brand-ocean/10" },
    { title: "Zoning Processed", desc: `${stats.totalDistricts} districts active.`, time: "Registry Update", icon: MapIcon, color: "text-brand-ocean", bg: "bg-brand-ocean/10" },
  ];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 pb-8 relative">
      {/* Premium Background Decor */}
      <div className="absolute right-0 top-0 w-[800px] h-[800px] bg-brand-ocean/10 blur-[150px] rounded-full -mr-40 -mt-40 pointer-events-none z-0" />
      <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none z-0"></div>
      
      {loading && (
         <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md z-50 rounded-[2rem]">
           <Loader2 className="w-10 h-10 text-brand-ocean animate-spin" />
         </div>
      )}
      
      <div className="max-w-6xl mx-auto space-y-10 relative z-10 pt-10">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1 */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 hover:border-brand-ocean/30 transition-all duration-300 animate-reveal opacity-0">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-brand-ocean/5 p-3.5 rounded-2xl text-brand-ocean group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        <Crown className="w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-4xl font-black text-brand-slate tracking-tighter">{stats.activeProUsers}</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-2 group-hover:text-brand-ocean transition-colors">Active Pro Users</p>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-brand-ocean/5 rounded-full blur-2xl group-hover:bg-brand-ocean/10 transition-colors duration-500" />
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 hover:border-brand-ocean/30 transition-all duration-300 animate-reveal animate-stagger-1 opacity-0">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-brand-ocean/5 p-3.5 rounded-2xl text-brand-ocean group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        <MapIcon className="w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-4xl font-black text-brand-slate tracking-tighter">{stats.totalDistricts}</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-2 group-hover:text-brand-ocean transition-colors">Zoning Districts</p>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-brand-ocean/5 rounded-full blur-2xl group-hover:bg-brand-ocean/10 transition-colors duration-500" />
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300 animate-reveal animate-stagger-2 opacity-0">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-emerald-500/5 p-3.5 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-4xl font-black text-brand-slate tracking-tighter">{stats.totalUsers}</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-2 group-hover:text-emerald-500 transition-colors">Total Signups</p>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
            </div>

            {/* KPI 4 */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 hover:border-brand-ocean/30 transition-all duration-300 animate-reveal animate-stagger-3 opacity-0">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-brand-ocean/5 p-3.5 rounded-2xl text-brand-ocean group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        <Zap className="w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-4xl font-black text-brand-slate tracking-tighter">${stats.mrr.toLocaleString()}</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-2 group-hover:text-brand-ocean transition-colors">Monthly MRR</p>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-brand-ocean/5 rounded-full blur-2xl group-hover:bg-brand-ocean/10 transition-colors duration-500" />
            </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200 p-10 shadow-sm flex flex-col min-h-[450px] relative z-10">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-brand-slate tracking-tight uppercase italic">Platform <span className="text-brand-ocean">Usage</span></h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live weekly traffic and telemetry.</p>
                    </div>
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
                        className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 py-3 px-6 uppercase tracking-widest text-[10px] font-black rounded-xl cursor-pointer transition-all shadow-inner focus:ring-1 focus:ring-brand-ocean outline-none text-slate-600 appearance-none pr-10"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>

                {/* Data Driven Bar Chart */}
                <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
                    <div className="flex items-end justify-between gap-2 lg:gap-6 px-4 pt-12 min-w-[600px] h-full relative min-h-[250px]">
                    <div className="absolute inset-0 border-b border-slate-100 pointer-events-none"></div>
                    <div className="absolute inset-0 border-b border-slate-100 bottom-1/4 pointer-events-none opacity-50"></div>
                    <div className="absolute inset-0 border-b border-slate-100 bottom-2/4 pointer-events-none opacity-50"></div>
                    <div className="absolute inset-0 border-b border-slate-100 bottom-3/4 pointer-events-none opacity-50"></div>

                    {chartData.length > 0 ? chartData.map((data, i) => {
                        const maxCount = Math.max(...chartData.map(d => d.count), 1);
                        const heightPercentage = (data.count / maxCount) * 90; // scale to 90% max
                        
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer h-full justify-end relative z-10 min-w-[24px] lg:min-w-[40px]">
                                <div className="w-full max-w-[45px] bg-slate-50 rounded-2xl relative flex items-end shadow-inner h-full border border-slate-200/50">
                                    <div 
                                        className={`w-full rounded-2xl transition-all duration-700 shadow-lg relative ${data.count > 0 ? 'bg-gradient-to-t from-brand-ocean to-cyan-400 group-hover:brightness-110' : 'bg-slate-300 group-hover:bg-slate-400'}`}
                                        style={{ height: `${Math.max(heightPercentage, 5)}%` }} // min 5% for visibility
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-slate text-white text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 pointer-events-none">
                                            {data.count} Searches
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[9px] lg:text-[10px] font-black text-slate-400 tracking-[0.1em] lg:tracking-[0.2em] uppercase transition-colors group-hover:text-brand-ocean whitespace-nowrap">
                                    {data.label}
                                </span>
                            </div>
                        );
                    }) : (
                        <div className="flex-1 flex items-center justify-center text-slate-300 font-bold text-xs uppercase tracking-widest italic">
                            Awaiting Telemetry Data...
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200 p-10 shadow-sm flex flex-col relative z-10">
                <h2 className="text-xl font-black text-brand-slate tracking-tight uppercase italic mb-8 pb-6 border-b border-slate-50">Recent <span className="text-brand-ocean">Activity</span></h2>
                
                <div className="space-y-8 flex-1">
                    {activityList.map((activity, i) => (
                        <div key={i} className="flex gap-5 group cursor-default animate-reveal opacity-0" style={{ animationDelay: `${i * 0.15}s` }}>
                            <div className={`mt-0.5 w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${activity.bg} ${activity.color} shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-300`}>
                                <activity.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-brand-slate tracking-tight transition-colors group-hover:text-brand-ocean">{activity.title}</h4>
                                <p className="text-[11px] text-slate-600 font-bold mt-1 leading-relaxed">{activity.desc}</p>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 block italic">{activity.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <Link href="/admin/users" className="btn-primary w-full py-5 mt-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-brand-ocean/20">
                    View Registry Access <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>
        </div>

      </div>
    </div>
  );
}
