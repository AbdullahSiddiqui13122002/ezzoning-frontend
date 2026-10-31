"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Lock } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { fetchParcelDetails } from "@/utils/parcelLookup";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface Feature {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Feature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const setTargetCoordinates = useMapStore((state) => state.setTargetCoordinates);
  const setSelectedProperty = useMapStore((state) => state.setSelectedProperty);
  const setIsSearching = useMapStore((state) => state.setIsSearching);
  const pendingSearchAddress = useMapStore((state) => state.pendingSearchAddress);
  const setPendingSearchAddress = useMapStore((state) => state.setPendingSearchAddress);
  const user = useAuthStore((state) => state.user);
  const dbPlanTier = useAuthStore((state) => state.dbPlanTier);
  const planUpdatedAt = useAuthStore((state) => state.planUpdatedAt);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  useEffect(() => {
    const fetchPlaces = async () => {
      if (!query || query.length < 3 || !MAPBOX_TOKEN) {
        setResults([]);
        return;
      }
      try {
        // BBox roughly covers Long Island to improve relevance
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=us&types=address,place,poi&bbox=-74.04,40.54,-71.85,41.16`
        );
        const data = await response.json();
        
        // Strict state filter: Ensure search results are strictly within New York (resolves out-of-state/NJ fallbacks)
        const nyFeatures = (data.features || []).filter((f: any) => {
          const nameLower = f.place_name.toLowerCase();
          return nameLower.includes(', new york') || nameLower.includes(', ny') || nameLower.includes(' ny ');
        });
        
        setResults(nyFeatures);
        // Removed setIsOpen(true) to prevent dropdown reopening after selection
      } catch (error) {
        console.error("Geocoding failed", error);
      }
    };

    const debounceId = setTimeout(fetchPlaces, 300);
    return () => clearTimeout(debounceId);
  }, [query]);

  const handleSelect = async (feature: Feature) => {
    setQuery(feature.place_name);
    setIsOpen(false);
    
    // High-Intent Teaser Flow: Block unauthenticated users
    if (!user) {
      setShowSignupModal(true);
      return;
    }

    // Mapbox center array is [longitude, latitude]
    setTargetCoordinates(feature.center[0], feature.center[1], 16);
    setIsSearching(true);

    try {
      // Check search limits before proceeding
      let validSearchesCount = 0;
      if (user?.email) {
        const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history?email=${encodeURIComponent(user.email)}`);
        const historyData = await historyRes.json();
        const historyList = historyData.history || [];
        const validSearches = planUpdatedAt 
          ? historyList.filter((h: any) => new Date(h.createdAt).getTime() >= new Date(planUpdatedAt).getTime())
          : historyList;
        validSearchesCount = validSearches.length;
      }

      const freeLimit = process.env.NEXT_PUBLIC_FREE_SEARCH_LIMIT !== undefined 
        ? Number(process.env.NEXT_PUBLIC_FREE_SEARCH_LIMIT) 
        : 1;
      const searchLimit = dbPlanTier === "FREE" 
        ? freeLimit 
        : (dbPlanTier === "PAYG" 
            ? 1 
            : (dbPlanTier === "BASIC" ? 5 : Infinity)
          );
      
      if (validSearchesCount >= searchLimit) {
        setIsSearching(false);
        setShowUpgradeModal(true);
        return;
      }

      // 1. Fetch live parcel details (hidden/disabled for now)
      /*
      let parcelDetails = null;
      try {
        parcelDetails = await fetchParcelDetails(feature.center[0], feature.center[1]);
      } catch (err) {
        console.warn("Client-side live parcel lookup failed, falling back...", err);
      }
      */

      // 2. Query the backend point-in-polygon lookup API using coordinates
      const lookupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones/lookup?lng=${feature.center[0]}&lat=${feature.center[1]}`);
      
      const locationParam = encodeURIComponent(feature.place_name);
      const imageUrlBase = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${locationParam}&radius=250&source=outdoor&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`;
      
      let zone = null;
      let parcelDetails = null;
      try {
        const data = await lookupRes.json();
        if (lookupRes.ok) {
          zone = data;
          parcelDetails = data.parcel;
        } else {
          parcelDetails = data.parcel;
        }
      } catch (err) {
        console.error("Failed to parse lookup response:", err);
      }

      const matchedSBL = parcelDetails 
        ? `Sec: ${parcelDetails.section} Blk: ${parcelDetails.block} Lot: ${parcelDetails.lot}`
        : undefined;
      const actualLotArea = parcelDetails?.lotArea || undefined;

      if (zone) {
        setSelectedProperty({
          id: zone.id,
          address: feature.place_name,
          latitude: feature.center[1],
          longitude: feature.center[0],
          secBlkLot: matchedSBL,
          actualLotArea,
          imageUrl: imageUrlBase,
          zone: zone.name,
          zoneName: zone.classification,
          isFloodZone: Math.random() > 0.8,
          principalRequirements: zone.principalRequirements || {},
          accessoryRequirements: zone.accessoryRequirements || {},
          ordinanceUrl: zone.ordinanceUrl || undefined,
          ecodeLink: zone.ecodeLink || undefined,
          district: zone.district
        });

        // Record search history
        if (user?.email) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              address: feature.place_name,
              zone: zone.classification
            })
          }).catch(err => console.error("Failed to record history:", err));
        }

      } else {
        // Fallback: If no precise zone matches, try matching the district name from place_name to show General regulations
        const districtsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts`);
        const districts = await districtsRes.json();
        
        let matchedDistrict = null;
        for (const d of districts) {
          const cleanName = d.name.replace(/Town of |Village of |City of /gi, '').trim().toLowerCase();
          if (feature.place_name.toLowerCase().includes(cleanName)) {
            matchedDistrict = d;
            break;
          }
        }

        if (matchedDistrict && matchedDistrict.zones && matchedDistrict.zones.length > 0) {
          const generalZone = matchedDistrict.zones.find((z: any) => z.name === 'General District Regulations') || matchedDistrict.zones[0];
          
          setSelectedProperty({
            id: generalZone.id,
            address: feature.place_name,
            latitude: feature.center[1],
            longitude: feature.center[0],
            secBlkLot: matchedSBL,
            actualLotArea,
            imageUrl: imageUrlBase,
            zone: `Outside precise boundaries (${matchedDistrict.name})`,
            zoneName: generalZone.classification,
            isFloodZone: Math.random() > 0.8,
            principalRequirements: generalZone.principalRequirements || {},
            accessoryRequirements: generalZone.accessoryRequirements || {},
            ordinanceUrl: generalZone.ordinanceUrl || undefined,
            ecodeLink: generalZone.ecodeLink || undefined,
            district: {
              id: matchedDistrict.id,
              name: matchedDistrict.name,
              type: matchedDistrict.type,
              zones: matchedDistrict.zones
            }
          });

          // Record search history
          if (user?.email) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                address: feature.place_name,
                zone: generalZone.classification
              })
            }).catch(err => console.error("Failed to record history:", err));
          }
        } else {
          setSelectedProperty({
            address: feature.place_name,
            latitude: feature.center[1],
            longitude: feature.center[0],
            secBlkLot: matchedSBL,
            actualLotArea,
            imageUrl: imageUrlBase,
            zone: "Unzoned / Undefined",
            zoneName: "No Data Available",
            isFloodZone: false,
            principalRequirements: {},
            accessoryRequirements: {},
            ecodeLink: undefined
          });

          // Record search history for unzoned property
          if (user?.email) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                address: feature.place_name,
                zone: "No Data Available"
              })
            }).catch(err => console.error("Failed to record history:", err));
          }
        }
      }

    } catch (e) {
      console.error("Failed to fetch zone data from backend:", e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const processPendingSearch = async () => {
      if (pendingSearchAddress && pendingProcessedRef.current !== pendingSearchAddress) {
        pendingProcessedRef.current = pendingSearchAddress;
        setQuery(pendingSearchAddress);
        setPendingSearchAddress(null);
        
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pendingSearchAddress)}.json?access_token=${MAPBOX_TOKEN}&country=us&types=address,place,poi&bbox=-74.04,40.54,-71.85,41.16`
          );
          const data = await response.json();
          
          // Strict state filter: Ensure search results are strictly within New York
          const nyFeatures = (data.features || []).filter((f: any) => {
            const nameLower = f.place_name.toLowerCase();
            return nameLower.includes(', new york') || nameLower.includes(', ny') || nameLower.includes(' ny ');
          });

          if (nyFeatures.length > 0) {
            const bestMatch = nyFeatures[0];
            bestMatch.place_name = pendingSearchAddress;
            handleSelect(bestMatch);
          }
        } catch (error) {
          console.error("Auto-geocoding failed", error);
        }
      }
    };
    processPendingSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSearchAddress, setPendingSearchAddress]);

  return (
    <div className="flex-1 w-full relative" ref={wrapperRef}>
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-20">
        <Search className="h-5 w-5 text-brand-ocean" />
      </div>
      <input
        type="text"
        style={{ paddingLeft: '3.5rem' }}
        className="input-standard shadow-sm h-12"
        placeholder="Search an address on Long Island..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
      />

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-3 glass-panel rounded-3xl overflow-hidden shadow-premium max-h-80 py-2 border border-slate-100/50 bg-white/95 backdrop-blur-xl">
          {results.map((feature) => (
            <li
              key={feature.id}
              style={{ animationDelay: `${results.indexOf(feature) * 0.05}s` }}
              className="px-5 py-3.5 hover:bg-brand-ocean/5 cursor-pointer flex items-start gap-4 transition-colors group animate-reveal opacity-0"
              onClick={() => handleSelect(feature)}
            >
              <div className="bg-brand-ocean/10 p-2.5 rounded-xl group-hover:bg-brand-ocean/20 transition-colors">
                <MapPin className="w-4 h-4 text-brand-ocean shrink-0" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-800 tracking-tight">{feature.place_name.split(',')[0]}</span>
                <span className="text-[11px] text-brand-light-slate uppercase tracking-widest font-bold">
                  {feature.place_name.split(',').slice(1).join(',').trim()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* High-Intent Teaser Modal */}
      {showSignupModal && typeof window !== 'undefined' && require('react-dom').createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-brand-slate/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-premium max-w-md w-full p-10 relative overflow-hidden flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-ocean/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

            <div className="w-16 h-16 bg-brand-ocean/10 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-inner border border-brand-ocean/20">
              <Lock className="w-8 h-8 text-brand-ocean" />
            </div>

            <h2 className="text-2xl font-black tracking-tighter text-brand-slate mb-2 relative z-10">
              Unlock Your Free Report
            </h2>
            <p className="text-sm font-bold text-slate-500 mb-8 relative z-10 leading-relaxed">
              Create a free account to instantly view the detailed zoning report, principal requirements, and interactive map data for this property.
            </p>

            <Link href="/auth" className="btn-primary w-full py-4 text-[11px] uppercase tracking-widest font-black shadow-lg shadow-brand-ocean/20 relative z-10">
              Create Free Account
            </Link>

            <button 
              onClick={() => setShowSignupModal(false)}
              className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-slate transition-colors relative z-10"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Upgrade Modal (Limit Reached) */}
      {showUpgradeModal && typeof window !== 'undefined' && require('react-dom').createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-brand-slate/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-premium max-w-md w-full p-10 relative overflow-hidden flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-ocean/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-inner border border-rose-100">
              <Lock className="w-8 h-8 text-rose-500" />
            </div>

            <h2 className="text-2xl font-black tracking-tighter text-brand-slate mb-2 relative z-10">
              Search Limit Reached
            </h2>
            <p className="text-sm font-bold text-slate-500 mb-8 relative z-10 leading-relaxed">
              You have reached your maximum search limit for the {dbPlanTier} tier. Upgrade your account to continue researching properties.
            </p>

            <Link href="/pricing" className="btn-primary w-full py-4 text-[11px] uppercase tracking-widest font-black shadow-lg shadow-brand-ocean/20 relative z-10">
              Upgrade Subscription
            </Link>

            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-slate transition-colors relative z-10"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
