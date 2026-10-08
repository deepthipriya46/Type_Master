import React, { useState } from 'react';
import { TrendingUp, Target, Activity } from 'lucide-react';

export function WpmPerformanceChart({ data = [] }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Filter out any invalid items
  const points = (data || []).filter(p => typeof p.wpm === 'number');

  const width = 360;
  const height = 140;
  const paddingX = 35;
  const paddingY = 20;

  const maxVal = Math.max(...points.map(p => p.wpm), 60);
  const maxY = Math.ceil((maxVal + 15) / 20) * 20;
  const minY = 0;

  const getX = (idx) => {
    if (points.length <= 1) return width / 2;
    return paddingX + (idx / (points.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val) => height - paddingY - ((val - minY) / (maxY - minY)) * (height - paddingY * 2);

  const pathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.wpm)}`).join(' ')
    : '';

  const areaD = points.length > 1
    ? `${pathD} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
    : '';

  return (
    <div className="dashboard-card">
      <div className="card-header-row">
        <div className="card-title-group">
          <TrendingUp size={18} color="#2563eb" />
          <h3>WPM Performance</h3>
        </div>
        <select
          className="time-select-pill"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7d">Latest Sessions</option>
          <option value="all">All Realtime Data</option>
        </select>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        {points.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '0.8rem',
              gap: '6px'
            }}
          >
            <Activity size={24} color="#cbd5e1" />
            <span>Complete your first test to render live WPM graph</span>
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, Math.round(maxY / 2), maxY].map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                  <text x={paddingX - 8} y={y + 3} fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="sans-serif">
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            {areaD && <path d={areaD} fill="url(#wpmGradient)" />}

            {/* Line */}
            {points.length > 1 && (
              <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Points */}
            {points.map((p, idx) => {
              const cx = getX(idx);
              const cy = getY(p.wpm);
              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredPoint({ x: cx, y: cy, ...p })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={cx} cy={cy} r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                  <text x={cx} y={cy - 8} fontSize="9" fill="#1e293b" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                    {p.wpm}
                  </text>
                  <text x={cx} y={height - 4} fontSize="9" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">
                    {p.date}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 30}%`,
              transform: 'translate(-50%, -100%)',
              background: '#1e293b',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              pointerEvents: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              zIndex: 10
            }}
          >
            {hoveredPoint.date}: {hoveredPoint.wpm} WPM
          </div>
        )}
      </div>
    </div>
  );
}

export function AccuracyTrendChart({ data = [] }) {
  const [timeRange, setTimeRange] = useState('7d');

  const points = (data || []).filter(p => typeof p.accuracy === 'number');

  const width = 360;
  const height = 140;
  const paddingX = 35;
  const paddingY = 20;

  const minY = 60;
  const maxY = 100;

  const getX = (idx) => {
    if (points.length <= 1) return width / 2;
    return paddingX + (idx / (points.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val) => height - paddingY - ((val - minY) / (maxY - minY)) * (height - paddingY * 2);

  const pathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.accuracy)}`).join(' ')
    : '';

  const areaD = points.length > 1
    ? `${pathD} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
    : '';

  return (
    <div className="dashboard-card">
      <div className="card-header-row">
        <div className="card-title-group">
          <Target size={18} color="#10b981" />
          <h3>Accuracy</h3>
        </div>
        <select
          className="time-select-pill"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7d">Latest Sessions</option>
          <option value="all">All Realtime Data</option>
        </select>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        {points.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '0.8rem',
              gap: '6px'
            }}
          >
            <Activity size={24} color="#cbd5e1" />
            <span>Complete your first test to render live Accuracy curve</span>
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="accGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[60, 80, 100].map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                  <text x={paddingX - 8} y={y + 3} fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="sans-serif">
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* Area */}
            {areaD && <path d={areaD} fill="url(#accGradient)" />}

            {/* Line */}
            {points.length > 1 && (
              <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Points */}
            {points.map((p, idx) => {
              const cx = getX(idx);
              const cy = getY(p.accuracy);
              return (
                <g key={idx}>
                  <circle cx={cx} cy={cy} r="4.5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                  <text x={cx} y={cy - 8} fontSize="9" fill="#047857" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                    {p.accuracy}%
                  </text>
                  <text x={cx} y={height - 4} fontSize="9" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">
                    {p.date}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
