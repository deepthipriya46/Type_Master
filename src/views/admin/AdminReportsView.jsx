import React, { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Users,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  PieChart,
  BarChart2,
  Clock,
  Target,
  RotateCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { supabaseService } from '../../services/supabaseService';

export default function AdminReportsView({ dateRange, onDateRangeChange }) {
  const [timeRange, setTimeRange] = useState(dateRange || 'Last 30 Days');
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dateRange) {
      setTimeRange(dateRange);
    }
  }, [dateRange]);

  const handleTimeRangeChange = (val) => {
    setTimeRange(val);
    if (onDateRangeChange) onDateRangeChange(val);
  };

  const [reportData, setReportData] = useState({
    totalTestsConducted: 0,
    activeDailyTypists: 0,
    globalAvgWpm: '0.0 WPM',
    avgSessionDuration: '0.0 min',
    totalUsers: 0,
    brackets: [
      { label: '0 - 20 WPM', percent: 0, count: 0, color: '#8B5CF6' },
      { label: '21 - 40 WPM', percent: 0, count: 0, color: '#F43F5E' },
      { label: '41 - 60 WPM', percent: 0, count: 0, color: '#F59E0B' },
      { label: '61 - 80 WPM', percent: 0, count: 0, color: '#10B981' },
      { label: '81 - 100 WPM', percent: 0, count: 0, color: '#06B6D4' },
      { label: '> 100 WPM', percent: 0, count: 0, color: '#3B82F6' }
    ],
    userActivityData: []
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getLiveReportsData(timeRange);
      setReportData(data);
    } catch (err) {
      console.warn('Reports load error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // TWO-WAY REAL-TIME SUBSCRIPTION: supabase.channel('admin-live-feed')
  useEffect(() => {
    loadReports();

    let channel = null;

    if (supabaseService.isConfigured()) {
      channel = supabaseService.supabase
        .channel('admin-live-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'test_sessions' },
          () => {
            loadReports();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'test_logs' },
          () => {
            loadReports();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            loadReports();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users' },
          () => {
            loadReports();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedback' },
          () => {
            loadReports();
          }
        )
        .subscribe();
    }

    // Cross-portal BroadcastChannel for instant real-time telemetry updates
    let bc = null;
    try {
      bc = new BroadcastChannel('admin-live-feed');
      bc.onmessage = () => {
        loadReports();
      };
    } catch {
      // fallback
    }

    const handleLocal = () => {
      loadReports();
    };
    window.addEventListener('typemaster-admin-feed', handleLocal);

    return () => {
      if (channel && supabaseService.isConfigured()) {
        supabaseService.supabase.removeChannel(channel);
      }
      if (bc) bc.close();
      window.removeEventListener('typemaster-admin-feed', handleLocal);
    };
  }, [loadReports]);

  const handleExportReport = (format = 'xlsx') => {
    adminService.exportPerformanceReport(timeRange, format);
    showToast(`TypeMaster Admin Report exported (${format.toUpperCase()})!`);
  };

  const maxActivityValue = Math.max(
    5,
    ...reportData.userActivityData.map(d => Math.max(d.newUsers || 0, d.activeUsers || 0))
  );

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 100,
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={17} color="#10B981" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            Real-time platform telemetry aggregated from live PostgreSQL queries (Zero Mock Data)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Refresh button */}
          <button
            onClick={loadReports}
            title="Refresh Live Analytics"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              color: '#4F46E5',
              border: '1px solid #E2E8F0',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RotateCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Time range selector */}
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Quarter">This Quarter</option>
            <option value="All Time">All Time</option>
          </select>

          {/* Export Full Report (.xlsx) */}
          <button
            onClick={() => handleExportReport('xlsx')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
          >
            <FileSpreadsheet size={16} />
            <span>Export Report (.xlsx)</span>
          </button>

          {/* Export CSV (.csv) */}
          <button
            onClick={() => handleExportReport('csv')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <Download size={15} color="#475569" />
            <span>Export (.csv)</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Boxes (LIVE METRICS: ZERO MOCK DATA) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div style={reportMetricBoxStyle}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Total Tests Conducted</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>
            {reportData.totalTestsConducted}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
            {reportData.totalTestsConducted > 0 ? '✓ Live database verified' : 'No test records yet'}
          </div>
        </div>

        <div style={reportMetricBoxStyle}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Active Daily Typists</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5', margin: '4px 0' }}>
            {reportData.activeDailyTypists}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4F46E5', fontWeight: 700 }}>
            {reportData.activeDailyTypists > 0 ? `${reportData.activeDailyTypists} typists active` : 'Awaiting typist sessions'}
          </div>
        </div>

        <div style={reportMetricBoxStyle}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Global Avg WPM</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
            {reportData.globalAvgWpm}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
            {reportData.totalTestsConducted > 0 ? 'Calculated across verified tests' : '0 WPM baseline'}
          </div>
        </div>

        <div style={reportMetricBoxStyle}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Avg Session Duration</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', margin: '4px 0' }}>
            {reportData.avgSessionDuration}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>
            {reportData.totalTestsConducted > 0 ? 'Mean elapsed duration' : '0 min baseline'}
          </div>
        </div>
      </div>

      {/* Row: User Activity Bar Chart & Performance Distribution Donut Chart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* User Activity Bar Chart */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              User Activity
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#3B82F6' }} />
                New Users
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8B5CF6' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#8B5CF6' }} />
                Active Sessions
              </div>
            </div>
          </div>

          <div
            style={{
              height: '190px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '0 10px 10px 10px',
              borderBottom: '1px solid #F1F5F9'
            }}
          >
            {reportData.userActivityData.length === 0 ? (
              <div style={{ width: '100%', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                No activity recorded in selected timeframe.
              </div>
            ) : (
              reportData.userActivityData.map((d) => (
                <div
                  key={d.day}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '140px' }}>
                    {/* New Users bar */}
                    <div
                      style={{
                        width: '14px',
                        height: `${Math.max(4, (d.newUsers / maxActivityValue) * 100)}%`,
                        backgroundColor: '#3B82F6',
                        borderRadius: '4px 4px 0 0'
                      }}
                      title={`New Users: ${d.newUsers}`}
                    />
                    {/* Active Sessions bar */}
                    <div
                      style={{
                        width: '14px',
                        height: `${Math.max(4, (d.activeUsers / maxActivityValue) * 100)}%`,
                        backgroundColor: '#8B5CF6',
                        borderRadius: '4px 4px 0 0'
                      }}
                      title={`Active Sessions: ${d.activeUsers}`}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                    {d.day}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Distribution Donut Chart */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              Performance Distribution
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>All Typists</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '190px' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {(() => {
                  let acc = 0;
                  return reportData.brackets.map((b, i) => {
                    const strokeDasharray = `${b.percent * 2.83} 283`;
                    const strokeDashoffset = -acc * 2.83;
                    acc += b.percent;
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke={b.color}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  {reportData.totalUsers}
                </span>
                <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 600 }}>Total Users</span>
              </div>
            </div>

            {/* Legend list with exact percentages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, paddingLeft: '14px' }}>
              {reportData.brackets.map((b) => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: b.color }} />
                    <span style={{ color: '#334155', fontWeight: 500 }}>{b.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{b.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const reportMetricBoxStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  padding: '16px 20px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
};

const chartCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '20px 24px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  display: 'flex',
  flexDirection: 'column'
};
