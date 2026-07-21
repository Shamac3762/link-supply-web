'use client'
import { useState, useRef } from 'react'

export default function TeamAdminSection({ teamMembers, supabase, companyId, companyName, stickers, refreshData }) {
  // Add Employee State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloneBranding, setCloneBranding] = useState(true);

  // Assign Tag State
  const [assignModalEmployee, setAssignModalEmployee] = useState(null);
  const [selectedTagId, setSelectedTagId] = useState('');

  // Edit Single Profile State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({ 
    display_name: '', username: '', profile_status: 'live', bio: '', job_title: '', 
    company: '', phone_number: '', display_email: '', theme_color: '#111111', 
    profile_picture_url: '', show_save_contact: true 
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [employeeLinks, setEmployeeLinks] = useState([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Bulk Selection & Actions State
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(''); 
  const [bulkForm, setBulkForm] = useState({ theme_color: '#111111', profile_picture_url: '', show_save_contact: true, link_title: '', link_url: '' });

  // 📢 NEW: Secure Dispatch State
  const [dispatchEmployee, setDispatchEmployee] = useState(null);
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatchHistory, setDispatchHistory] = useState([]);
  const [isSendingDispatch, setIsSendingDispatch] = useState(false);
  const [isLoadingDispatches, setIsLoadingDispatches] = useState(false);

  // --- Handlers ---

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!companyId) return alert("Error: No company ID found for this account.");
    setIsSubmitting(true);
    
    try {
      const cleanBase = newEmpName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const randomStr = Math.random().toString(36).substring(2, 6);
      const newUsername = `${cleanBase}${randomStr}`;
      
      const generateUUID = () => {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const newEmployeeId = generateUUID();

      const { error } = await supabase.from('customers').insert([{
        id: newEmployeeId, display_name: newEmpName, display_email: newEmpEmail,
        job_title: newEmpTitle, company_id: companyId, username: newUsername, profile_status: 'live' 
      }]);

      if (error) {
        if (error.code === '23503') throw new Error("Foreign Key Constraint: Please run the SQL script to allow ghost profiles.");
        throw error;
      }

      if (cloneBranding) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const managerId = authData.user.id;

          const { data: managerProfile } = await supabase
            .from('customers')
            .select('theme_color, profile_picture_url')
            .eq('id', managerId)
            .single();

          if (managerProfile) {
            await supabase.from('customers').update({
              theme_color: managerProfile.theme_color,
              profile_picture_url: managerProfile.profile_picture_url
            }).eq('id', newEmployeeId);
          }

          const { data: managerLinks } = await supabase
            .from('page_links')
            .select('*')
            .eq('owner_id', managerId);

          if (managerLinks && managerLinks.length > 0) {
            const clonedLinks = managerLinks.map(link => {
              const { id, created_at, ...linkDataToCopy } = link;
              return { ...linkDataToCopy, owner_id: newEmployeeId };
            });
            await supabase.from('page_links').insert(clonedLinks);
          }
        }
      }

      setShowAddModal(false); setNewEmpName(''); setNewEmpEmail(''); setNewEmpTitle(''); refreshData(); 
    } catch (error) {
      alert("Database Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTag = async (e) => {
    e.preventDefault();
    if (!selectedTagId || !assignModalEmployee) return;
    setIsSubmitting(true);
    try {
      const profileUrl = `https://linksupply.co.uk/u/${assignModalEmployee.username}`;
      const { error } = await supabase.from('nfc_stickers').update({ 
          target_url: profileUrl, tag_name: assignModalEmployee.name 
        }).eq('id', selectedTagId);
      if (error) throw error;
      setAssignModalEmployee(null); setSelectedTagId(''); refreshData();
    } catch (error) {
      alert("Database Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = async (member) => {
    setEditingEmployee(member);
    const { data } = await supabase.from('customers').select('display_name, username, profile_status, bio, job_title, company, phone_number, display_email, theme_color, profile_picture_url, show_save_contact').eq('id', member.id).single();
    if (data) {
      setEditForm({
        display_name: data.display_name || member.name || '', username: data.username || '', profile_status: data.profile_status || 'live',
        bio: data.bio || '', job_title: data.job_title || member.title || '', company: data.company || '',
        phone_number: data.phone_number || '', display_email: data.display_email || member.email || '', theme_color: data.theme_color || '#111111',
        profile_picture_url: data.profile_picture_url || '', show_save_contact: data.show_save_contact !== false
      });
    }
    const { data: links } = await supabase.from('page_links').select('*').eq('owner_id', member.id).order('sort_order', { ascending: true });
    if (links) setEmployeeLinks(links);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      let cleanUsername = editForm.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const { error } = await supabase.from('customers').update({
        display_name: editForm.display_name, username: cleanUsername, profile_status: editForm.profile_status,
        bio: editForm.bio, job_title: editForm.job_title, company: editForm.company, phone_number: editForm.phone_number,
        display_email: editForm.display_email, theme_color: editForm.theme_color, profile_picture_url: editForm.profile_picture_url, show_save_contact: editForm.show_save_contact
      }).eq('id', editingEmployee.id);
      if (error) throw error;
      setEditingEmployee(null); refreshData(); 
    } catch (error) {
      alert("Error saving profile: " + error.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddEmployeeLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl || !editingEmployee) return;

    let cleanUrl;
    try {
      const urlObj = new URL(newLinkUrl);
      cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      cleanUrl = newLinkUrl;
    }
    
    const { data, error } = await supabase.from('page_links').insert([{ 
      owner_id: editingEmployee.id, title: newLinkTitle, url: cleanUrl, sort_order: employeeLinks.length 
    }]).select();

    if (!error && data) {
      setEmployeeLinks([...employeeLinks, data[0]]); setNewLinkTitle(''); setNewLinkUrl('');
    } else {
      alert("Error adding link: " + error?.message);
    }
  };

  const handleDeleteEmployeeLink = async (linkId) => {
    const { error } = await supabase.from('page_links').delete().eq('id', linkId);
    if (!error) setEmployeeLinks(employeeLinks.filter(l => l.id !== linkId));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(teamMembers.map(m => m.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const openBulkModal = (type) => {
    setBulkActionType(type);
    setShowBulkModal(true);
  };

  const handleExecuteBulkAction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (bulkActionType === 'theme') {
        const { error } = await supabase.from('customers').update({ theme_color: bulkForm.theme_color }).in('id', selectedIds);
        if (error) throw error;
      } else if (bulkActionType === 'logo') {
        const { error } = await supabase.from('customers').update({ profile_picture_url: bulkForm.profile_picture_url }).in('id', selectedIds);
        if (error) throw error;
      } else if (bulkActionType === 'contact') {
        const { error } = await supabase.from('customers').update({ show_save_contact: bulkForm.show_save_contact }).in('id', selectedIds);
        if (error) throw error;
      } else if (bulkActionType === 'link') {
        
        let cleanUrl;
        try {
          const urlObj = new URL(bulkForm.link_url);
          cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
        } catch {
          cleanUrl = bulkForm.link_url;
        }

        const linksToInsert = selectedIds.map(id => ({ 
          owner_id: id, 
          title: bulkForm.link_title, 
          url: cleanUrl, 
          sort_order: 99 
        }));
        
        const { error } = await supabase.from('page_links').insert(linksToInsert);
        if (error) throw error;
      }
      setShowBulkModal(false); setSelectedIds([]); refreshData();
      alert("Bulk update successful! ✓");
    } catch (error) {
      alert("Error executing bulk action: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📢 NEW: Secure Dispatch Handlers
  const openDispatchModal = async (member) => {
    setDispatchEmployee(member);
    setIsLoadingDispatches(true);
    const { data, error } = await supabase
      .from('team_dispatches')
      .select('*')
      .eq('employee_id', member.id)
      .order('created_at', { ascending: false });
    
    if (data) setDispatchHistory(data);
    setIsLoadingDispatches(false);
  };

  const handleSendDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchMessage.trim()) return;
    setIsSendingDispatch(true);
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      const managerId = authData?.user?.id;

      const { error } = await supabase.from('team_dispatches').insert([{
        company_id: companyId,
        employee_id: dispatchEmployee.id,
        assigned_by: managerId,
        message: dispatchMessage,
        status: 'active'
      }]);
      
      if (error) throw error;
      
      setDispatchMessage('');
      openDispatchModal(dispatchEmployee); // Refresh history
    } catch (error) {
      alert("Error sending dispatch. Ensure you ran the SQL script in Supabase! Details: " + error.message);
    } finally {
      setIsSendingDispatch(false);
    }
  };

  const handleCompleteDispatch = async (dispatchId) => {
    try {
      await supabase
        .from('team_dispatches')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', dispatchId);
      openDispatchModal(dispatchEmployee); // Refresh
    } catch(e) {
      console.error(e);
    }
  };


  // --- Styles ---
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' };
  const labelStyle = { display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '6px', fontWeight: '600' };
  const availableTags = stickers || [];

  return (
    <div className="admin-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
      
      <style>{`
        .admin-wrapper { max-width: 100vw; overflow-x: hidden; box-sizing: border-box; }
        .admin-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        .admin-table th, .admin-table td { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; color: #111; font-size: 14px; }
        .admin-table th { background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 700; border-top: none; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table-wrap { overflow-x: auto; width: 100%; border-radius: 12px; border: 1px solid #e5e7eb; background: white; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }

        @media (max-width: 768px) {
          .mobile-stack { flex-direction: column !important; align-items: flex-start !important; }
          .mobile-stack > div, .mobile-stack > button { width: 100% !important; margin-top: 10px; }
        }
      `}</style>

      {/* HEADER WITH DIRECTORY BUTTON */}
      <div className="mobile-stack" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-10px', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '14px', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'white', fontWeight: '800', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', flexShrink: 0 }}>
            {companyName ? companyName.charAt(0).toUpperCase() : '🏢'}
          </div>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px' }}>
              {companyName || 'Enterprise'} Workspace
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>✓ MANAGER ACCOUNT</span>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Organization ID: {companyId?.substring(0, 8) || 'Pending'}...</span>
            </div>
          </div>
        </div>

        {companyId && (
          <a 
            href={`/team/${btoa(companyId)}`} 
            target="_blank" 
            rel="noreferrer"
            style={{ padding: '10px 18px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111', fontSize: '13px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            View Live Directory ↗
          </a>
        )}
      </div>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Total Employees</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>{teamMembers.length}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Active Tags</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#059669', margin: 0 }}>
            {teamMembers.filter(m => m.tag !== 'Unassigned').length}
          </p>
        </div>
      </div>

      {/* BULK ACTIONS MENU */}
      {selectedIds.length > 0 && (
        <div className="mobile-stack" style={{ backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.2s' }}>
          <div style={{ fontWeight: '700', color: '#3730a3' }}>{selectedIds.length} Employee(s) Selected</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => openBulkModal('theme')} style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#3730a3', cursor: 'pointer', flex: 1 }}>Apply Theme</button>
            <button onClick={() => openBulkModal('logo')} style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#3730a3', cursor: 'pointer', flex: 1 }}>Set Logo</button>
            <button onClick={() => openBulkModal('contact')} style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#3730a3', cursor: 'pointer', flex: 1 }}>Toggle Contact</button>
            <button onClick={() => openBulkModal('link')} style={{ padding: '8px 12px', backgroundColor: '#3730a3', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: 'white', cursor: 'pointer', flex: 1 }}>+ Add Link</button>
          </div>
        </div>
      )}

      {/* DIRECTORY TABLE */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: 'none', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div className="mobile-stack" style={{ padding: '25px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 5px 0' }}>Employee Directory</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Manage profiles and assign secure dispatch tasks.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>+ Add Employee</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === teamMembers.length && teamMembers.length > 0} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                </th>
                <th>Employee</th>
                <th>Job Title</th>
                <th>Assigned Tag</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>No employees added yet.</td>
                </tr>
              ) : teamMembers.map((member) => (
                <tr key={member.id} style={{ backgroundColor: selectedIds.includes(member.id) ? '#f5f8ff' : 'transparent' }}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedIds.includes(member.id)} onChange={() => handleSelectOne(member.id)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#4b5563', fontSize: '14px', flexShrink: 0 }}>
                        {member.name.charAt(0)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{member.title}</td>
                  <td>
                    {member.tag !== 'Unassigned' ? (
                      <span style={{ fontWeight: '600', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', whiteSpace: 'nowrap' }}>{member.tag}</span>
                    ) : (
                      <button onClick={() => setAssignModalEmployee(member)} style={{ fontWeight: '700', color: '#f59e0b', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Assign Tag</button>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    
                    {/* 📢 NEW DISPATCH BUTTON */}
                    <button onClick={() => openDispatchModal(member)} style={{ background: '#e0e7ff', border: '1px solid #c7d2fe', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}>Dispatch</button>
                    
                    <button onClick={() => openEditModal(member)} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', color: '#111', fontWeight: '600', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}>Edit</button>
                    <a href={`/u/${member.username}`} target="_blank" rel="noreferrer" style={{ color: '#6b7280', fontWeight: '600', textDecoration: 'none', fontSize: '12px', marginLeft: '4px' }}>View ↗</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📢 SECURE DISPATCH MODAL */}
      {dispatchEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: 0, borderRadius: '20px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '25px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '800', color: '#111' }}>Active Dispatches</h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Managing tasks for <strong>{dispatchEmployee.name}</strong></p>
              </div>
              <button onClick={() => setDispatchEmployee(null)} style={{ background: '#f3f4f6', border: 'none', fontSize: '20px', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>

            {/* Content Area */}
            <div style={{ padding: '25px', overflowY: 'auto' }} className="custom-scrollbar">
              
              {/* ⚠️ LIABILITY DISCLAIMER */}
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '15px', borderRadius: '12px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <strong style={{ color: '#92400e', fontSize: '13px', textTransform: 'uppercase' }}>Data Liability Notice</strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#b45309', lineHeight: '1.5' }}>
                  LinkSupply is a communication conduit. Do not transmit secure medical (HIPAA) or financial (PCI) data. By using this feature, you and your organization assume all legal liability for any Personally Identifiable Information (PII) shared.
                </p>
              </div>

              {/* New Dispatch Form */}
              <form onSubmit={handleSendDispatch} style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#111', marginBottom: '8px', fontWeight: '700' }}>New Dispatch Memo</label>
                <textarea 
                  required
                  placeholder="e.g., Fix plumbing at 123 Main St at 2:00 PM. Gate code is 1234."
                  value={dispatchMessage}
                  onChange={(e) => setDispatchMessage(e.target.value)}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', backgroundColor: 'white' }}
                />
                <button 
                  type="submit" 
                  disabled={isSendingDispatch} 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: isSendingDispatch ? 'not-allowed' : 'pointer' }}
                >
                  {isSendingDispatch ? 'Sending...' : 'Send Secure Dispatch'}
                </button>
              </form>

              {/* Dispatch History Log */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111', margin: '0 0 15px 0' }}>Dispatch Log</h3>
                
                {isLoadingDispatches ? (
                  <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>Loading history...</p>
                ) : dispatchHistory.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>No past or active dispatches.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dispatchHistory.map((item) => (
                      <div key={item.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', border: item.status === 'active' ? '2px solid #4f46e5' : '1px solid #e5e7eb', opacity: item.status === 'completed' ? 0.7 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: item.status === 'active' ? '#4f46e5' : '#6b7280', textTransform: 'uppercase' }}>
                            {item.status === 'active' ? '🟢 Active' : '✓ Completed'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#111', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {item.message}
                        </p>
                        {item.status === 'active' && (
                          <button 
                            onClick={() => handleCompleteDispatch(item.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* BULK ACTION MODAL */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', fontWeight: '800' }}>Apply to {selectedIds.length} Employees</h2>
            <form onSubmit={handleExecuteBulkAction}>
              {bulkActionType === 'theme' && (
                <div>
                  <label style={labelStyle}>Select Company Theme Color</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="color" value={bulkForm.theme_color} onChange={(e) => setBulkForm({...bulkForm, theme_color: e.target.value})} style={{ width: '50px', height: '50px', borderRadius: '8px', cursor: 'pointer', padding: 0, border: 'none' }} />
                    <input type="text" value={bulkForm.theme_color} onChange={(e) => setBulkForm({...bulkForm, theme_color: e.target.value.toUpperCase()})} maxLength={7} placeholder="#FFFFFF" style={{...inputStyle, marginBottom: 0, width: '120px', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '600'}} />
                  </div>
                </div>
              )}
              {bulkActionType === 'logo' && (
                <div>
                  <label style={labelStyle}>Company Logo URL</label>
                  <input type="url" placeholder="https://example.com/logo.png" value={bulkForm.profile_picture_url} onChange={(e) => setBulkForm({...bulkForm, profile_picture_url: e.target.value})} style={inputStyle} required />
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Paste a direct link to your company logo.</p>
                </div>
              )}
              {bulkActionType === 'contact' && (
                <div>
                  <label style={labelStyle}>"Save Contact" Button</label>
                  <select value={bulkForm.show_save_contact} onChange={(e) => setBulkForm({...bulkForm, show_save_contact: e.target.value === 'true'})} style={inputStyle}>
                    <option value="true">Visible (Enabled)</option>
                    <option value="false">Hidden (Disabled)</option>
                  </select>
                </div>
              )}
              {bulkActionType === 'link' && (
                <div>
                  <label style={labelStyle}>Link Title</label>
                  <input type="text" placeholder="e.g. Visit Company Website" value={bulkForm.link_title} onChange={(e) => setBulkForm({...bulkForm, link_title: e.target.value})} style={inputStyle} required />
                  <label style={labelStyle}>Destination URL</label>
                  <input type="url" placeholder="https://" value={bulkForm.link_url} onChange={(e) => setBulkForm({...bulkForm, link_url: e.target.value})} style={inputStyle} required />
                </div>
              )}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="button" disabled={isSubmitting} onClick={() => setShowBulkModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Applying...' : 'Apply to All'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE EDIT PROFILE MODAL */}
      {editingEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '800px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: '800', color: '#111' }}>Edit Profile</h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Managing details for {editingEmployee.name}</p>
              </div>
              <button onClick={() => setEditingEmployee(null)} style={{ background: '#f3f4f6', border: 'none', fontSize: '20px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              {/* Left Column: Profile Settings */}
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 15px 0', color: '#111' }}>Identity & Styling</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <label style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Profile Status</label>
                    <select value={editForm.profile_status} onChange={(e) => setEditForm({...editForm, profile_status: e.target.value})} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', fontWeight: '600', outline: 'none' }}>
                      <option value="live">🟢 Live</option>
                      <option value="coming_soon">🚧 Coming Soon</option>
                    </select>
                  </div>

                  <label style={labelStyle}>Display Name</label>
                  <input type="text" value={editForm.display_name} onChange={(e) => setEditForm({...editForm, display_name: e.target.value})} style={inputStyle} />
                  
                  <label style={labelStyle}>Public Username URL</label>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                    <span style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280', borderRight: '1px solid #d1d5db', backgroundColor: '#e5e7eb' }}>/u/</span>
                    <input type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} style={{ flex: 1, padding: '10px', border: 'none', outline: 'none', fontSize: '14px', backgroundColor: 'transparent' }} />
                  </div>

                  <label style={labelStyle}>Profile Image / Logo URL</label>
                  <input type="url" placeholder="https://..." value={editForm.profile_picture_url} onChange={(e) => setEditForm({...editForm, profile_picture_url: e.target.value})} style={inputStyle} />

                  <label style={labelStyle}>Theme Color</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="color" value={editForm.theme_color} onChange={(e) => setEditForm({...editForm, theme_color: e.target.value})} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 }} />
                    <input type="text" value={editForm.theme_color} onChange={(e) => setEditForm({...editForm, theme_color: e.target.value.toUpperCase()})} maxLength={7} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100px', fontSize: '14px', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '600', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 15px 0', color: '#111' }}>Business Card Info</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Job Title</label>
                      <input type="text" value={editForm.job_title} onChange={(e) => setEditForm({...editForm, job_title: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Company</label>
                      <input type="text" value={editForm.company} onChange={(e) => setEditForm({...editForm, company: e.target.value})} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Phone Number</label>
                      <input type="tel" value={editForm.phone_number} onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input type="email" value={editForm.display_email} onChange={(e) => setEditForm({...editForm, display_email: e.target.value})} style={inputStyle} />
                    </div>
                  </div>

                  <label style={labelStyle}>Short Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} style={{...inputStyle, height: '70px', resize: 'vertical'}} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '5px' }}>
                    <label style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Show "Save Contact" Button</label>
                    <button type="button" onClick={() => setEditForm({...editForm, show_save_contact: !editForm.show_save_contact})} style={{ width: '40px', height: '22px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: editForm.show_save_contact ? '#059669' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s ease' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: editForm.show_save_contact ? '20px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isSavingEdit} style={{ width: '100%', padding: '14px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: isSavingEdit ? 'not-allowed' : 'pointer', fontSize: '15px', marginTop: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  {isSavingEdit ? 'Saving...' : 'Save Profile Details'}
                </button>
              </form>

              {/* Right Column: Links Management */}
              <div>
                <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 5px 0', color: '#111' }}>Manage Links</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0' }}>Configure buttons displayed on the profile.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                    {employeeLinks.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', border: '1px dashed #d1d5db' }}><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>No links added yet.</p></div> : employeeLinks.map(link => (
                      <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <div style={{ overflow: 'hidden', flex: 1, paddingRight: '10px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#111', marginBottom: '2px' }}>{link.title}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</div>
                        </div>
                        <button type="button" onClick={() => handleDeleteEmployeeLink(link.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Delete</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <label style={{...labelStyle, fontSize: '13px'}}>Add New Link</label>
                    <input type="text" placeholder="Button Title (e.g. LinkedIn)" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} style={inputStyle} />
                    <input type="url" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={{...inputStyle, marginBottom: '15px'}} />
                    <button type="button" onClick={handleAddEmployeeLink} disabled={!newLinkTitle || !newLinkUrl} style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: (!newLinkTitle || !newLinkUrl) ? 'not-allowed' : 'pointer', fontSize: '14px' }}>+ Add Link</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111' }}>Add New Employee</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddEmployee}>
              <label style={labelStyle}>Full Name</label>
              <input required type="text" placeholder="e.g. John Doe" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} style={inputStyle} />
              <label style={labelStyle}>Work Email</label>
              <input required type="email" placeholder="john@company.com" value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)} style={inputStyle} />
              <label style={labelStyle}>Job Title</label>
              <input required type="text" placeholder="e.g. Sales Director" value={newEmpTitle} onChange={(e) => setNewEmpTitle(e.target.value)} style={inputStyle} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '15px', marginBottom: '10px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <input 
                  type="checkbox" 
                  id="cloneBrand" 
                  checked={cloneBranding} 
                  onChange={(e) => setCloneBranding(e.target.checked)} 
                  style={{ marginTop: '3px', cursor: 'pointer', minWidth: '16px', minHeight: '16px' }}
                />
                <label htmlFor="cloneBrand" style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.4', cursor: 'pointer' }}>
                  <strong>Clone Company Branding</strong><br/>
                  Copy my current logo, theme color, and active links to this new employee's profile.
                </label>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="button" disabled={isSubmitting} onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '12px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN TAG MODAL */}
      {assignModalEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111' }}>Assign Hardware</h2>
              <button onClick={() => setAssignModalEmployee(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              Select a tag to link it to <strong>{assignModalEmployee.name}'s</strong> profile.
            </p>
            
            <form onSubmit={handleAssignTag}>
              <label style={labelStyle}>Available Tags</label>
              {availableTags.length === 0 ? (
                <div style={{ padding: '15px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '14px', marginBottom: '15px', border: '1px solid #fecaca' }}>
                  No tags available. Go to "My Hardware" to activate tags first.
                </div>
              ) : (
                <select required value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)} style={{...inputStyle, backgroundColor: '#f9fafb', cursor: 'pointer'}}>
                  <option value="" disabled>-- Select a Tag --</option>
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.id} {tag.tag_name ? `(${tag.tag_name})` : ''}</option>
                  ))}
                </select>
              )}

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="button" disabled={isSubmitting} onClick={() => setAssignModalEmployee(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting || availableTags.length === 0} style={{ flex: 2, padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: (isSubmitting || availableTags.length === 0) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || availableTags.length === 0) ? 0.7 : 1 }}>
                  {isSubmitting ? 'Linking...' : 'Assign Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  )
}
