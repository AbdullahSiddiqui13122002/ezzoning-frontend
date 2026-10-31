"use client";

import { ChevronRight, FileText, AlertTriangle, ExternalLink, MapPin, Loader2, Download, Play, X, Table } from "lucide-react";
import { createPortal } from "react-dom";
import { useMapStore } from "@/store/useMapStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect } from "react";
import SetbackDiagram from "./SetbackDiagram";

const getBuildingDeptUrl = (districtName: string): string => {
  if (!districtName) return "";
  const nameLower = districtName.toLowerCase();
  
  if (nameLower.includes("glen cove")) return "https://glencoveny.gov/departments/building";
  if (nameLower.includes("long beach")) return "https://www.longbeachny.gov/building";
  if (nameLower.includes("hempstead") && !nameLower.includes("north hempstead")) return "https://hempsteadny.gov/181/Buildings";
  if (nameLower.includes("north hempstead")) return "https://northhempsteadny.gov/building";
  if (nameLower.includes("oyster bay")) return "https://oysterbaytown.com/departments/planning-development/building-division";
  if (nameLower.includes("babylon")) return "https://townofbabylon.com/188/Building-Division";
  if (nameLower.includes("brookhaven")) return "https://www.brookhavenny.gov/Building";
  if (nameLower.includes("east hampton")) return "https://www.easthamptonny.gov/155/Building-Department";
  if (nameLower.includes("huntington")) return "https://www.huntingtonny.gov/building";
  if (nameLower.includes("islip")) return "https://islipny.gov/departments/planning-development/building-division";
  if (nameLower.includes("riverhead")) return "https://www.townofriverheadny.gov/building";
  if (nameLower.includes("shelter island")) return "https://shelterislandtown.us/departments/building";
  if (nameLower.includes("smithtown")) return "https://www.smithtownny.gov/159/Building-Department";
  if (nameLower.includes("southampton")) return "https://www.southamptontownny.gov/154/Building-Department";
  if (nameLower.includes("southold")) return "https://www.southoldtownny.gov/186/Building-Department";
  
  // Fallback for villages
  const cleanName = districtName.replace(/Town of |Village of |City of /gi, '').trim();
  return `https://www.google.com/search?q=${encodeURIComponent(cleanName + " NY Building Department official website")}`;
};

const cleanZoneName = (name: string): string => {
  if (!name) return '';
  let cleaned = name.trim();
  cleaned = cleaned.replace(/\(([^)]+)\)\s*\(\1\)/gi, '($1)');
  cleaned = cleaned.replace(/\(([^)]+)\)\s*\(([^)]+)\)/g, (match, p1, p2) => {
    const norm1 = p1.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const norm2 = p2.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return norm1 === norm2 ? `(${p1})` : match;
  });
  return cleaned;
};

export default function RightPanel({ onReportDataIssue }: { onReportDataIssue?: () => void }) {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setSelectedProperty = useMapStore((state) => state.setSelectedProperty);
  const isSearching = useMapStore((state) => state.isSearching);
  const user = useAuthStore((state) => state.user);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeZone, setActiveZone] = useState<any>(null);
  const [loadingZone, setLoadingZone] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [modalTableType, setModalTableType] = useState<'principal' | 'accessory'>('principal');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close custom dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.zoning-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  // Dynamic Calculations based on Lot Area and Zoning Rules
  let maxFootprintText = 'N/A';
  let maxFloorAreaText = 'N/A';

  if (selectedProperty && activeZone?.principalRequirements) {
    const findValue = (keywords: string[], reqs: Record<string, string>) => {
      const entry = Object.entries(reqs).find(([key]) =>
        keywords.some(k => key.toLowerCase().includes(k.toLowerCase()))
      );
      return entry ? entry[1] : null;
    };
    
    const reqs = activeZone.principalRequirements;
    const lotArea = selectedProperty.actualLotArea;

    // 1. Find Floor Area Ratio (FAR)
    const farVal = findValue(['floor area ratio', 'far'], reqs);
    let parsedFar: number | null = null;
    if (farVal && farVal !== 'N/A') {
      const cleanFarStr = farVal.replace(/[^0-9.]/g, '');
      let farNum = parseFloat(cleanFarStr);
      if (!isNaN(farNum)) {
        if (farVal.includes('%') || farNum > 1) {
          farNum = farNum / 100;
        }
        parsedFar = farNum;
      }
    }

    // 2. Find Lot Coverage
    const coverageVal = findValue(['lot coverage', 'coverage'], reqs);
    let parsedCoveragePercent: number | null = null;
    let parsedHardMaxFootprint: number | null = null;

    if (coverageVal && coverageVal !== 'N/A') {
      const pctMatch = coverageVal.match(/(\d+(?:\.\d+)?)\s*%/);
      if (pctMatch) {
        parsedCoveragePercent = parseFloat(pctMatch[1]) / 100;
      }

      const sfMatch = coverageVal.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*(?:sq\.?\s*ft\.?|s\.?f\.?|max)/i);
      if (sfMatch) {
        parsedHardMaxFootprint = parseFloat(sfMatch[1].replace(/,/g, ''));
      }
    }

    if (lotArea) {
      const lotAreaNum = Number(lotArea);
      let footprintNum: number | null = null;

      if (parsedCoveragePercent !== null && parsedHardMaxFootprint !== null) {
        footprintNum = Math.min(lotAreaNum * parsedCoveragePercent, parsedHardMaxFootprint);
      } else if (parsedCoveragePercent !== null) {
        footprintNum = lotAreaNum * parsedCoveragePercent;
      } else if (parsedHardMaxFootprint !== null) {
        footprintNum = parsedHardMaxFootprint;
      }

      if (footprintNum !== null) {
        maxFootprintText = `${Math.round(footprintNum).toLocaleString()} sq ft`;
        
        if (parsedFar !== null) {
          maxFloorAreaText = `${Math.round(lotAreaNum * parsedFar).toLocaleString()} sq ft`;
        }
      } else if (parsedFar !== null) {
        maxFloorAreaText = `${Math.round(lotAreaNum * parsedFar).toLocaleString()} sq ft`;
      }
    } else {
      if (parsedCoveragePercent !== null && parsedHardMaxFootprint !== null) {
        maxFootprintText = `${parsedCoveragePercent * 100}% of lot area (capped at ${parsedHardMaxFootprint.toLocaleString()} sq ft)`;
      } else if (parsedCoveragePercent !== null) {
        maxFootprintText = `${parsedCoveragePercent * 100}% of lot area`;
      } else if (parsedHardMaxFootprint !== null) {
        maxFootprintText = `${parsedHardMaxFootprint.toLocaleString()} sq ft`;
      }

      if (parsedFar !== null) {
        maxFloorAreaText = `${parsedFar * 100}% of lot area`;
      }
    }

    const isMineola = selectedProperty.district?.name.toLowerCase().includes('mineola');
    const isMineolaGFA = isMineola && 
        (activeZone.zone && ['r1', 'r2', 'r3', 'r-1', 'r-2', 'r-3'].some(c => activeZone.zone.toLowerCase().includes(c)));

    if (isMineolaGFA) {
      maxFloorAreaText = 'See Chart';
    }
  }

  // Sort key-value principal requirements logically, preserving FAR as a distinct field
  const getSortedPrincipalRequirements = (rawReqs: Record<string, any>) => {
    if (!rawReqs) return [];
    
    const reqs = { ...rawReqs };

    // Clean up: remove any Existing Lot Area or Existing Lot Coverage
    for (const key of Object.keys(reqs)) {
      if (/existing\s*lot\s*(area|coverage)/i.test(key) || /^existing\s*coverage/i.test(key)) {
        delete reqs[key];
      }
    }
    
    // Consolidate only max floor area values (excluding FAR)
    const grossFloorKeys = [
      'max floor area allowed',
      'max gross floor area',
      'maximum gross floor area',
      'maximum floor area',
      'gross floor area'
    ];
    
    let consolidatedValue = '';
    for (const key of grossFloorKeys) {
      const actualKey = Object.keys(reqs).find(k => k.toLowerCase() === key);
      if (actualKey) {
        const val = reqs[actualKey];
        if (val && val !== 'N/A' && val !== 'Not specified' && val !== '' && val !== 'none') {
          consolidatedValue = val;
          break;
        }
      }
    }
    
    if (consolidatedValue) {
      for (const key of grossFloorKeys) {
        const actualKey = Object.keys(reqs).find(k => k.toLowerCase() === key);
        if (actualKey) {
          delete reqs[actualKey];
        }
      }
      reqs['Max Floor Area Allowed'] = consolidatedValue;
    }
    
    const preferredOrder = [
      'Zoning Jurisdiction',
      'Lot Area',
      'Lot Width',
      'Floor Area Ratio (FAR)',
      'Floor Area Ratio',
      'FAR',
      'Max Floor Area Allowed',
      'Floor Area',
      'Lot Coverage',
      'Building Height',
      'Max Height (Feet)',
      'Max Height (Stories)',
      'Front Setback',
      'Front Yard',
      'Side Setback',
      'Side Setback (Both)',
      'Side Yard',
      'Rear Setback',
      'Rear Yard',
      'Min Unit Size',
      'Parking Spaces'
    ];
    
    const bottomKeys = [
      'Source',
      'Source Link',
      'Contact Building Dept'
    ];
    
    const entries = Object.entries(reqs);
    
    entries.sort(([keyA], [keyB]) => {
      const idxA = preferredOrder.findIndex(p => p.toLowerCase() === keyA.toLowerCase());
      const idxB = preferredOrder.findIndex(p => p.toLowerCase() === keyB.toLowerCase());
      
      const isBottomA = bottomKeys.includes(keyA);
      const isBottomB = bottomKeys.includes(keyB);
      
      if (isBottomA && !isBottomB) return 1;
      if (!isBottomA && isBottomB) return -1;
      if (isBottomA && isBottomB) {
        return bottomKeys.indexOf(keyA) - bottomKeys.indexOf(keyB);
      }
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      
      return keyA.localeCompare(keyB);
    });
    
    return entries;
  };

  // Sync activeZone with selectedProperty on load or change
  useEffect(() => {
    setImgError(false);
    if (selectedProperty) {
      setActiveZone(selectedProperty);
    } else {
      setActiveZone(null);
    }
  }, [selectedProperty]);

  const handleZoneChange = async (zoneId: string) => {
    if (!selectedProperty) return;
    setLoadingZone(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones/${zoneId}`);
      if (!res.ok) throw new Error("Failed to fetch zone details");
      const zoneDetails = await res.json();

      const updated = {
        ...selectedProperty,
        id: zoneDetails.id,
        zone: zoneDetails.name,
        zoneName: zoneDetails.classification,
        principalRequirements: zoneDetails.principalRequirements || {},
        accessoryRequirements: zoneDetails.accessoryRequirements || {},
        ordinanceUrl: zoneDetails.ordinanceUrl || undefined,
        ecodeLink: zoneDetails.ecodeLink || undefined,
        district: zoneDetails.district
      };

      setSelectedProperty(updated);
      setActiveZone(updated);

      // Record search history for zone switch
      if (user?.email) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            address: selectedProperty.address,
            zone: zoneDetails.classification
          })
        }).catch(err => console.error("Failed to record history:", err));
      }
    } catch (err) {
      console.error("Failed to switch zone:", err);
      alert("Could not load zoning details. Please try again.");
    } finally {
      setLoadingZone(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedProperty || !activeZone) return;
    setIsGenerating(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: selectedProperty.address,
          zoneName: activeZone.zoneName,
          zoneCode: activeZone.zone,
          secBlkLot: selectedProperty.secBlkLot,
          principalRequirements: activeZone.principalRequirements,
          accessoryRequirements: activeZone.accessoryRequirements,
          districtName: selectedProperty.district?.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ezZoning-Report-${selectedProperty.address.split(',')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Could not generate the report. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isSearching) {
    return (
      <div className="absolute bottom-0 left-0 right-0 top-16 rounded-t-[2.5rem] lg:rounded-none lg:top-auto lg:bottom-auto lg:left-auto lg:right-auto lg:relative lg:inset-auto lg:w-96 bg-white border-l border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-2xl z-40 flex flex-col items-center justify-center p-12 text-center lg:h-full overflow-hidden animate-slide-up">
        {/* Mobile Swipe Handle & Close */}
        <div className="lg:hidden absolute top-0 left-0 right-0 p-4 flex flex-col items-center z-50">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-2" />
          <button 
            onClick={() => useMapStore.setState({ isSearching: false })}
            className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand-ocean/5 rounded-full blur-3xl animate-pulse" />
        <Loader2 className="w-10 h-10 text-brand-ocean animate-spin mb-6 relative z-10 mt-8 lg:mt-0" />
        <h3 className="text-xs font-black text-brand-slate uppercase tracking-[0.2em] relative z-10 mb-2">Analyzing Parcel Data</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Retrieving zoning codes and geospatial boundaries...</p>
      </div>
    );
  }

  if (!selectedProperty) {
    return (
      <div className="hidden lg:flex w-96 bg-slate-50 border-l border-slate-200 z-20 flex-col items-center justify-center p-12 text-center h-full relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-[-10%] right-[-10%].w-64 h-64 bg-brand-ocean/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-brand-emerald/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 glass-panel p-8 flex flex-col items-center gap-6 border-white/40 shadow-premium max-w-xs">
          <div className="bg-brand-ocean/10 p-4 rounded-2xl animate-subtle-pulse">
            <MapPin className="w-8 h-8 text-brand-ocean" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-lg font-black text-brand-slate tracking-tight">Find the Zoning for Any Long Island Property.</h1>
            <p className="text-sm text-brand-light-slate font-medium leading-relaxed">
              Search for an address or click directly on the interactive map to unlock zoning insights and property requirements.
            </p>
          </div>
          
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).openDemoModal) {
                (window as any).openDemoModal();
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-ocean/10 text-brand-ocean font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-brand-ocean hover:text-white transition-all shadow-sm"
          >
            <Play className="w-4 h-4" />
            Watch Demo
          </button>

          <div className="w-12 h-1 bg-slate-200 rounded-full mt-2" />
        </div>
      </div>
    );
  }

  if (!activeZone) {
    return (
      <div className="absolute bottom-0 left-0 right-0 top-4 rounded-t-[2.5rem] lg:rounded-none lg:top-auto lg:bottom-auto lg:left-auto lg:right-auto lg:relative lg:inset-auto lg:w-96 bg-white border-l border-slate-200 shadow-2xl z-40 flex items-center justify-center p-12 lg:h-full overflow-hidden">
        <Loader2 className="w-8 h-8 text-brand-ocean animate-spin" />
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 top-4 rounded-t-[2.5rem] lg:rounded-none lg:top-auto lg:bottom-auto lg:left-auto lg:right-auto lg:relative lg:inset-auto lg:w-96 bg-white border-l border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-2xl z-40 flex flex-col transform transition-transform duration-300 ease-in-out lg:h-full overflow-hidden animate-slide-up">
      
      {/* Mobile Swipe Handle */}
      <div className="lg:hidden w-full flex justify-center pt-3 pb-1 bg-white relative z-50">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
      </div>

      <div className="p-6 pt-2 lg:pt-6 border-b border-slate-100 flex-1 overflow-y-auto min-h-0 pb-36 lg:pb-28">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Property Details</h2>
          <button 
            onClick={() => useMapStore.setState({ selectedProperty: null })}
            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all flex items-center gap-2 group"
          >
            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:group-hover:inline">Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Address & Parcel ID */}
          <div className="space-y-2 animate-reveal opacity-0">
            <div>
              <p className="text-[10px] font-black text-brand-ocean uppercase tracking-[0.2em] mb-2">Selected Location</p>
              <h3 className="text-xl font-black text-brand-slate leading-tight tracking-tight">
                {selectedProperty.address}
              </h3>
            </div>
          </div>

          {/* Property Image */}
          <div className="w-full h-44 bg-slate-100/50 rounded-[2rem] overflow-hidden relative border border-slate-200/60 shadow-inner group animate-reveal animate-stagger-1 opacity-0">
              {selectedProperty.imageUrl && 
               !imgError &&
               !selectedProperty.imageUrl.includes("key=undefined") && 
               !selectedProperty.imageUrl.includes("replace_with_google_api_key") ? (
                  <img 
                    src={selectedProperty.imageUrl} 
                    alt="Property Street View" 
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
              ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                      <div className="bg-white p-3 rounded-2xl shadow-sm mb-3 border border-slate-100">
                        <MapPin className="w-6 h-6 text-brand-ocean opacity-40" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                        Street View Preview Unavailable
                      </p>
                      <p className="text-[9px] font-bold text-slate-300 mt-1 italic tracking-tight">No imagery available for this location</p>
                  </div>
              )}
          </div>

          {/* Zoning District Selector */}
          {selectedProperty.district?.zones && selectedProperty.district.zones.length > 1 && (() => {
            const currentZone = selectedProperty.district.zones.find(z => z.name === activeZone.zone) || selectedProperty.district.zones[0];
            
            const getBadgeColors = (classification: string) => {
              const c = classification.toUpperCase();
              if (c.includes('RESIDENTIAL')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
              if (c.includes('COMMERCIAL')) return 'bg-blue-50 text-blue-700 border-blue-100';
              if (c.includes('INDUSTRIAL')) return 'bg-purple-50 text-purple-700 border-purple-100';
              if (c.includes('MIXED')) return 'bg-orange-50 text-orange-700 border-orange-100';
              return 'bg-slate-50 text-slate-700 border-slate-100';
            };

            return (
              <div className={`zoning-dropdown-container relative p-6 rounded-[2rem] border border-slate-100 bg-white shadow-premium flex flex-col gap-4 overflow-visible group transition-all animate-reveal animate-stagger-1.5 opacity-0 ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 rounded-l-[2rem]" />
                
                <div className="relative">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 flex items-center justify-between">
                    <span>Switch Zoning Class</span>
                    {loadingZone && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
                  </p>
                  
                  {/* Custom Trigger */}
                  <div className="relative mt-3">
                    <button
                      disabled={loadingZone}
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-sm hover:border-indigo-500 hover:bg-white hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <div className="flex flex-col gap-1 pr-4">
                        <span className="text-xs font-extrabold text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                          {cleanZoneName(currentZone.name)}
                        </span>
                        <span className={`inline-block self-start border text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${getBadgeColors(currentZone.classification)}`}>
                          {currentZone.classification}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transform transition-transform duration-300 ${isDropdownOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                        <div className="p-1 divide-y divide-slate-50">
                          {selectedProperty.district.zones.map((z: any) => {
                            const isSelected = z.id === currentZone.id;
                            return (
                              <button
                                key={z.id}
                                type="button"
                                onClick={() => {
                                  handleZoneChange(z.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors group/opt ${isSelected ? 'bg-slate-50/70' : ''}`}
                              >
                                <div className="flex flex-col gap-1">
                                  <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-600 font-extrabold' : 'text-slate-700 group-hover/opt:text-indigo-600'}`}>
                                    {cleanZoneName(z.name)}
                                  </span>
                                  <span className={`inline-block self-start border text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${getBadgeColors(z.classification)}`}>
                                    {z.classification}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}


          {/* Zoning District */}
          <div className={`p-6 rounded-[2rem] border flex flex-col gap-4 relative overflow-hidden group shadow-premium transition-all animate-reveal animate-stagger-2 opacity-0 ${
            activeZone.zoneName === "No Data Available" 
            ? "bg-slate-50 border-slate-200" 
            : "bg-white border-slate-100"
          }`}>
            <div className={`absolute top-0 left-0 w-2 h-full ${
               activeZone.zoneName === "No Data Available" ? "bg-slate-200" : "bg-brand-emerald"
            }`} />
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                 activeZone.zoneName === "No Data Available" ? "text-slate-400" : "text-brand-emerald"
              }`}>Official Zoning</p>
              <h4 className="text-2xl font-black text-brand-slate leading-tight tracking-tight">
                {activeZone.zoneName}
              </h4>
              <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                 activeZone.zoneName === "No Data Available" ? "bg-slate-200 text-slate-500" : "bg-brand-emerald/10 text-brand-emerald"
              }`}>
                Classification: {cleanZoneName(activeZone.zone) || "N/A"}
              </div>
            </div>
          </div>

          {/* Building Department Card */}
          {selectedProperty.district && (
            <div className="p-6 rounded-[2rem] border border-slate-100 bg-white shadow-premium flex flex-col gap-4 relative overflow-hidden group transition-all animate-reveal animate-stagger-2.5 opacity-0">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">Building Department</p>
                <h4 className="text-xl font-black text-brand-slate leading-tight tracking-tight">
                  {selectedProperty.district.name}
                </h4>
                <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                  Jurisdiction: {selectedProperty.district.type}
                </div>
              </div>
              <a 
                href={getBuildingDeptUrl(selectedProperty.district.name)}
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 text-xs font-black text-amber-600 hover:text-brand-slate transition-colors flex items-center gap-1.5 group/link"
              >
                Go to Building Department
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/link:opacity-100 transition-opacity" />
              </a>
            </div>
          )}

          {/* Flood Zone Warning */}
          {selectedProperty.isFloodZone && (
             <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-4 text-rose-800 shadow-sm animate-in zoom-in duration-300">
                <div className="bg-rose-100 p-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                </div>
                <p className="text-xs font-bold leading-relaxed">Property identified within a high-risk Flood Zone area.</p>
             </div>
          )}

          {/* Visual Setback Diagram */}
          {activeZone.zoneName !== "No Data Available" && (
            <SetbackDiagram requirements={activeZone.principalRequirements} />
          )}

          {/* Building Requirements Tables */}
          {(Object.keys(activeZone.principalRequirements || {}).length > 0 || 
            Object.keys(activeZone.accessoryRequirements || {}).length > 0) && (
            <div className="pt-6 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
                  <FileText className="w-3.5 h-3.5" />
                  Dimensional Requirements
                </h4>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              
              {/* Principal Building */}
              {activeZone.principalRequirements && Object.keys(activeZone.principalRequirements).length > 0 && (
                  <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-ocean" />
                        Principal Structure
                      </h5>
                      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-xs text-left">
                              <tbody className="divide-y divide-slate-50">
                                  {(() => {
                                      const sortedEntries = getSortedPrincipalRequirements(activeZone.principalRequirements);
                                      const bottomKeys = ['Source', 'Source Link', 'Contact Building Dept'];
                                      const hiddenKeys = ['Livable Floor Area Table', 'Max Gross Floor Area Formulas', 'Floor Area Ratio Table', 'Floor Area Table', 'Principal Schedule Table', 'Accessory Schedule Table', 'Schedule Table'];
                                      
                                      const visibleEntries = sortedEntries.filter(([key, val]) => 
                                           !hiddenKeys.includes(key) && 
                                           !/existing\s*lot\s*(area|coverage)/i.test(key) &&
                                           !/^existing\s*coverage/i.test(key) &&
                                           typeof val !== 'object' && 
                                           !Array.isArray(val)
                                       );

                                      return (
                                          <>
                                              {visibleEntries.filter(([key]) => !bottomKeys.includes(key)).map(([key, value]) => (
                                                  <tr key={key} className="hover:bg-slate-50 transition-colors group">
                                                      <td className="px-5 py-4 font-black text-slate-400 uppercase tracking-tighter w-1/2 group-hover:text-brand-ocean transition-colors">{key}</td>
                                                      <td className="px-5 py-4 text-slate-900 font-bold">
                                                        {String(value).toLowerCase().includes('chart') ? (
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setModalTableType('principal');
                                                              setChartModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-ocean/10 text-brand-ocean font-extrabold text-[11px] rounded-xl hover:bg-brand-ocean hover:text-white transition-all shadow-sm group cursor-pointer"
                                                          >
                                                            <Table className="w-3.5 h-3.5" />
                                                            <span>Click to see chart</span>
                                                          </button>
                                                        ) : (
                                                          String(value)
                                                        )}
                                                      </td>
                                                  </tr>
                                              ))}

                                              {visibleEntries.filter(([key]) => bottomKeys.includes(key)).map(([key, value]) => (
                                                  <tr key={key} className="hover:bg-slate-50 transition-colors group">
                                                      <td className="px-5 py-4 font-black text-slate-400 uppercase tracking-tighter w-1/2 group-hover:text-brand-ocean transition-colors">{key}</td>
                                                      <td className="px-5 py-4 text-slate-900 font-bold">{String(value)}</td>
                                                  </tr>
                                              ))}
                                          </>
                                      );
                                  })()}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {/* Accessory Building */}
              {activeZone.accessoryRequirements && Object.keys(activeZone.accessoryRequirements).length > 0 && (
                  <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                        Accessory Structure
                      </h5>
                      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-xs text-left border-collapse">
                              <tbody className="divide-y divide-slate-50">
                                  {(() => {
                                       const hiddenAccessoryKeys = ['Accessory Schedule Table', 'Floor Area Table', 'Principal Schedule Table', 'Schedule Table'];
                                       return Object.entries(activeZone.accessoryRequirements)
                                         .filter(([key, val]) => 
                                           !hiddenAccessoryKeys.includes(key) && 
                                           !/existing\s*lot\s*(area|coverage)/i.test(key) &&
                                           !/^existing\s*coverage/i.test(key) &&
                                           typeof val !== 'object' && 
                                           !Array.isArray(val)
                                         )
                                        .map(([key, value]) => (
                                          <tr key={key} className="hover:bg-slate-50 transition-colors group">
                                              <td className="px-5 py-4 font-black text-slate-400 uppercase tracking-tighter w-1/2 group-hover:text-brand-purple transition-colors">{key}</td>
                                              <td className="px-5 py-4 text-slate-900 font-bold">
                                                {String(value).toLowerCase().includes('chart') ? (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setModalTableType('accessory');
                                                      setChartModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-purple/10 text-brand-purple font-extrabold text-[11px] rounded-xl hover:bg-brand-purple hover:text-white transition-all shadow-sm group cursor-pointer"
                                                  >
                                                    <Table className="w-3.5 h-3.5" />
                                                    <span>Click to see chart</span>
                                                  </button>
                                                ) : (
                                                  String(value)
                                                )}
                                              </td>
                                          </tr>
                                      ));
                                  })()}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
            </div>
          )}

          {/* Spacer to ensure the last card can be scrolled fully above the bottom actions */}
          <div className="h-28" />

        </div>
      </div>
      
      {/* Fixed Bottom Action Area */}
      <div className="absolute bottom-0 w-full p-6 bg-white/60 backdrop-blur-xl border-t border-slate-100 z-30 space-y-3">
          <button 
              onClick={handleDownloadReport}
              disabled={isGenerating || activeZone.zoneName === "No Data Available"}
              className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-brand-slate font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-premium hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
              {isGenerating ? (
                  <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Report...
                  </>
              ) : (
                  <>
                      <Download className="w-4 h-4 text-brand-ocean group-hover:scale-110 transition-transform" />
                      Download Zoning Report
                  </>
              )}
          </button>

          {(activeZone.ecodeLink || activeZone.ordinanceUrl) && (
            <a 
                href={activeZone.ecodeLink || activeZone.ordinanceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary w-full py-4 flex justify-center items-center gap-3 shadow-2xl shadow-brand-slate/30 group"
            >
                View Legal Ordinance
                <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          )}

          {onReportDataIssue && activeZone.zoneName !== "No Data Available" && (
            <button 
              onClick={onReportDataIssue}
              className="w-full text-center text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors mt-1 block pt-2"
            >
              Incorrect zoning or data issue? Report it here
            </button>
          )}
      </div>

      {/* Chart Modal (Multi-column Principal and Accessory Schedules) */}
      {chartModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-lg font-black text-brand-slate tracking-tight">
                  {modalTableType === 'accessory' ? 'Accessory Structure Schedule' : 'Principal Structure Schedule'}
                </h3>
                <p className="text-[10px] font-black text-brand-ocean uppercase tracking-widest mt-1">
                  {selectedProperty.district?.name || 'Zoning Jurisdiction'} — {activeZone.zoneName || activeZone.zone}
                </p>
              </div>
              <button onClick={() => setChartModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <Table className="w-4 h-4 text-brand-ocean" />
                  {modalTableType === 'accessory' ? 'Schedule of Dimensional Regulations (Accessory)' : 'Schedule of Dimensional Regulations (Principal)'}
                </h4>
                
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                  {(() => {
                    const tableDataRaw = modalTableType === 'accessory'
                      ? (activeZone.accessoryRequirements?.['Accessory Schedule Table'] || activeZone.accessoryRequirements?.['Schedule Table'] || activeZone.accessoryRequirements?.['Floor Area Table'])
                      : (activeZone.principalRequirements?.['Principal Schedule Table'] || activeZone.principalRequirements?.['Schedule Table'] || activeZone.principalRequirements?.['Floor Area Table'] || activeZone.principalRequirements?.['Livable Floor Area Table'] || activeZone.principalRequirements?.['Floor Area Ratio Table']);
                    
                    let parsedJson: any[] | null = null;
                    if (typeof tableDataRaw === 'string') {
                      try {
                        let p = JSON.parse(tableDataRaw);
                        if (typeof p === 'string') {
                          try { p = JSON.parse(p); } catch (e) {}
                        }
                        if (Array.isArray(p)) parsedJson = p;
                      } catch (e) {}
                    } else if (Array.isArray(tableDataRaw)) {
                      parsedJson = tableDataRaw;
                    }

                    if (parsedJson && parsedJson.length > 0) {
                      const columns = Object.keys(parsedJson[0]);

                      return (
                        <table className="w-full text-xs text-left whitespace-nowrap">
                          <thead className="bg-slate-100/80 border-b border-slate-200">
                            <tr>
                              {columns.map((col, cIdx) => (
                                <th key={cIdx} className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parsedJson.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                {columns.map((col, cIdx) => (
                                  <td key={cIdx} className={`px-4 py-3 ${cIdx === 0 ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>
                                    {row[col]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    }

                    if (typeof tableDataRaw === 'string' && tableDataRaw.trim().length > 0) {
                      const lines = tableDataRaw.split('\n').filter((l: string) => l.trim().length > 0);
                      return (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100/70 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider">Lot Area / Dwelling Type</th>
                              <th className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider">Maximum Permitted Floor Area</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lines.map((line: string, idx: number) => {
                              const parts = line.split(':');
                              return (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-bold text-slate-900">{parts[0]?.trim()}</td>
                                  <td className="px-4 py-3 text-slate-600 font-medium">{parts[1]?.trim() || parts[0]?.trim()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    }

                    if (activeZone.principalRequirements?.['Max Gross Floor Area Formulas']) {
                      return (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100/70 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider">Lot Area Tier</th>
                              <th className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider">Maximum Permitted GFA / FAR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td colSpan={2} className="px-4 py-4 text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                                {activeZone.principalRequirements['Max Gross Floor Area Formulas']}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      );
                    }

                    // Fallback for Mineola default GFA chart
                    return (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100/70 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider">Lot Area Tier</th>
                            <th className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider">Maximum Permitted GFA / FAR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-900">Less than 6,000 sq ft</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">50% of lot area</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-900">6,000 to 6,999 sq ft</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">2,900 sq ft + 30% of lot area exceeding 6,000 sq ft</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-900">7,000 to 9,999 sq ft</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">3,200 sq ft + 15% of lot area exceeding 7,000 sq ft</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-900">10,000 to 19,999 sq ft</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">3,650 sq ft + 12% of lot area exceeding 10,000 sq ft</td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })()}
                </div>

                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                  Note: Values are calculated and graduated based on Net Lot Area according to municipal dimensional zoning schedules.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setChartModalOpen(false)}
                  className="px-6 py-3 bg-brand-ocean text-white text-xs font-bold rounded-xl hover:bg-brand-ocean/90 transition-all shadow-md"
                >
                  Close Chart Window
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
