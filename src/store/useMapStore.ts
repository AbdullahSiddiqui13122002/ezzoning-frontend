import { create } from 'zustand';

export interface PropertyDetails {
  id?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  secBlkLot?: string;
  actualLotArea?: number;
  imageUrl?: string;
  zone?: string;
  zoneName?: string;
  isFloodZone?: boolean;
  principalRequirements?: Record<string, string>;
  accessoryRequirements?: Record<string, string>;
  ordinanceUrl?: string;
  ecodeLink?: string;
  district?: {
    id: string;
    name: string;
    type: string;
    zones?: { id: string; name: string; classification: string }[];
  };
}

interface MapState {
  targetCoordinates: {
    longitude: number;
    latitude: number;
    zoom: number;
  } | null;
  selectedProperty: PropertyDetails | null;
  activeFilters: string[];
  isSearching: boolean;
  pendingSearchAddress: string | null;
  setTargetCoordinates: (lng: number, lat: number, zoom?: number) => void;
  setSelectedProperty: (property: PropertyDetails | null) => void;
  setPendingSearchAddress: (address: string | null) => void;
  toggleFilter: (filter: string) => void;
  setIsSearching: (isSearching: boolean) => void;
}


export const useMapStore = create<MapState>((set) => ({
  targetCoordinates: null,
  selectedProperty: null,
  activeFilters: ['RESIDENTIAL', 'COMMERCIAL', 'MIXED', 'INDUSTRIAL', 'OTHER'],
  isSearching: false,
  pendingSearchAddress: null,
  setTargetCoordinates: (longitude, latitude, zoom = 14) =>
    set({ targetCoordinates: { longitude, latitude, zoom } }),
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  setPendingSearchAddress: (address) => set({ pendingSearchAddress: address }),
  toggleFilter: (filter) => set((state) => ({
    activeFilters: state.activeFilters.includes(filter)
      ? state.activeFilters.filter((f) => f !== filter)
      : [...state.activeFilters, filter]
  })),
  setIsSearching: (isSearching) => set({ isSearching }),
}));
