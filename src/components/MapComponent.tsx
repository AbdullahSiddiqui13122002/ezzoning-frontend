"use client";

import { useState, useEffect, useMemo } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import type { CircleLayer } from 'mapbox-gl';
import { Layers, Lock, MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore } from '@/store/useMapStore';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { fetchParcelDetails } from '@/utils/parcelLookup';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const fillLayerStyle: any = {
    id: 'zoning-fills',
    type: 'fill',
    paint: {
        'fill-color': [
            'match',
            ['get', 'classification'],
            'RESIDENTIAL', '#10b981',
            'COMMERCIAL', '#0ea5e9',
            'MIXED', '#8b5cf6',
            'INDUSTRIAL', '#f97316',
            'OTHER', '#64748b',
            '#ccc'
        ],
        'fill-opacity': 0.35
    }
};

const lineLayerStyle: any = {
    id: 'zoning-lines',
    type: 'line',
    paint: {
        'line-color': [
            'match',
            ['get', 'classification'],
            'RESIDENTIAL', '#10b981',
            'COMMERCIAL', '#0ea5e9',
            'MIXED', '#8b5cf6',
            'INDUSTRIAL', '#f97316',
            'OTHER', '#64748b',
            '#ccc'
        ],
        'line-width': 2,
        'line-opacity': 0.8
    }
};

const hoverOutlineLayerStyle: any = {
    id: 'zoning-hover-outline',
    type: 'line',
    paint: {
        'line-color': '#ef4444', // Red outline for hovering
        'line-width': 3,
        'line-opacity': 0.95
    }
};

const selectedOutlineLayerStyle: any = {
    id: 'zoning-selected-outline',
    type: 'line',
    paint: {
        'line-color': '#ef4444', // Red outline for selected zone
        'line-width': 4,
        'line-opacity': 1.0
    }
};

const municipalFillLayerStyle: any = {
    id: 'municipal-fills',
    type: 'fill',
    paint: {
        'fill-color': [
            'match',
            ['get', 'dynamicClassification'],
            'RESIDENTIAL', '#10b981',
            'COMMERCIAL', '#0ea5e9',
            'MIXED', '#8b5cf6',
            'INDUSTRIAL', '#f97316',
            'OTHER', '#64748b',
            '#64748b'
        ],
        'fill-opacity': 0.08
    }
};

const municipalLineLayerStyle: any = {
    id: 'municipal-lines',
    type: 'line',
    paint: {
        'line-color': [
            'match',
            ['get', 'dynamicClassification'],
            'RESIDENTIAL', '#10b981',
            'COMMERCIAL', '#0ea5e9',
            'MIXED', '#8b5cf6',
            'INDUSTRIAL', '#f97316',
            'OTHER', '#64748b',
            '#64748b'
        ],
        'line-width': 2.5,
        'line-dasharray': [3, 3], // Beautiful dashed outline
        'line-opacity': 0.75
    }
};

export default function MapComponent() {
    const [geoData, setGeoData] = useState<any>(null);
    const [viewState, setViewState] = useState({
        longitude: -73.13496, 
        latitude: 40.789142,
        zoom: 9.5
    });
    const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
    const [showSignupModal, setShowSignupModal] = useState(false);

    const targetCoordinates = useMapStore((state) => state.targetCoordinates);
    const activeFilters = useMapStore((state) => state.activeFilters);
    const setSelectedProperty = useMapStore((state) => state.setSelectedProperty);
    const selectedProperty = useMapStore((state) => state.selectedProperty);
    const setIsSearching = useMapStore((state) => state.setIsSearching);
    const user = useAuthStore((state) => state.user);

    const handleMouseMove = (event: any) => {
        const features = event.features || [];
        const preciseFeature = features.find((f: any) => f.layer.id === 'zoning-fills');
        const feature = preciseFeature || features[0];
        if (feature) {
            setHoveredZoneId(feature.properties.id || null);
        } else {
            setHoveredZoneId(null);
        }
    };

    const handleMouseLeave = () => {
        setHoveredZoneId(null);
    };

    // Compute zoning geojson data
    const displayZoningData = useMemo(() => {
        if (!geoData) return null;
        const zoningFeatures = geoData.features.filter((f: any) => {
            if (f.properties?.isMunicipal) return false;
            return activeFilters.includes(f.properties?.classification);
        });
        console.log("Computed displayZoningData features:", zoningFeatures.length);
        return {
            type: 'FeatureCollection' as const,
            features: zoningFeatures
        };
    }, [geoData, activeFilters]);

    // Compute municipal boundary geojson data
    const displayMunicipalData = useMemo(() => {
        if (!geoData) return null;
        const municipalFeatures = geoData.features
            .filter((f: any) => {
                if (!f.properties?.isMunicipal) return false;
                const districtClasses = f.properties?.districtClassifications || [];
                return districtClasses.some((c: string) => activeFilters.includes(c));
            })
            .map((f: any) => {
                const isSelected = selectedProperty && selectedProperty.district?.id === f.properties?.districtId;
                const classification = isSelected ? selectedProperty.zoneName : (f.properties?.classification || 'OTHER');
                
                return {
                    ...f,
                    properties: {
                        ...f.properties,
                        dynamicClassification: classification
                    }
                };
            });
        console.log("Computed displayMunicipalData features:", municipalFeatures.length);
        return {
            type: 'FeatureCollection' as const,
            features: municipalFeatures
        };
    }, [geoData, activeFilters, selectedProperty]);

    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        console.log("MapComponent: Fetching live map boundaries from:", `${apiUrl}/zones/map-data`);
        
        fetch(`${apiUrl}/zones/map-data`)
            .then(res => {
                console.log("MapComponent: Fetch response status:", res.status);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("MapComponent: Successfully fetched map data:", data);
                if (data && data.type === 'FeatureCollection') {
                    setGeoData(data);
                } else {
                    console.warn("MapComponent: Fetched data is not a FeatureCollection:", data);
                }
            })
            .catch(err => {
                console.error("MapComponent: Failed to fetch live map boundaries:", err);
            });
    }, []);

    useEffect(() => {
        if (targetCoordinates) {
            setViewState({
                longitude: targetCoordinates.longitude,
                latitude: targetCoordinates.latitude,
                zoom: targetCoordinates.zoom
            });
        }
    }, [targetCoordinates]);

    const handleMapClick = async (event: any) => {
        // High-Intent Teaser Flow: Block unauthenticated users
        if (!user) {
            setShowSignupModal(true);
            return;
        }

        const features = event.features || [];
        const preciseFeature = features.find((f: any) => f.layer.id === 'zoning-fills');
        const feature = preciseFeature || features[0];
        if (!feature) return;

        const zoneId = feature.properties.id;
        const [lng, lat] = [event.lngLat.lng, event.lngLat.lat];

        setIsSearching(true);

        try {
            // 1. Reverse Geocode to get a human readable address
            const geoRes = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
            );
            const geoData = await geoRes.json();
            const address = geoData.features?.[0]?.place_name || `Lng: ${lng.toFixed(4)}, Lat: ${lat.toFixed(4)}`;

            // 2. Fetch live parcel details (hidden/disabled for now)
            /*
            let parcelDetails = null;
            try {
                parcelDetails = await fetchParcelDetails(lng, lat);
            } catch (err) {
                console.warn("Client-side live parcel lookup failed, falling back...", err);
            }
            */

            // 3. Fetch specific zone constraints and parcel details from coordinates lookup API
            const lookupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones/lookup?lng=${lng}&lat=${lat}`);
            
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
            const locationParam = address.startsWith('Lng:') ? `${lat},${lng}` : encodeURIComponent(address);
            const imageUrlBase = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${locationParam}&radius=250&source=outdoor&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`;

            if (zone) {
                setSelectedProperty({
                    id: zone.id,
                    address,
                    latitude: lat,
                    longitude: lng,
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

                // Record search history for map click
                if (user?.email) {
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: user.email,
                            address,
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
                    if (address.toLowerCase().includes(cleanName)) {
                        matchedDistrict = d;
                        break;
                    }
                }

                if (matchedDistrict && matchedDistrict.zones && matchedDistrict.zones.length > 0) {
                    const generalZone = matchedDistrict.zones.find((z: any) => z.name === 'General District Regulations') || matchedDistrict.zones[0];
                    
                    setSelectedProperty({
                        id: generalZone.id,
                        address,
                        latitude: lat,
                        longitude: lng,
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
                                address,
                                zone: generalZone.classification
                            })
                        }).catch(err => console.error("Failed to record history:", err));
                    }
                } else {
                    setSelectedProperty({
                        address,
                        latitude: lat,
                        longitude: lng,
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
                                address,
                                zone: "No Data Available"
                            })
                        }).catch(err => console.error("Failed to record history:", err));
                    }
                }
            }

        } catch (error) {
            console.error("Map click handling failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="w-full h-full relative">
            {MAPBOX_TOKEN && MAPBOX_TOKEN !== "replace_this_with_your_actual_mapbox_public_token" ? (
                <>
                    <Map
                        {...viewState}
                        onMove={(evt: any) => setViewState(evt.viewState)}
                        onClick={handleMapClick}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        interactiveLayerIds={['zoning-fills', 'municipal-fills']}
                        cursor="pointer"
                        mapStyle="mapbox://styles/mapbox/light-v11"
                        mapboxAccessToken={MAPBOX_TOKEN}
                        style={{ width: '100%', height: '100%' }}
                    >
                        {displayMunicipalData && (
                            <Source id="municipal-source" type="geojson" data={displayMunicipalData}>
                                <Layer {...municipalFillLayerStyle} />
                                <Layer {...municipalLineLayerStyle} />
                                <Layer 
                                    {...hoverOutlineLayerStyle} 
                                    id="municipal-hover-outline" 
                                    filter={['==', ['get', 'id'], hoveredZoneId || '']} 
                                />
                                <Layer 
                                    {...selectedOutlineLayerStyle} 
                                    id="municipal-selected-outline" 
                                    filter={['==', ['get', 'id'], selectedProperty?.id || '']} 
                                />
                            </Source>
                        )}
                        {displayZoningData && (
                            <Source id="zoning-source" type="geojson" data={displayZoningData}>
                                <Layer {...fillLayerStyle} />
                                <Layer {...lineLayerStyle} />
                                <Layer {...hoverOutlineLayerStyle} filter={['==', ['get', 'id'], hoveredZoneId || '']} />
                                <Layer {...selectedOutlineLayerStyle} filter={['==', ['get', 'id'], selectedProperty?.id || '']} />
                            </Source>
                        )}
                        {selectedProperty?.latitude && selectedProperty?.longitude && (
                            <Marker
                                longitude={selectedProperty.longitude}
                                latitude={selectedProperty.latitude}
                                anchor="bottom"
                            >
                                <div className="flex flex-col items-center animate-bounce">
                                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-brand-ocean text-white shadow-lg border-2 border-white">
                                        <MapPin className="w-5 h-5 text-white" />
                                        <div className="absolute inset-0 rounded-full bg-brand-ocean/30 animate-ping -z-10" />
                                    </div>
                                    <div className="w-2 h-2 bg-brand-ocean border-r-2 border-b-2 border-white transform rotate-45 -mt-1 shadow-md" />
                                </div>
                            </Marker>
                        )}
                    </Map>

                    {/* Map Legend Overlay removed to prevent overlap with Zoning Filters */}
                </>
            ) : (
                <div className="flex items-center justify-center w-full h-full bg-slate-100 flex-col gap-4 text-center p-8">
                    <p className="text-xl font-semibold text-slate-700">Mapbox Token Required</p>
                    <p className="text-slate-500 max-w-md">
                        Please add your Mapbox Public Token to the <code>.env.local</code> file as <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the interactive map.
                    </p>
                </div>
            )}

            {/* Signup Modal (Teaser Flow) */}
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
        </div>
    );
}
