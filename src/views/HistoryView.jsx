import React, { useState } from 'react';
import { Clock, Search, Download, Filter, Trash2, ArrowUpDown } from 'lucide-react';

export default function HistoryView({ recentTests = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDuration, setFilterDuration] = useState('all');

  const filtered = recentTests.filter((t) => {
    const matchesSearch = t.result.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.date.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDuration = filterDuration === 'all' || t.duration.includes(filterDuration);
    return matchesSearch && matchesDuration;
  });

  const exportCSV = () => {
    const headers = ['Date,Duration,WPM,Accuracy,Errors,Result'];
    const rows = filtered.map(r => `"${r.date}","${r.duration}",${r.wpm},${r.accuracy}%,${r.errors},"${r.result}"`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `typemaster_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Test History Log</h1>
          <p>Chronological record of every completed typing test session.</p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '0.84rem',
            fontWeight: 700,
            color: '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="dashboard-card">
        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="header-search" style={{ width: '280px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterDuration}
            onChange={(e) => setFilterDuration(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: '#f8fafc',
              color: '#334155',
              outline: 'none'
            }}
          >
            <option value="all">All Durations</option>
            <option value="1">1 min tests</option>
            <option value="3">3 min tests</option>
            <option value="5">5 min tests</option>
          </select>
        </div>

        <table className="recent-tests-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Duration</th>
              <th>WPM</th>
              <th>Accuracy</th>
              <th>Errors</th>
              <th>Result</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((test) => (
              <tr key={test.id}>
                <td>{test.date}</td>
                <td>{test.duration}</td>
                <td style={{ fontWeight: 800, color: '#2563eb' }}>{test.wpm}</td>
                <td>{test.accuracy}%</td>
                <td style={{ color: test.errors > 5 ? '#ef4444' : '#64748b' }}>{test.errors}</td>
                <td>
                  <span className={`badge-tag ${test.result === 'Excellent' ? 'excellent' : test.result === 'Great' ? 'great' : 'good'}`}>
                    ★ {test.result}
                  </span>
                </td>
                <td style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                  Verified ✓
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
