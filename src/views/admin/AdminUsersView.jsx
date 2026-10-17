import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Lock,
  Unlock,
  Trash2,
  Edit,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  BarChart2,
  Crown,
  X
} from 'lucide-react';
import { adminService, isDateInPeriod } from '../../services/adminService';
import { supabase, supabaseService } from '../../services/supabaseService';

export default function AdminUsersView({
  onSelectUserForAnalytics,
  onNavigate,
  dateRange = 'All Time',
  onDateRangeChange
}) {
  const [users, setUsers] = useState(() => adminService.getUsers());
  const usersList = users;
  const setUsersList = setUsers;
  const toast = {
    success: (msg) => showToast(msg),
    error: (msg) => showToast(msg)
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const handleDateFilterChange = (val) => {
    setDateFilter(val);
    setCurrentPage(1);
    if (onDateRangeChange) {
      onDateRangeChange(val);
    }
  };

  // Modals state
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'Active',
    password: ''
  });
  const [feedbackToast, setFeedbackToast] = useState('');

  const showToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(''), 3000);
  };

  const fetchUsers = async () => {
    const live = await adminService.fetchAllUsersLive();
    if (live && live.length > 0) {
      setUsers(live);
    } else {
      setUsers(adminService.getUsers());
    }
  };
  const refreshUsers = fetchUsers;

  useEffect(() => {
    fetchUsers();

    // Supabase Realtime Sync for Users (/admin/users)
    let usersSubscription = null;
    if (supabaseService.isConfigured() && supabase) {
      try {
        usersSubscription = supabase
          .channel('realtime_users_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'users' },
            (payload) => {
              if (payload.eventType === 'DELETE') {
                const delId = payload.old?.id;
                setUsersList((prev) => prev.filter((u) => u.id !== delId && String(u.id) !== String(delId)));
                if (delId) adminService.deleteUser(delId);
              } else if (payload.eventType === 'INSERT') {
                const newUser = {
                  id: payload.new.id,
                  name: payload.new.name || payload.new.display_name || payload.new.username || payload.new.full_name || 'Typist',
                  displayName: payload.new.display_name || payload.new.username || 'Typist',
                  username: payload.new.username || 'Typist',
                  email: payload.new.email || '—',
                  role: payload.new.role || 'user',
                  status: payload.new.status || 'Active',
                  joinedOn: payload.new.created_at ? new Date(payload.new.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent',
                  testsTaken: Number(payload.new.tests_completed) || 0,
                  avgWpm: Number(payload.new.avg_wpm) || 0,
                  highestWpm: Number(payload.new.best_wpm) || 0,
                  accuracy: Number(payload.new.accuracy) || 0,
                  totalPracticeTimeHours: Number(((Number(payload.new.tests_completed) || 0) * 0.05).toFixed(1)),
                  is_premium: Boolean(payload.new.is_premium),
                  lastActive: 'Active',
                  ...payload.new
                };
                setUsersList((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id && String(u.id) !== String(newUser.id))]);
              } else if (payload.eventType === 'UPDATE') {
                if (payload.new?.role === 'deleted') {
                  const delId = payload.new.id;
                  setUsersList((prev) => prev.filter((u) => u.id !== delId && String(u.id) !== String(delId)));
                  if (delId) adminService.deleteUser(delId);
                } else {
                  setUsersList((prev) =>
                    prev.map((u) =>
                      u.id === payload.new.id || String(u.id) === String(payload.new?.id)
                        ? {
                            ...u,
                            ...payload.new,
                            name: payload.new.name || payload.new.display_name || payload.new.username || u.name
                          }
                        : u
                    )
                  );
                }
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime admin users error:', err);
      }
    }

    // Cross-tab BroadcastChannel listener
    let bc = null;
    let adminBc = null;
    try {
      bc = new BroadcastChannel('admin-live-feed');
      bc.onmessage = (event) => {
        if (event.data?.type === 'USER_DELETED') {
          const deletedId = event.data.payload?.id || event.data.payload;
          setUsersList((prev) => prev.filter((u) => u.id !== deletedId && String(u.id) !== String(deletedId)));
        } else {
          fetchUsers();
        }
      };
      adminBc = new BroadcastChannel('typemaster_admin_feed');
      adminBc.onmessage = (event) => {
        if (event.data?.type === 'USER_DELETED') {
          const deletedId = event.data.payload?.id || event.data.payload;
          setUsersList((prev) => prev.filter((u) => u.id !== deletedId && String(u.id) !== String(deletedId)));
        } else {
          fetchUsers();
        }
      };
    } catch {
      // fallback
    }

    // Window CustomEvent listener
    const handleCustomEvent = (e) => {
      if (e.detail?.type === 'USER_DELETED') {
        const deletedId = e.detail.payload?.id || e.detail.payload;
        setUsersList((prev) => prev.filter((u) => u.id !== deletedId && String(u.id) !== String(deletedId)));
      } else {
        fetchUsers();
      }
    };
    window.addEventListener('typemaster-admin-feed', handleCustomEvent);

    return () => {
      if (usersSubscription && supabase) {
        supabase.removeChannel(usersSubscription);
      }
      if (bc) bc.close();
      if (adminBc) adminBc.close();
      window.removeEventListener('typemaster-admin-feed', handleCustomEvent);
    };
  }, []);

  const handleToggleTier = async (u) => {
    const nextTier = !u.is_premium;
    await adminService.updateUserTier(u.id, nextTier);
    setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, is_premium: nextTier } : item)));
    showToast(`${u.name} tier set to ${nextTier ? 'Premium' : 'Standard'}! Instant sync sent to user.`);
  };

  // Filtered & Searched Users (strictly respects date period, search and status)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' ? true : u.status === statusFilter;

      const userDate = (u.created_at ? u.created_at.split('T')[0] : '') || u.joinedOn;
      const matchDate = (dateFilter === 'All Time' || dateFilter === 'All') ? true : isDateInPeriod(userDate, dateFilter);

      return matchSearch && matchStatus && (q ? true : matchDate);
    });
  }, [users, searchQuery, statusFilter, dateFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Actions
  const handleToggleStatus = (u) => {
    const next = adminService.toggleUserStatus(u.id);
    fetchUsers();
    showToast(`${u.name} is now ${next}`);
  };

  const handleDeleteUser = async (userOrId, maybeName) => {
    const userId = typeof userOrId === 'object' && userOrId !== null ? userOrId.id : userOrId;
    const userName = (typeof userOrId === 'object' && userOrId !== null
      ? (userOrId.name || userOrId.displayName || userOrId.username)
      : maybeName) || 'User';

    try {
      // 1. Delete associated child records first to satisfy FK constraints
      if (supabaseService.isConfigured() && supabase) {
        await supabase.from('test_logs').delete().eq('user_id', userId);
        await supabase.from('scheduled_test_attempts').delete().eq('user_id', userId);
        try {
          await supabase.from('user_achievements').delete().eq('user_id', userId);
        } catch {}
        try {
          await supabase.from('streaks').delete().eq('user_id', userId);
        } catch {}

        // 2. Delete user record from main users table
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;

        // Ensure cloud record is marked deleted even under restricted RLS policies
        try {
          await supabase.from('users').update({ role: 'deleted' }).eq('id', userId);
        } catch {}
      }

      // Also clean up local registries and caches in adminService
      adminService.deleteUser(userId, null, userName);

      // 3. Immediately filter local React state array to remove user from UI instantly
      setUsersList((prevUsers) => prevUsers.filter((user) => user.id !== userId && String(user.id) !== String(userId)));

      toast.success(`User ${userName} has been removed successfully!`);
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user account.');
    }
  };

  const handleResetPassword = (u) => {
    const res = adminService.resetUserPassword(u.id);
    showToast(res.message);
  };

  const handleExportExcel = () => {
    adminService.exportUsersToExcel('xlsx', filteredUsers);
    showToast(`Exported ${filteredUsers.length} user records to Excel (.xlsx)!`);
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) {
      alert('Please fill in user name and email');
      return;
    }
    adminService.addUser(newUserForm);
    refreshUsers();
    setIsAddUserModalOpen(false);
    setNewUserForm({ name: '', email: '', role: 'user', status: 'Active', password: '' });
    showToast('New user account added successfully!');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setDateFilter('All Time');
    if (onDateRangeChange) onDateRangeChange('All Time');
    setCurrentPage(1);
  };

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
      {/* Toast notification */}
      {feedbackToast && (
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
          {feedbackToast}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
            Users Management
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            View and manage all registered users across the platform
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Export to Excel Button */}
          <button
            onClick={handleExportExcel}
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
            <span>Export to Excel (.xlsx)</span>
          </button>

          {/* Add User Button */}
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4338CA')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4F46E5')}
          >
            <Plus size={16} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '9px',
            padding: '7px 12px',
            minWidth: '320px',
            flex: 1
          }}
        >
          <Search size={16} color="#94A3B8" />
          <input
            id="users-search-input"
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.84rem',
              color: '#1E293B',
              width: '100%'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '7px 12px',
              borderRadius: '9px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '0.82rem',
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '9px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '0.82rem',
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Quarter">This Quarter</option>
          </select>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            style={{
              padding: '7px 14px',
              borderRadius: '9px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: '0.82rem',
              color: '#64748B',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '12px 14px' }}>#</th>
                <th style={{ padding: '12px 14px' }}>Name</th>
                <th style={{ padding: '12px 14px' }}>Email</th>
                <th style={{ padding: '12px 14px' }}>Joined On</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tests Taken</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Avg WPM</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Accuracy</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>
                        No users joined during {dateFilter}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        {dateFilter === 'Today'
                          ? `No typists have registered today (${new Date().toLocaleDateString()}).`
                          : 'No user accounts match the current filter selection.'}
                      </div>
                      {dateFilter !== 'All Time' && (
                        <button
                          onClick={() => handleDateFilterChange('All Time')}
                          style={{
                            marginTop: '8px',
                            padding: '6px 14px',
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            border: '1px solid #C7D2FE',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View All Users (All Time)
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                  >
                    <td style={{ padding: '12px 14px', color: '#94A3B8' }}>
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                          }}
                        >
                          {(u.name || u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span>{u.name || u.displayName || u.username || 'Typist'}</span>
                        {u.is_premium && (
                          <span
                            style={{
                              background: '#FEF3C7',
                              color: '#B45309',
                              border: '1px solid #FDE68A',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Crown size={10} color="#D97706" /> PRO
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{u.email}</td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{u.joinedOn}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                      {u.testsTaken}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#4F46E5', fontWeight: 700 }}>
                      {u.avgWpm} WPM
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>
                      {u.accuracy}%
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: u.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                          color: u.status === 'Active' ? '#059669' : '#DC2626',
                          border: `1px solid ${u.status === 'Active' ? '#A7F3D0' : '#FECDD3'}`
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {/* View Profile */}
                        <button
                          onClick={() => setSelectedUserModal(u)}
                          title="View user details"
                          style={tableActionBtnStyle('#EEF2FF', '#4F46E5')}
                        >
                          <Eye size={13} />
                        </button>

                        {/* Performance analytics drill-down */}
                        <button
                          onClick={() => {
                            if (onSelectUserForAnalytics) onSelectUserForAnalytics(u);
                            onNavigate('performance');
                          }}
                          title="Drill-down performance"
                          style={tableActionBtnStyle('#ECFDF5', '#059669')}
                        >
                          <BarChart2 size={13} />
                        </button>

                        {/* Toggle Premium Tier */}
                        <button
                          onClick={() => handleToggleTier(u)}
                          title={u.is_premium ? 'Downgrade from Premium' : 'Upgrade to Premium'}
                          style={tableActionBtnStyle(
                            u.is_premium ? '#FEF3C7' : '#F1F5F9',
                            u.is_premium ? '#D97706' : '#64748B'
                          )}
                        >
                          <Crown size={13} />
                        </button>

                        {/* Lock / Unlock */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'Active' ? 'Deactivate account' : 'Activate account'}
                          style={tableActionBtnStyle(
                            u.status === 'Active' ? '#FFFBEB' : '#ECFDF5',
                            u.status === 'Active' ? '#D97706' : '#059669'
                          )}
                        >
                          {u.status === 'Active' ? <Lock size={13} /> : <Unlock size={13} />}
                        </button>

                        {/* Reset password */}
                        <button
                          onClick={() => handleResetPassword(u)}
                          title="Reset Password"
                          style={tableActionBtnStyle('#F1F5F9', '#475569')}
                        >
                          <RotateCcw size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          id={`delete-user-${u.username || u.id}`}
                          data-testid={`delete-user-${u.username || u.id}`}
                          aria-label={`Delete user ${u.name || u.username}`}
                          onClick={() => handleDeleteUser(u.id, u.name || u.displayName || u.username)}
                          title="Delete account"
                          style={tableActionBtnStyle('#FEF2F2', '#EF4444')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFAFA'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Showing {Math.min(filteredUsers.length, (currentPage - 1) * pageSize + 1)} -{' '}
            {Math.min(filteredUsers.length, currentPage * pageSize)} of {filteredUsers.length} users
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={paginationArrowStyle(currentPage === 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                style={paginationNumStyle(currentPage === num)}
              >
                {num}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={paginationArrowStyle(currentPage === totalPages)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUserModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                User Profile & Diagnostics
              </div>
              <button onClick={() => setSelectedUserModal(null)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                    color: '#FFFFFF',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {selectedUserModal.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                    {selectedUserModal.name}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#64748B' }}>
                    {selectedUserModal.email} • ID: {selectedUserModal.id}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px'
                }}
              >
                <div style={detailMetricBoxStyle}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Average Speed</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4F46E5' }}>
                    {selectedUserModal.avgWpm} WPM
                  </div>
                </div>
                <div style={detailMetricBoxStyle}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Peak Speed</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                    {selectedUserModal.highestWpm} WPM
                  </div>
                </div>
                <div style={detailMetricBoxStyle}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Accuracy</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>
                    {selectedUserModal.accuracy}%
                  </div>
                </div>
                <div style={detailMetricBoxStyle}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Tests Completed</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>
                    {selectedUserModal.testsTaken}
                  </div>
                </div>
                <div style={detailMetricBoxStyle}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Practice Time</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>
                    {selectedUserModal.totalPracticeTimeHours} hrs
                  </div>
                </div>
                <div style={detailMetricBoxStyle}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Account Status</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: selectedUserModal.status === 'Active' ? '#059669' : '#DC2626' }}>
                    {selectedUserModal.status}
                  </div>
                </div>
              </div>

              {/* Action buttons inside modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => {
                    adminService.exportUserDetailToExcel(selectedUserModal);
                    showToast(`Exported ${selectedUserModal.name}'s performance history to Excel.`);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #10B981',
                    background: '#ECFDF5',
                    color: '#059669',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Export Performance (.xlsx)
                </button>
                <button
                  onClick={() => {
                    if (onSelectUserForAnalytics) onSelectUserForAnalytics(selectedUserModal);
                    setSelectedUserModal(null);
                    onNavigate('performance');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View Performance Charts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalCardStyle, maxWidth: '440px' }}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Register New User
              </div>
              <button onClick={() => setIsAddUserModalOpen(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Kapoor"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. meera@gmail.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Initial Status</label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Initial Password</label>
                <input
                  type="password"
                  placeholder="Optional (Defaults to Password@123)"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const tableActionBtnStyle = (bg, col) => ({
  background: bg,
  color: col,
  border: 'none',
  borderRadius: '6px',
  width: '26px',
  height: '26px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
});

const paginationNumStyle = (isActive) => ({
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: 'none',
  background: isActive ? '#4F46E5' : 'transparent',
  color: isActive ? '#FFFFFF' : '#475569',
  fontSize: '0.78rem',
  fontWeight: isActive ? 700 : 500,
  cursor: 'pointer'
});

const paginationArrowStyle = (disabled) => ({
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  color: disabled ? '#CBD5E1' : '#475569',
  fontSize: '0.9rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: '20px'
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '560px',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  overflow: 'hidden'
};

const modalHeaderStyle = {
  padding: '16px 24px',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#F8FAFC'
};

const closeBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const detailMetricBoxStyle = {
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  padding: '12px 14px'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '6px'
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
