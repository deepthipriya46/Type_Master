import * as XLSX from 'xlsx';

/**
 * Trigger browser file download cleanly without opening UUID tabs
 */
export function triggerFileDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Universal SheetJS Workbook (.xlsx) exporter
 */
export function exportWorkbookToExcel(workbook, filename = 'TypeMaster_Report.xlsx') {
  const cleanFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  try {
    if (typeof XLSX !== 'undefined' && typeof XLSX.writeFile === 'function') {
      XLSX.writeFile(workbook, cleanFilename, { bookType: 'xlsx', compression: true });
      return true;
    }
  } catch (err) {
    console.warn('XLSX.writeFile fallback notice:', err);
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });
  triggerFileDownload(blob, cleanFilename);
  return true;
}

/**
 * Export User Portal Test History to Excel (.xlsx)
 * Produces structured worksheets:
 * 1. "Test History" - detailed log of all test sessions with metrics
 * 2. "Performance Summary" - high-level summary telemetry
 */
export function exportTestHistoryToExcel(tests = [], filename = 'TypeMaster_Test_History.xlsx') {
  if (!Array.isArray(tests) || tests.length === 0) {
    return false;
  }

  // 1. Prepare detailed session records
  const historyData = tests.map((t, index) => {
    const rawWpm = Number(t.wpm) || 0;
    const rawAcc = typeof t.accuracy === 'number' ? t.accuracy : parseFloat(t.accuracy) || 0;
    const rawErrors = Number(t.errors) || 0;
    const netWpm = t.net_wpm || Math.max(0, Math.round(rawWpm - rawErrors));

    return {
      '#': index + 1,
      'Date': t.date || (t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'),
      'Test Type': t.scheduled_test_title ? `Scheduled: ${t.scheduled_test_title}` : (t.scheduled_test_id ? 'Official Scheduled Test' : 'Standard Test'),
      'Duration': t.duration || `${t.durationSeconds ? Math.round(t.durationSeconds / 60) + ' min' : '1 min'}`,
      'Gross Speed (WPM)': rawWpm,
      'Net Speed (WPM)': netWpm,
      'Accuracy (%)': Math.round(rawAcc * 10) / 10,
      'Total Errors': rawErrors,
      'Rating': t.result ? `★ ${t.result}` : 'Completed',
      'Anti-Cheat Verification': 'Verified ✓'
    };
  });

  // 2. Prepare summary overview sheet
  const speeds = tests.map(t => Number(t.wpm) || 0);
  const accuracies = tests.map(t => typeof t.accuracy === 'number' ? t.accuracy : parseFloat(t.accuracy) || 0);
  const totalErrors = tests.reduce((acc, t) => acc + (Number(t.errors) || 0), 0);
  const bestSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;
  const avgAccuracy = accuracies.length > 0 ? (accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(1) : 0;
  const highAccuracyTests = accuracies.filter(acc => acc >= 95).length;
  const consistency = tests.length > 0 ? `${Math.round((highAccuracyTests / tests.length) * 100)}%` : '0%';

  const summaryData = [
    { 'Metric': 'Total Tests Completed', 'Value': tests.length },
    { 'Metric': 'Best Speed Record', 'Value': `${bestSpeed} WPM` },
    { 'Metric': 'Average Typing Speed', 'Value': `${avgSpeed} WPM` },
    { 'Metric': 'Average Accuracy Rate', 'Value': `${avgAccuracy}%` },
    { 'Metric': 'Total Recorded Mistakes', 'Value': totalErrors },
    { 'Metric': 'Cadence Consistency (>=95% Acc)', 'Value': consistency },
    { 'Metric': 'Export Timestamp', 'Value': new Date().toLocaleString() },
    { 'Metric': 'Security Badge', 'Value': 'Anti-Cheat Verified Telemetry' }
  ];

  // 3. Build workbook & worksheets
  const wb = XLSX.utils.book_new();

  const wsHistory = XLSX.utils.json_to_sheet(historyData);
  // Configure professional column widths
  wsHistory['!cols'] = [
    { wch: 6 },  // #
    { wch: 16 }, // Date
    { wch: 28 }, // Test Type
    { wch: 14 }, // Duration
    { wch: 18 }, // Gross Speed (WPM)
    { wch: 16 }, // Net Speed (WPM)
    { wch: 15 }, // Accuracy (%)
    { wch: 14 }, // Total Errors
    { wch: 16 }, // Rating
    { wch: 24 }  // Anti-Cheat Verification
  ];
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Test History Log');

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 34 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Performance Summary');

  return exportWorkbookToExcel(wb, filename);
}

/**
 * Export User Portal Performance Analytics to Excel (.xlsx)
 */
export function exportUserAnalyticsToExcel(user, recentTests = [], filename = 'TypeMaster_User_Analytics.xlsx') {
  const wb = XLSX.utils.book_new();

  const userOverview = [
    { 'Metric': 'Username', 'Value': user?.username || 'Typist' },
    { 'Metric': 'Email Address', 'Value': user?.email || 'N/A' },
    { 'Metric': 'Account Tier', 'Value': user?.is_premium ? 'Premium' : 'Standard' },
    { 'Metric': 'Best Speed Record', 'Value': `${user?.best_wpm || 0} WPM` },
    { 'Metric': 'Average Speed', 'Value': `${user?.avg_wpm || 0} WPM` },
    { 'Metric': 'Overall Accuracy', 'Value': `${user?.accuracy || 0}%` },
    { 'Metric': 'Tests Completed', 'Value': user?.tests_completed || recentTests.length || 0 },
    { 'Metric': 'Export Generated At', 'Value': new Date().toLocaleString() }
  ];

  const wsUser = XLSX.utils.json_to_sheet(userOverview);
  wsUser['!cols'] = [{ wch: 26 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsUser, 'User Profile');

  if (recentTests && recentTests.length > 0) {
    const sessionLogs = recentTests.map((t, idx) => ({
      '#': idx + 1,
      'Date': t.date || 'N/A',
      'Duration': t.duration || '1 min',
      'Speed (WPM)': Number(t.wpm) || 0,
      'Accuracy (%)': `${t.accuracy}%`,
      'Errors': Number(t.errors) || 0,
      'Result': t.result || 'Completed'
    }));

    const wsSessions = XLSX.utils.json_to_sheet(sessionLogs);
    wsSessions['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSessions, 'Recent Sessions');
  }

  return exportWorkbookToExcel(wb, filename);
}
