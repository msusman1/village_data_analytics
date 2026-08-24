import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../lib/api';
import { House } from '../../types';
import { MapPin, Search, Layers, Compass, Users, Home } from 'lucide-react';
import { Badge } from '../ui/Badge';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to dynamically recenter map
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface VillageMapViewProps {
  onSelectHouse?: (houseId: number) => void;
}

const normalizeMapHouse = (house: any): House => ({
  ...house,
  house_number: house.house_number ?? house.houseNumber ?? '',
  parcel_id: house.parcel_id ?? house.parcelId ?? '',
  latitude: Number(house.latitude),
  longitude: Number(house.longitude),
  house_type: house.house_type ?? house.houseType ?? 'OTHER',
  ownership_type: house.ownership_type ?? house.ownershipType ?? 'UNKNOWN',
  families_count: house.families_count ?? house._count?.families ?? 0,
  population: house.population ?? 0,
});

export const VillageMapView: React.FC<VillageMapViewProps> = ({ onSelectHouse }) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHouseNumber, setSelectedHouseNumber] = useState<string>('20');
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [nearbyHouses, setNearbyHouses] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([32.4945, 74.5228]);
  const [mapZoom, setMapZoom] = useState<number>(16);

  useEffect(() => {
    loadMapHouses();
  }, []);

  const loadMapHouses = async () => {
    try {
      setLoading(true);
      const data = await api.getMapHouses();
      const payload = data as House[] | { items?: House[] };
      const rawHouses = Array.isArray(payload) ? payload : payload.items || [];
      const normalizedHouses = rawHouses
        .map(normalizeMapHouse)
        .filter((house) => Number.isFinite(house.latitude) && Number.isFinite(house.longitude));
      setHouses(normalizedHouses);
      if (normalizedHouses.length > 0) {
        setMapCenter([normalizedHouses[0].latitude, normalizedHouses[0].longitude]);
      }
    } catch (err) {
      console.error('Failed to load map houses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunProximityAnalysis = async () => {
    if (!selectedHouseNumber) return;
    try {
      const data = await api.getNearbyHouses(selectedHouseNumber, radiusMeters);
      setNearbyHouses(data);
      const target = houses.find((h) => h.house_number === selectedHouseNumber);
      if (target) {
        setMapCenter([target.latitude, target.longitude]);
        setMapZoom(16);
      }
    } catch (err) {
      console.error('Proximity analysis error:', err);
    }
  };

  useEffect(() => {
    if (houses.length > 0) {
      handleRunProximityAnalysis();
    }
  }, [selectedHouseNumber, radiusMeters, houses]);

  const filteredHouses = houses.filter((h) => {
    const matchesType = filterType === 'ALL' || h.house_type === filterType;
    const matchesSearch =
      !searchQuery ||
      h.house_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.parcel_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const targetHouse = houses.find((h) => h.house_number === selectedHouseNumber);

  return (
    <div className="space-y-4">
      {/* Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search house # or parcel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* House Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">All House Types</option>
              <option value="PUCCA">Pucca (Brick & Concrete)</option>
              <option value="SEMI_PUCCA">Semi-Pucca</option>
              <option value="KACHA">Kacha (Traditional Mud)</option>
            </select>
          </div>

          {/* Target House for Proximity */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Focus House:</span>
            <select
              value={selectedHouseNumber}
              onChange={(e) => setSelectedHouseNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            >
              {houses.map((h) => (
                <option key={h.id} value={h.house_number}>
                  House #{h.house_number} ({h.population} residents)
                </option>
              ))}
            </select>
          </div>

          {/* Radius Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Radius:</span>
            <select
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value={200}>200 meters</option>
              <option value={500}>500 meters</option>
              <option value={800}>800 meters</option>
              <option value={1000}>1 kilometer (1000m)</option>
              <option value={1500}>1.5 kilometers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map + Nearby Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Canvas */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs relative h-[520px] z-0">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Loading geospatial coordinates for Lakra Khurd...
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <MapRecenter center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Target House Proximity Radius Circle */}
              {targetHouse && (
                <Circle
                  center={[targetHouse.latitude, targetHouse.longitude]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: '#059669',
                    fillColor: '#10b981',
                    fillOpacity: 0.12,
                    weight: 2,
                    dashArray: '4, 6',
                  }}
                />
              )}

              {/* Plotted Houses */}
              {filteredHouses.map((h) => {
                const isSelected = h.house_number === selectedHouseNumber;
                return (
                  <Marker
                    key={h.id}
                    position={[h.latitude, h.longitude]}
                    icon={defaultIcon}
                  >
                    <Popup>
                      <div className="p-1 max-w-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 mb-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">
                            House #{h.house_number}
                          </h4>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                            Parcel: {h.parcel_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Structure:</strong> {h.house_type} ({h.ownership_type})
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          <strong>Demographics:</strong> {h.population || 0} residents • {h.families_count || 1} family unit(s)
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">
                          GPS: {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={() => setSelectedHouseNumber(h.house_number)}
                            className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium"
                          >
                            Set Center
                          </button>
                          {onSelectHouse && (
                            <button
                              onClick={() => onSelectHouse(h.id)}
                              className="text-[11px] px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-medium"
                            >
                              Inspect
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Nearby Analysis Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Within {radiusMeters}m of House #{selectedHouseNumber}
              </h3>
            </div>
            <Badge variant="primary" size="sm">
              {nearbyHouses.length} Houses
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 divide-y divide-slate-100 pr-1">
            {nearbyHouses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No nearby houses found in selected radius.
              </p>
            ) : (
              nearbyHouses.map((h, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setMapCenter([h.latitude, h.longitude]);
                    setMapZoom(17);
                  }}
                  className="py-2.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-slate-400" /> House #{h.house_number}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 font-medium">
                      {h.distance_meters}m away
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{h.population} residents ({h.families_count} families)</span>
                    <span className="font-mono">Parcel {h.parcel_id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-xl">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Cluster Population:</span>
              <span className="font-bold text-slate-900">
                {nearbyHouses.reduce((acc, h) => acc + (h.population || 0), 0)} people
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
