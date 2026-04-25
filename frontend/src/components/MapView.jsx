import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix typical Leaflet icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Punjab Center (Ludhiana roughly)
const MAP_CENTER = [31.100965, 75.357275];

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-bin-icon-container',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

const truckIcon = L.divIcon({
  className: 'truck-marker-container',
  html: `<div style="font-size: 28px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5)); transform: translate(-50%, -50%);">🚛</div>`,
  iconSize: [30, 30],
  iconAnchor: [0, 0],
  popupAnchor: [0, -15]
});

const getStatusColor = (status, isCollected) => {
  if (isCollected) return '#10b981'; // Green
  if (status === 'Warning') return '#f59e0b'; // Yellow
  if (status === 'Critical') return '#ef4444'; // Red
  return '#3b82f6'; // Blue for normal
};

export default function MapView({ bins }) {
  const [truckPosIndex, setTruckPosIndex] = useState(0);

  // Group bins by assigned driver to simulate multiple trucks natively!
  const driverGroups = {};
  bins.forEach(bin => {
    // Treat unassigned bins as having no truck route, or fallback to an arbitrary 'city' truck
    const driverId = bin.assignedTo || 'UNASSIGNED';
    if (!driverGroups[driverId]) driverGroups[driverId] = [];
    driverGroups[driverId].push(bin);
  });

  const allRoutes = Object.keys(driverGroups).map(driverId => {
    if (driverId === 'UNASSIGNED') return null; // Unassigned bins don't get a truck

    const groupBins = driverGroups[driverId];
    if (groupBins.length === 0) return null;

    // Build route: start at first bin + offset, go to all bins, back to start
    const startPos = [groupBins[0].coords[0] - 0.05, groupBins[0].coords[1] - 0.05];
    const routeCoords = [startPos, ...groupBins.map(b => b.coords), startPos];
    
    // Interpolate points natively for 2-3s step animations simulating vehicle movements
    const interpolated = [];
    if (routeCoords.length > 1) {
      for (let i = 0; i < routeCoords.length - 1; i++) {
        const start = routeCoords[i];
        const end = routeCoords[i + 1];
        const steps = 15;
        for (let j = 0; j < steps; j++) {
          interpolated.push([
            start[0] + (end[0] - start[0]) * (j / steps),
            start[1] + (end[1] - start[1]) * (j / steps)
          ]);
        }
      }
    }
    return { driverId, interpolated, rawRoute: routeCoords };
  }).filter(Boolean);

  useEffect(() => {
    if (allRoutes.length === 0) return;
    const interval = setInterval(() => {
      setTruckPosIndex((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [allRoutes.length]);

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden shadow-lg border border-slate-200/60 bg-white relative z-0">
      <MapContainer 
        center={MAP_CENTER} 
        zoom={9} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw Bin Markers */}
        {bins.map((bin, i) => (
          <Marker 
            key={bin._id || i} 
            position={bin.coords} 
            icon={createCustomIcon(getStatusColor(bin.status, bin.isCollected))}
          >
            <Popup className="rounded-xl overflow-hidden shadow-xl border-0">
              <div className="text-center font-sans">
                <div className="bg-slate-50 -mx-5 -mt-4 mb-3 py-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide px-4">{bin.location}</h3>
                </div>
                <div className="px-1 pb-1 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className="font-semibold text-slate-700">{bin.isCollected ? 'COLLECTED' : bin.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Fill Level</span>
                    <span 
                      className="font-bold py-1 px-3 rounded-full text-white text-xs shadow-sm" 
                      style={{ backgroundColor: getStatusColor(bin.status, bin.isCollected) }}
                    >
                      {bin.fillLevel}%
                    </span>
                  </div>
                  {bin.assignedTo && <div className="text-xs text-indigo-500 font-bold">Driver Dispatched</div>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Draw routes and trucks for each driver */}
        {allRoutes.map(({ driverId, interpolated, rawRoute }, idx) => {
          const currentIndex = truckPosIndex % Math.max(1, interpolated.length);
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
          const routeColor = colors[idx % colors.length];

          return (
            <React.Fragment key={driverId}>
              <Polyline 
                positions={rawRoute} 
                pathOptions={{ 
                  color: routeColor, 
                  weight: 4, 
                  dashArray: '8, 8', 
                  opacity: 0.7,
                  lineCap: 'round'
                }} 
              />
              {interpolated.length > 0 && (
                <Marker 
                  position={interpolated[currentIndex]} 
                  icon={truckIcon}
                >
                  <Popup>
                    <div className="font-semibold text-center text-slate-800 px-2 py-1">
                      <span className="text-lg">Truck {idx + 1}</span><br/>
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md inline-block mt-1">Driver: {driverId.substring(0, 5)}...</span>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
