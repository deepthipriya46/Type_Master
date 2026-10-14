import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  User,
  Key,
  History,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  UserPlus,
  Users,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Zap,
  Save,
  Bot
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { supabaseService } from '../../services/supabaseService';

export default function AdminSettingsView({ currentUser, onUserUpdate }) {
  const [adminName, setAdminName] = useState(currentUser?.username || 'Admin Administrator');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || 'admin@typemaster.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  // Gemini AI Text Generator Configuration State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState('loading'); // 'active', 'unconfigured', 'loading'
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingGemini, setSavingGemini] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null); // { success: boolean, message: string }

  // Multi-Admin Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [activeAdmins, setActiveAdmins] = useState(() => adminService.getActiveAdmins());

  useEffect(() => {
    setActiveAdmins(adminService.getActiveAdmins());

    // Load current Gemini config from Supabase / localStorage
    const loadGeminiConfig = async () => {
      try {
        const config = await supabaseService.getGeminiConfig();
        if (config?.apiKey) {
          setGeminiApiKey(config.apiKey);
          setGeminiStatus('active');
        } else {
          setGeminiStatus('unconfigured');
        }
        if (config?.model) {
          setGeminiModel(config.model);
        }
      } catch (err) {
        console.warn('Gemini config load notice:', err);
        setGeminiStatus('unconfigured');
      }
    };
    loadGeminiConfig();
  }, []);

  const [auditLogs, setAuditLogs] = useState(() => adminService.getAuditLogs());
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('All');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminDisplayName || !newAdminPassword) {
      setAdminError('Please fill in all fields (Email, Display Name, Password).');
      return;
    }
    if (newAdminPassword.length < 6) {
      setAdminError('Password must be at least 6 characters long.');
      return;
    }
    setAdminError('');
    setCreatingAdmin(true);
    try {
      const res = await adminService.createAdministrator({
        email: newAdminEmail,
        displayName: newAdminDisplayName,
        password: newAdminPassword
      });
      if (res.success) {
        showToast(`Administrator ${newAdminDisplayName} (${newAdminEmail}) provisioned successfully!`);
        setNewAdminEmail('');
        setNewAdminDisplayName('');
        setNewAdminPassword('');
        setActiveAdmins(adminService.getActiveAdmins());
        setAuditLogs(adminService.getAuditLogs());
      } else {
        setAdminError(res.message || 'Failed to create administrator.');
      }
    } catch (err) {
      setAdminError(err.message || 'An error occurred while creating administrator.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleRevokeAdmin = async (email) => {
    if (email === 'admin@typemaster.com') {
      alert('Primary Master Admin cannot be revoked.');
      return;
    }
    if (window.confirm(`Revoke administrator privileges for ${email}?`)) {
      const res = await adminService.revokeAdministrator(email);
      if (res.success) {
        showToast(`Administrator privileges revoked for ${email}`);
        setActiveAdmins(adminService.getActiveAdmins());
        setAuditLogs(adminService.getAuditLogs());
      } else {
        alert(res.message || 'Failed to revoke administrator.');
      }
    }
  };

  const handleSaveGeminiConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingGemini(true);
    setConnectionTestResult(null);

    try {
      const cleanKey = geminiApiKey.trim();
      await supabaseService.saveGeminiConfig({
        apiKey: cleanKey,
        model: geminiModel
      });

      adminService.logAudit(
        'Gemini AI Configured',
        'AI Engine',
        cleanKey ? `Model: ${geminiModel} | Key: ...${cleanKey.slice(-4)}` : 'API Key Removed (Using Fallback)'
      );
      setAuditLogs(adminService.getAuditLogs());

      if (cleanKey) {
        setGeminiStatus('active');
        showToast('Gemini API configuration saved successfully!');
      } else {
        setGeminiStatus('unconfigured');
        showToast('Gemini API key cleared. Using local fallback passages.');
      }
    } catch (err) {
      setConnectionTestResult({
        success: false,
        message: `Failed to save configuration: ${err.message}`
      });
    } finally {
      setSavingGemini(false);
    }
  };

  const handleTestGeminiConnection = async () => {
    const cleanKey = geminiApiKey.trim();
    if (!cleanKey) {
      setConnectionTestResult({
        success: false,
        message: 'Please enter a Gemini API Key before testing the connection.'
      });
      return;
    }

    setTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const result = await supabaseService.testGeminiConnection(cleanKey, geminiModel);
      setConnectionTestResult(result);
      if (result.success) {
        setGeminiStatus('active');
      }
    } catch (err) {
      setConnectionTestResult({
        success: false,
        message: `Connection error: ${err.message}`
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    adminService.logAudit('Admin Profile Updated', adminName, `Updated credentials for ${adminEmail}`);
    setAuditLogs(adminService.getAuditLogs());
    showToast('Administrator profile settings updated successfully!');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleExportAuditLogs = () => {
    adminService.exportAuditLogsToExcel();
    setAuditLogs(adminService.getAuditLogs());
    showToast('Audit trail exported to Excel (.xlsx)!');
  };

  const handleExportSettings = () => {
    adminService.exportSettingsToExcel({
      twoFactor: twoFactorEnabled,
      sessionTimeout,
      geminiActive: Boolean(geminiApiKey.trim() || geminiStatus === 'active'),
      geminiModel
    });
    showToast('System configuration & audit logs exported to Excel (.xlsx)!');
  };

  const filteredLogs = auditLogs.filter((l) => {
    const matchSearch =
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(auditSearch.toLowerCase());
    const matchFilter = auditFilter === 'All' ? true : l.action.includes(auditFilter);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
      {/* Toast */}
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
            Admin Settings & Audit Logs
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            Manage administrative credentials, security parameters, and review system audit trails
          </p>
        </div>

        <button
          onClick={handleExportSettings}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            padding: '9px 16px',
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
          <span>Export Settings & Admins (.xlsx)</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', marginBottom: '32px' }}>
        {/* Left Column: Admin Profile & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Profile Credentials */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={iconBadgeStyle}>
                <User size={18} color="#4F46E5" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Admin Profile</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Primary administrator credentials</div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Administrator Display Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>New Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {newPassword && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '9px 0',
                  borderRadius: '9px',
                  border: 'none',
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Card: Security & RBAC Policies */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={iconBadgeStyle}>
                <ShieldCheck size={18} color="#059669" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Security & RBAC</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Access controls and session policies</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1E293B' }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Enforce TOTP authenticator verification</div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#4F46E5', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1E293B' }}>Admin Session Inactivity Timeout</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Auto-signout after inactivity</div>
                </div>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', background: '#F8FAFC' }}
                >
                  <option value="30">30 min</option>
                  <option value="60">60 min</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div style={{ padding: '10px 12px', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46' }}>
                  ✓ Role-Based Access Control (RBAC) Active:
                </span>
                <span style={{ fontSize: '0.74rem', color: '#047857', display: 'block', marginTop: '2px' }}>
                  Only users with role "admin" can access routes under /admin/*
                </span>
              </div>
            </div>
          </div>

          {/* Card: Gemini AI Text Generator Configuration */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ ...iconBadgeStyle, background: '#F5F3FF', borderColor: '#DDD6FE' }}>
                  <Sparkles size={18} color="#7C3AED" />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                    Gemini AI & Assistant Configuration
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    Shared Google Gemini API credential powering passage generation and TypeMaster AI Assistant
                  </div>
                </div>
              </div>

              {/* Status Indicator Badge */}
              <div>
                {(geminiApiKey.trim() || geminiStatus === 'active') ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}
                  >
                    <CheckCircle2 size={12} color="#059669" />
                    <span>Configured & Active</span>
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      color: '#B45309',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}
                  >
                    <AlertCircle size={12} color="#D97706" />
                    <span>Not Configured - Using Local Fallback</span>
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveGeminiConfig}>
              {/* Gemini API Key Input Field */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '0.72rem',
                      color: '#4F46E5',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Get Free Key from Google AI Studio ↗
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="AIzaSy... (Enter your Google Gemini API Key)"
                    value={geminiApiKey}
                    onChange={(e) => {
                      setGeminiApiKey(e.target.value);
                      if (connectionTestResult) setConnectionTestResult(null);
                    }}
                    style={{ ...inputStyle, paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showGeminiKey ? 'Hide key' : 'Show key'}
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.71rem', color: '#64748B', marginTop: '4px' }}>
                  Persisted securely in Supabase system_config table (RLS admin-only) and active session.
                </div>
              </div>

              {/* Model Selector Dropdown */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Select Gemini Model</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  style={{
                    ...inputStyle,
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#0F172A'
                  }}
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Recommended — Fast, Accurate & Low Latency)</option>
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Gemini 3.8 Flash High Performance)</option>
                  <option value="gemini-3-flash-preview">gemini-3-flash-preview (Next-Gen Fast Preview)</option>
                  <option value="gemini-3.6-flash">gemini-3.6-flash (Stable Multi-turn Flash)</option>
                  <option value="gemini-flash-latest">gemini-flash-latest (Auto-Adaptive Latest Flash)</option>
                </select>
              </div>

              {/* Inline Connection Test Result Message */}
              {connectionTestResult && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    background: connectionTestResult.success ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${connectionTestResult.success ? '#A7F3D0' : '#FECACA'}`,
                    color: connectionTestResult.success ? '#065F46' : '#DC2626'
                  }}
                >
                  {connectionTestResult.success ? (
                    <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} />
                  ) : (
                    <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                  )}
                  <span style={{ lineHeight: 1.4 }}>{connectionTestResult.message}</span>
                </div>
              )}

              {/* Action Buttons: Save API Key (Primary CTA) & Test Connection */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={savingGemini}
                  style={{
                    flex: 1,
                    padding: '9px 16px',
                    borderRadius: '9px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: savingGemini ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  <Save size={15} />
                  <span>{savingGemini ? 'Saving Key...' : 'Save API Key'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestGeminiConnection}
                  disabled={testingConnection}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '9px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: testingConnection ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Zap size={15} color="#D97706" />
                  <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Audit Log Trail Table */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBadgeStyle}>
                <History size={18} color="#D97706" />
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>Administrative Audit Log</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Tamper-evident administrative action history</div>
              </div>
            </div>

            <button
              onClick={handleExportAuditLogs}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
              }}
            >
              <FileSpreadsheet size={14} /> Export Logs (.xlsx)
            </button>
          </div>

          {/* Search & Filter inside Audit Logs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '6px 10px',
                flex: 1
              }}
            >
              <Search size={14} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '100%' }}
              />
            </div>

            <select
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.78rem' }}
            >
              <option value="All">All Actions</option>
              <option value="User">User Changes</option>
              <option value="Typing Test">Test Changes</option>
              <option value="Exported">Data Exports</option>
              <option value="Announcement">Announcements</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                  <th style={{ padding: '10px 12px' }}>Action</th>
                  <th style={{ padding: '10px 12px' }}>Target</th>
                  <th style={{ padding: '10px 12px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {log.timestamp}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      {log.target}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: MANAGE ADMINISTRATORS & ACTIVE ADMINS LIST */}
      {/* ======================================================== */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={iconBadgeStyle}>
            <Users size={18} color="#4F46E5" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.2px' }}>
              Manage Administrators
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              Provision multi-admin credentials with Supabase Auth synchronization and monitor active administrators
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
          {/* Card: Create Admin Form */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <UserPlus size={16} color="#4F46E5" />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Provision New Administrator</span>
            </div>

            {adminError && (
              <div
                style={{
                  padding: '10px 12px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '14px'
                }}
              >
                <AlertCircle size={15} />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin.colleague@typemaster.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Proctor"
                  value={newAdminDisplayName}
                  onChange={(e) => setNewAdminDisplayName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter secure password (min 6 chars)"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={creatingAdmin}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: '9px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: creatingAdmin ? 'not-allowed' : 'pointer',
                  opacity: creatingAdmin ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                }}
              >
                <UserPlus size={16} />
                {creatingAdmin ? 'Creating Administrator Account...' : 'Create Administrator Account'}
              </button>
            </form>
          </div>

          {/* Card: Active Admins List Table */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#10B981" />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Active Administrators List</span>
              </div>
              <span style={{ fontSize: '0.74rem', background: '#ECFDF5', color: '#065F46', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
                {activeAdmins.length} Authorized Admin{activeAdmins.length === 1 ? '' : 's'}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '10px 12px' }}>Administrator</th>
                    <th style={{ padding: '10px 12px' }}>Email</th>
                    <th style={{ padding: '10px 12px' }}>Role</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Provisioned</th>
                    <th style={{ padding: '10px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                        No administrators registered.
                      </td>
                    </tr>
                  ) : (
                    activeAdmins.map((adm) => (
                      <tr key={adm.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.75rem'
                              }}
                            >
                              {(adm.name || adm.username || 'A')[0].toUpperCase()}
                            </div>
                            <span>{adm.name || adm.username || 'Admin'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748B' }}>
                          {adm.email}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              background: '#EEF2FF',
                              color: '#4F46E5',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}
                          >
                            role: admin
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              background: '#ECFDF5',
                              color: '#059669',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}
                          >
                            Active
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: '0.74rem' }}>
                          {adm.joinedOn || '2026-10-10'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {adm.email === 'admin@typemaster.com' ? (
                            <span style={{ color: '#94A3B8', fontSize: '0.72rem', fontStyle: 'italic' }}>
                              Primary Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevokeAdmin(adm.email)}
                              style={{
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  border: '1px solid #E2E8F0',
  padding: '22px 24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
};

const iconBadgeStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  backgroundColor: '#F8FAFC',
  border: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.76rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '5px'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  fontSize: '0.84rem',
  outline: 'none',
  boxSizing: 'border-box'
};
