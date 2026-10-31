"use client";

import React from 'react';

interface SetbackDiagramProps {
  requirements?: Record<string, string>;
}

// Helper to format raw database requirement strings into clean, concise diagram labels
const formatDimensionForDiagram = (val: string): string => {
  if (!val || val === "N/A" || val === "undefined") return "N/A";

  let clean = String(val).trim();

  // 1. If parenthesis exists, check if text before parenthesis has numbers
  if (clean.includes('(')) {
    const beforeParen = clean.split('(')[0].trim();
    if (/\d/.test(beforeParen)) {
      clean = beforeParen;
    } else {
      const matchInside = clean.match(/\(([^)]+)\)/);
      if (matchInside && /\d/.test(matchInside[1])) {
        clean = matchInside[1].trim();
      }
    }
  }

  // 2. Take first clause before any semicolon
  if (clean.includes(';')) {
    clean = clean.split(';')[0].trim();
  }

  // 3. Remove leading noise words
  clean = clean.replace(/^(minimum|min|standard|at least|max|maximum)\s+/i, '');

  // 4. Abbreviate common units
  clean = clean
    .replace(/\bfeet\b/gi, 'ft')
    .replace(/\bfoot\b/gi, 'ft')
    .replace(/\bsquare feet\b/gi, 'sq ft')
    .replace(/\bsq\.?\s*ft\.?\b/gi, 'sq ft')
    .replace(/\binches\b/gi, 'in');

  // 5. If string is still over 20 characters, extract number + unit
  if (clean.length > 20) {
    const match = clean.match(/^(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:ft|sq ft|acres|in|stories|%|use[s]?))(?:\s+([a-z]+))?/i);
    if (match) {
      clean = match[0].trim();
    } else {
      clean = clean.substring(0, 20).trim() + '...';
    }
  }

  return clean;
};

const SetbackDiagram: React.FC<SetbackDiagramProps> = ({ requirements = {} }) => {
  // Helper to fuzzy match keys from the database JSON
  const findValue = (keywords: string[]) => {
    const entry = Object.entries(requirements).find(([key]) =>
      keywords.some(k => key.toLowerCase().includes(k.toLowerCase()))
    );
    return entry ? entry[1] : "N/A";
  };

  // Extract raw dimensions
  const rawFront = findValue(['front yard', 'front setback']);
  const rawSide = findValue(['side yard', 'side setback', 'side yard setback']);
  const rawRear = findValue(['rear yard', 'rear setback', 'rear yard setback']);
  const rawWidth = findValue(['width', 'frontage', 'lot width']);
  const rawDepth = findValue(['depth', 'lot depth']);

  // Format concise diagram labels
  const front = formatDimensionForDiagram(rawFront);
  const side = formatDimensionForDiagram(rawSide);
  const rear = formatDimensionForDiagram(rawRear);
  const width = formatDimensionForDiagram(rawWidth);
  const depth = formatDimensionForDiagram(rawDepth);

  return (
    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 shadow-inner overflow-hidden relative">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-ocean/5 rounded-full blur-3xl -mr-16 -mt-16" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="space-y-0.5">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Plot Plan</h5>
          <p className="text-[9px] text-slate-400 font-medium italic">Illustrative Diagram</p>
        </div>
        <div className="px-2 py-1 bg-white border border-slate-200 text-brand-ocean rounded-lg text-[9px] font-black shadow-sm tracking-tighter">
          DIMENSIONAL VIEW
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[240px] mx-auto z-10 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm overflow-visible">
          {/* Road / Sidewalk Area */}
          <rect x="-10" y="190" width="220" height="20" fill="#f8fafc" />
          <line x1="-10" y1="190" x2="210" y2="190" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 2" />
          <text x="100" y="204" className="text-[8px] font-black fill-slate-300" textAnchor="middle">STREET / RIGHT-OF-WAY</text>

          {/* Lot Boundary */}
          <rect x="20" y="20" width="160" height="160" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6 4" rx="2" />
          
          {/* Main Structure (House) */}
          <rect x="55" y="55" width="90" height="90" fill="#f8fafc" stroke="#475569" strokeWidth="2" rx="4" />
          <path d="M55 55 L100 30 L145 55" fill="none" stroke="#475569" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /> {/* Roof indicator */}
          
          {/* Garage / Extension */}
          <rect x="115" y="115" width="30" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" rx="2" />
          
          {/* Setback Arrows & Labels */}
          
          {/* Front Setback (Bottom) */}
          <g>
            <title>{`Front Setback: ${rawFront}`}</title>
            <line x1="100" y1="145" x2="100" y2="180" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M97 176l3 4 3-4" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <path d="M97 149l3-4 3 4" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <rect x="35" y="157" width="130" height="16" rx="8" fill="white" stroke="#e0f2fe" strokeWidth="1" />
            <text x="100" y="168" className="text-[7.5px] font-black fill-brand-ocean" textAnchor="middle">FRONT: {front}</text>
          </g>

          {/* Side Setback (Right) */}
          <g>
            <title>{`Side Setback: ${rawSide}`}</title>
            <line x1="145" y1="100" x2="180" y2="100" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M176 97l4 3-4 3" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <path d="M149 97l-4 3 4 3" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <rect x="135" y="92" width="62" height="16" rx="8" fill="white" stroke="#e0f2fe" strokeWidth="1" />
            <text x="166" y="103" className="text-[7px] font-black fill-brand-ocean" textAnchor="middle">SIDE: {side}</text>
          </g>

          {/* Rear Setback (Top) */}
          <g>
            <title>{`Rear Setback: ${rawRear}`}</title>
            <line x1="100" y1="55" x2="100" y2="20" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M97 24l3-4 3 4" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <path d="M97 51l3 4 3-4" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <rect x="35" y="27" width="130" height="16" rx="8" fill="white" stroke="#e0f2fe" strokeWidth="1" />
            <text x="100" y="38" className="text-[7.5px] font-black fill-brand-ocean" textAnchor="middle">REAR: {rear}</text>
          </g>

          {/* Lot Dimensions */}
          {/* Width */}
          <g>
             <title>{`Lot Width: ${rawWidth}`}</title>
             <line x1="20" y1="10" x2="180" y2="10" stroke="#94a3b8" strokeWidth="1" />
             <line x1="20" y1="7" x2="20" y2="13" stroke="#94a3b8" strokeWidth="1" />
             <line x1="180" y1="7" x2="180" y2="13" stroke="#94a3b8" strokeWidth="1" />
             <text x="100" y="6" className="text-[7.5px] font-extrabold fill-slate-500" textAnchor="middle">LOT WIDTH: {width}</text>
          </g>

          {/* Depth */}
          <g>
             <title>{`Lot Depth: ${rawDepth}`}</title>
             <line x1="10" y1="20" x2="10" y2="180" stroke="#94a3b8" strokeWidth="1" />
             <line x1="7" y1="20" x2="13" y2="20" stroke="#94a3b8" strokeWidth="1" />
             <line x1="7" y1="180" x2="13" y2="180" stroke="#94a3b8" strokeWidth="1" />
             <text x="8" y="100" className="text-[7.5px] font-extrabold fill-slate-500" textAnchor="middle" transform="rotate(-90, 8, 100)">DEPTH: {depth}</text>
          </g>
        </svg>
      </div>
      
      <div className="mt-6 flex flex-wrap gap-3 z-10">
         <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-100 rounded-lg shadow-sm">
            <div className="w-2 h-2 rounded-full bg-brand-ocean ring-4 ring-brand-ocean/10" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Setback Limits</span>
         </div>
         <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-100 rounded-lg shadow-sm">
            <div className="w-2 h-2 bg-slate-100 border-2 border-slate-600 rounded-sm" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Primary Structure</span>
         </div>
      </div>
    </div>
  );
};

export default SetbackDiagram;
