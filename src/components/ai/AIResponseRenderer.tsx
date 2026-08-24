import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AIVisualization } from '../../types';
import { MapPin, Table as TableIcon, BarChart3, PieChart as PieIcon, Award } from 'lucide-react';

const COLORS = ['#059669', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#0d9488', '#ea580c', '#475569'];

// Fix leaflet default icon in react-leaflet
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface AIResponseRendererProps {
  visualizations: AIVisualization[];
  onSelectHouse?: (houseNumber: string) => void;
}

export const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({
  visualizations,
  onSelectHouse,
}) => {
  if (!visualizations || visualizations.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {visualizations.map((vis, idx) => {
        switch (vis.type) {
          case 'kpi':
            return (
              <div
                key={idx}
                className="bg-white border border-emerald-100 rounded-xl p-4 shadow-xs bg-gradient-to-br from-emerald-50/40 via-white to-white flex items-start space-x-3"
              >
                <div className="p-2.5 rounded-lg bg-emerald-100/80 text-emerald-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    {vis.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                    {vis.value}
                  </p>
                  {vis.subValue && (
                    <p className="text-xs text-slate-500 mt-1">{vis.subValue}</p>
                  )}
                </div>
              </div>
            );

          case 'table':
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
              >
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TableIcon className="w-4 h-4 text-slate-500" />
                    <h4 className="text-xs font-semibold text-slate-900 tracking-tight">
                      {vis.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {vis.rows.length} record{vis.rows.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100/60 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        {vis.columns.map((col) => (
                          <th key={col.key} className="px-3.5 py-2.5">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vis.rows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {vis.columns.map((col) => (
                            <td key={col.key} className="px-3.5 py-2 whitespace-nowrap">
                              {row[col.key] !== undefined && row[col.key] !== null
                                ? String(row[col.key])
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );

          case 'bar_chart':
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-semibold text-slate-900">{vis.title}</h4>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vis.data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis
                        dataKey={vis.xKey}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey={vis.yKey} fill="#059669" radius={[4, 4, 0, 0]}>
                        {vis.data.map((entry, entryIdx) => (
                          <Cell
                            key={`cell-${entryIdx}`}
                            fill={COLORS[entryIdx % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );

          case 'donut_chart':
          case 'pie_chart':
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <PieIcon className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-semibold text-slate-900">{vis.title}</h4>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vis.data}
                        dataKey={vis.valueKey}
                        nameKey={vis.nameKey}
                        cx="50%"
                        cy="50%"
                        innerRadius={vis.type === 'donut_chart' ? 45 : 0}
                        outerRadius={75}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {vis.data.map((entry, entryIdx) => (
                          <Cell
                            key={`donut-${entryIdx}`}
                            fill={COLORS[entryIdx % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );

          case 'map':
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
              >
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-semibold text-slate-900">{vis.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {vis.markers.length} house pin{vis.markers.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="h-64 w-full relative z-0">
                  <MapContainer
                    center={vis.center}
                    zoom={vis.zoom || 16}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {vis.markers.map((m) => (
                      <Marker
                        key={m.id}
                        position={[m.latitude, m.longitude]}
                        icon={customIcon}
                      >
                        <Popup>
                          <div className="p-1">
                            <h5 className="font-bold text-slate-900 text-sm">
                              House #{m.house_number}
                            </h5>
                            <p className="text-xs text-slate-600 mt-1">{m.info}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Pop: {m.population} • Families: {m.families_count}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
