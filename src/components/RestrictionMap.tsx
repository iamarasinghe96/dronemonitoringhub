import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DEFAULT_ZONES } from '../constants';
import { Zone } from '../types';
import { subscribeToZones } from '../services/zonesService';

const getZoneColors = (type: string) => {
  const t = type?.toUpperCase() ?? '';
  if (t.includes('PROHIBITED')) return { fill: '#ef4444', stroke: '#991b1b', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
  if (t.includes('RESTRICTED')) return { fill: '#f97316', stroke: '#9a3412', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' };
  return { fill: '#eab308', stroke: '#854d0e', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
};

const RestrictionMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);

  useEffect(() => {
    const unsub = subscribeToZones(z => setZones(z));
    return unsub;
  }, []);

  useEffect(() => {
    if (!svgRef.current || zones.length === 0) return;

    const width = 800;
    const height = 700;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', 'transparent');

    svg.selectAll('*').remove();

    // Grid background
    const grid = svg.append('g').attr('opacity', 0.04);
    for (let i = 0; i <= width; i += 50)
      grid.append('line').attr('x1', i).attr('y1', 0).attr('x2', i).attr('y2', height).attr('stroke', '#030f27');
    for (let i = 0; i <= height; i += 50)
      grid.append('line').attr('x1', 0).attr('y1', i).attr('x2', width).attr('y2', i).attr('stroke', '#030f27');

    const projection = d3.geoMercator()
      .center([80.7718, 7.8731])
      .scale(7500)
      .translate([width / 2, height / 2.2]);

    const groups = svg.append('g').selectAll('g.zone')
      .data(zones)
      .enter()
      .append('g')
      .attr('class', 'zone')
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        d3.select(this).select('.pulse').transition().duration(200).attr('opacity', 0.3);
        d3.select(this).select('.main-circle').transition().duration(200).attr('fill-opacity', 0.55);
      })
      .on('mouseout', function () {
        d3.select(this).select('.pulse').transition().duration(200).attr('opacity', 0.1);
        d3.select(this).select('.main-circle').transition().duration(200).attr('fill-opacity', 0.3);
      })
      .on('click', (_event, d) => setSelectedZone(d));

    groups.append('circle')
      .attr('class', 'pulse')
      .attr('cx', d => projection([d.lng, d.lat])![0])
      .attr('cy', d => projection([d.lng, d.lat])![1])
      .attr('r', d => d.radius * 7)
      .attr('fill', d => getZoneColors(d.type).fill)
      .attr('opacity', 0.1);

    groups.append('circle')
      .attr('class', 'main-circle')
      .attr('cx', d => projection([d.lng, d.lat])![0])
      .attr('cy', d => projection([d.lng, d.lat])![1])
      .attr('r', d => d.radius * 5)
      .attr('fill', d => getZoneColors(d.type).fill)
      .attr('fill-opacity', 0.3)
      .attr('stroke', d => getZoneColors(d.type).stroke)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.type === 'PROHIBITED' ? 'none' : '4,2');

    groups.append('circle')
      .attr('cx', d => projection([d.lng, d.lat])![0])
      .attr('cy', d => projection([d.lng, d.lat])![1])
      .attr('r', 3)
      .attr('fill', '#030f27');

    groups.append('text')
      .attr('x', d => projection([d.lng, d.lat])![0] + 14)
      .attr('y', d => projection([d.lng, d.lat])![1] + 4)
      .text(d => d.name)
      .attr('font-size', '9px')
      .attr('font-weight', '900')
      .attr('fill', '#030f27')
      .attr('pointer-events', 'none')
      .attr('opacity', 0.7);
  }, [zones]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* SVG Map */}
      <div className="flex-1 bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden relative">
        <svg ref={svgRef} className="w-full h-auto drop-shadow-xl" />
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          {(['PROHIBITED', 'RESTRICTED', 'WARNING'] as const).map(type => {
            const c = getZoneColors(type);
            return (
              <div key={type} className="flex items-center gap-3 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                <div className={`w-3 h-3 rounded-full ${c.dot}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#030f27]">{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone Inspector */}
      <div className="lg:w-[380px] shrink-0">
        <div className="bg-white rounded-[2.5rem] p-8 h-full border border-gray-100 shadow-xl flex flex-col">
          <h3 className="text-xl font-black text-[#030f27] mb-6 uppercase tracking-tight flex items-center gap-3">
            <i className="fa fa-info-circle text-[#1388d1]"></i>Zone Inspector
          </h3>

          {selectedZone ? (
            <div className="flex-1 animate-fade-in">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 ${getZoneColors(selectedZone.type).bg} ${getZoneColors(selectedZone.type).text}`}>
                <i className={`fa ${selectedZone.type === 'PROHIBITED' ? 'fa-ban' : 'fa-exclamation-triangle'} text-xs`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{selectedZone.type}</span>
              </div>
              <h4 className="text-2xl font-black text-[#030f27] leading-tight mb-4">{selectedZone.name}</h4>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">{selectedZone.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Radius</span>
                  <span className="text-lg font-black text-[#030f27]">{selectedZone.radius} KM</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Status</span>
                  <span className="text-lg font-black text-green-600 uppercase">Active</span>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <i className="fa fa-compass text-[#1388d1]"></i>
                  <span className="text-[10px] font-black text-[#1388d1] uppercase tracking-widest">Geolocation</span>
                </div>
                <code className="text-[11px] font-bold text-[#030f27] block">
                  LAT: {selectedZone.lat.toFixed(6)}<br />
                  LNG: {selectedZone.lng.toFixed(6)}
                </code>
              </div>
              <button className="w-full bg-[#1388d1] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#030f27] shadow-lg transition-all border-none cursor-pointer">
                Apply for Waiver
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <i className="fa fa-map-marker-alt text-3xl text-slate-200"></i>
              </div>
              <h5 className="text-sm font-black text-[#030f27] uppercase tracking-widest mb-2">No Zone Selected</h5>
              <p className="text-gray-400 text-xs leading-relaxed">
                Click on any colored area to inspect restricted coordinates and regulatory specifics.
              </p>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Data Ver: 3.0.0</span>
            <span>{zones.length} zones loaded</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestrictionMap;
