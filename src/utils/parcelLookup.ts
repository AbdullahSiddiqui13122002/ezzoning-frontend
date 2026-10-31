export interface ExternalParcel {
  address: string;
  section: string;
  block: string;
  lot: string;
  lotArea: number;
}

export function parseNassauSBL(sbl: string): { section: string; block: string; lot: string } | null {
  if (!sbl) return null;
  sbl = sbl.trim();

  // 1. Check if it's hyphenated (e.g. "7-265-1", "07-265-0001", "07-265-0001-00")
  if (sbl.includes('-')) {
    const parts = sbl.split('-');
    if (parts.length >= 3) {
      const section = parts[0].replace(/^0+/, '') || '0';
      const block = parts[1].replace(/^0+/, '') || '0';
      const lot = parts[2].replace(/^0+/, '') || '0';
      return { section, block, lot };
    }
  }

  // 2. Check if it's space-separated (e.g. "07 265 0001")
  if (sbl.includes(' ')) {
    const parts = sbl.split(/\s+/);
    if (parts.length >= 3) {
      const section = parts[0].replace(/^0+/, '') || '0';
      const block = parts[1].replace(/^0+/, '') || '0';
      const lot = parts[2].replace(/^0+/, '') || '0';
      return { section, block, lot };
    }
  }

  // 3. Check if it's a solid numeric/alphanumeric string (typically 9 or 11 characters: SSBBBBBLLLL[XX])
  const cleanSBL = sbl.replace(/[^a-zA-Z0-9]/g, '');
  if (cleanSBL.length >= 9) {
    const section = cleanSBL.substring(0, 2).replace(/^0+/, '') || '0';
    const block = cleanSBL.substring(2, 7).replace(/^0+/, '') || '0';
    const lot = cleanSBL.substring(7, 11).replace(/^0+/, '') || '0';
    return { section, block, lot };
  }

  return null;
}

// Custom fetch wrapper with timeout for standard HTTP requests
async function fetchWithTimeout(url: string, timeoutMs = 1500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// JSONP helper function to query non-CORS enabled ArcGIS MapServers directly from browser
function fetchJsonp(url: string, timeoutMs = 2500): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = `__arcgis_jsonp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`JSONP request to ${url} timed out`));
    }, timeoutMs);

    const script = document.createElement('script');
    script.src = `${url}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load JSONP script from ${url}`));
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    function cleanup() {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[callbackName];
    }

    document.body.appendChild(script);
  });
}

export async function fetchParcelDetails(lng: number, lat: number): Promise<ExternalParcel | null> {
  // 1. Try Suffolk County via NYS public MapServer first (it has very high uptime and is CORS-enabled)
  try {
    const suffolkUrl = `https://gisservices.its.ny.gov/arcgis/rest/services/NYS_Tax_Parcels_Public/MapServer/1/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=PARCEL_ADDR,SBL,SQ_FT,ACRES&returnGeometry=true&outSR=4326&f=json`;
    const res = await fetchWithTimeout(suffolkUrl, 2000);
    if (res.ok) {
      const data = await res.json();
      const features = data.features || [];
      if (features.length > 0) {
        const attrs = features[0].attributes || {};
        const sbl = attrs.SBL || '';
        
        // Parse Suffolk 20-character SBL format
        let section = sbl.substring(3, 6).replace(/^0+/, '') || '0';
        let block = sbl.substring(6, 11).replace(/^0+/, '') || '0';
        let lot = sbl.substring(11, 16).replace(/^0+/, '') || '0';
        
        let lotArea = parseFloat(attrs.SQ_FT) || 0;
        if (lotArea === 0 && attrs.ACRES > 0) {
          lotArea = Math.round(attrs.ACRES * 43560);
        }

        return {
          address: attrs.PARCEL_ADDR || '',
          section,
          block,
          lot,
          lotArea
        };
      }
    }
  } catch (e) {
    console.warn("Suffolk live parcel lookup bypassed/failed:", e);
  }

  // 2. Try Nassau County via multiple known Nassau GIS MapServer endpoints in parallel using JSONP
  const nassauUrls = [
    `https://gis.nassaucountyny.gov/arcgis/rest/services/parcel_boundaries/MapServer/0/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SBL,PRINT_KEY,PROP_ADDR,LOCATION,SECTION,BLOCK,LOT,LOT_AREA,ACRES,SQ_FT,SHAPE_AREA,Shape_Area,Shape.Area&returnGeometry=true&outSR=4326&f=json`,
    `https://gisbeast.nassaucountyny.gov/arcgis/rest/services/parcel_boundaries/MapServer/0/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SBL,PRINT_KEY,PROP_ADDR,LOCATION,SECTION,BLOCK,LOT,LOT_AREA,ACRES,SQ_FT,SHAPE_AREA,Shape_Area,Shape.Area&returnGeometry=true&outSR=4326&f=json`,
    `https://gis.nassaucountyny.gov/arcgis/rest/services/Layers/MapServer/1/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SBL,PRINT_KEY,PROP_ADDR,LOCATION,SECTION,SEC,BLOCK,BLK,LOT,LOT_AREA,ACRES,SQ_FT,SHAPE_AREA,Shape_Area,Shape.Area&returnGeometry=true&outSR=4326&f=json`,
    `https://gisbeast.nassaucountyny.gov/arcgis/rest/services/Layers/MapServer/1/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SBL,PRINT_KEY,PROP_ADDR,LOCATION,SECTION,SEC,BLOCK,BLK,LOT,LOT_AREA,ACRES,SQ_FT,SHAPE_AREA,Shape_Area,Shape.Area&returnGeometry=true&outSR=4326&f=json`,
    `https://gis.nassaucountyny.gov/server/rest/services/LandRecords/MapServer/1/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SBL,PRINT_KEY,PROP_ADDR,LOCATION,SECTION,SEC,BLOCK,BLK,LOT,LOT_AREA,ACRES,SQ_FT,SHAPE_AREA,Shape_Area,Shape.Area&returnGeometry=true&outSR=4326&f=json`
  ];

  const promises = nassauUrls.map(async (url) => {
    const data = await fetchJsonp(url, 2000);
    const features = data.features || [];
    if (features.length > 0) {
      return features[0].attributes;
    }
    throw new Error("Query failed");
  });

  try {
    const attrs = await Promise.any(promises);
    const getAttr = (keys: string[]) => {
      const matchedKey = Object.keys(attrs).find(k => keys.includes(k.toLowerCase()));
      return matchedKey ? attrs[matchedKey] : '';
    };

    let section = String(getAttr(['section', 'sec']) || '').trim();
    let block = String(getAttr(['block', 'blk']) || '').trim();
    let lot = String(getAttr(['lot']) || '').trim();
    const address = String(getAttr(['prop_addr', 'location', 'address', 'parcel_addr']) || '').trim();

    // Parse SBL if section/block/lot are missing or default
    if (!section || !block || !lot || section === '0' || block === '0' || lot === '0') {
      const sbl = String(getAttr(['sbl', 'print_key', 'printkey']) || '').trim();
      const parsed = parseNassauSBL(sbl);
      if (parsed) {
        section = parsed.section;
        block = parsed.block;
        lot = parsed.lot;
      }
    }

    const sqftVal = parseFloat(getAttr(['lot_area', 'sq_ft', 'sqft', 'sq_feet', 'shape_area', 'shape.area', 'shape_starea', 'shape.starea()'])) || 0;
    const acresVal = parseFloat(getAttr(['acres'])) || 0;
    
    let lotArea = sqftVal;
    if (lotArea > 0 && lotArea < 0.1) {
      lotArea = 0; // Filter out square degree values
    }
    if (lotArea === 0 && acresVal > 0) {
      lotArea = Math.round(acresVal * 43560);
    }

    return {
      address,
      section,
      block,
      lot,
      lotArea
    };
  } catch (e) {
    console.warn("All Nassau client-side JSONP parcel lookups failed or timed out:", e);
  }

  return null;
}
