'use client'
import { useState } from 'react'

export default function TeamAdminSection({ teamMembers, supabase, companyId, companyName, stickers, refreshData }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 New Tag Assignment State
  const [assignModalEmployee, setAssignModalEmployee] = useState(null);
  const [selectedTagId, setSelectedTagId] = useState('');

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!companyId) return alert("Error: No company ID found for this account.");
    setIsSubmitting(true);
    
    try {
      const cleanBase = newEmpName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const randomStr = Math.random().toString(36).substring(2, 6);
      const newUsername = `${cleanBase}${randomStr}`;

      const { error } = await supabase.from('customers').insert([{
        display_name: newEmpName,
        display_email: newEmpEmail,
        job_title: newEmpTitle,
        company_id: companyId,
        username: newUsername,
        profile_status: 'live' 
      }]);

      if (error) throw error;

      setShowAddModal(false);
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpTitle('');
      refreshData(); 
      
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
      // Create the profile URL for the employee
      const profileUrl = `https://linksupply.co.uk/u/${assignModalEmployee.username}`;

      // Update the hardware tag in the database to point to the employee
      const { error } = await supabase
        .from('nfc_stickers')
        .update({ 
          target_url: profileUrl, 
          tag_name: assignModalEmployee.name // Auto-rename the tag to the employee's name!
        })
        .eq('id', selectedTagId);

      if (error) throw error;

      // Close modal and refresh
      setAssignModalEmployee(null);
      setSelectedTagId('');
      refreshData();

    } catch (error) {
      alert("Database Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' };

  // Filter for tags that aren't assigned to anyone yet (target_url doesn't have /u/ in it)
  const availableTags = stickers?.filter(s => !s.target_url || !s.target_url.includes('/u/')) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
      
      {/* PREMIUM B2B HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '-10px' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '14px', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'white', fontWeight: '800', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {companyName ? companyName.charAt(0).toUpperCase() : '🏢'}
        </div>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px' }}>
            {companyName || 'Enterprise'} Workspace
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.5px' }}>✓ MANAGER ACCOUNT</span>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Organization ID: {companyId?.substring(0, 8) || 'Pending'}...</span>
          </div>
        </div>
      </div>

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

      {/* 🔥 ASSIGN TAG MODAL */}
      {assignModalEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111' }}>Assign Hardware</h2>
              <button onClick={() => setAssignModalEmployee(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              Select a tag to permanently link it to <strong>{assignModalEmployee.name}'s</strong> digital profile.
            </p>
            
            <form onSubmit={handleAssignTag}>
              <label style={labelStyle}>Available Tags in Inventory</label>
              {availableTags.length === 0 ? (
                <div style={{ padding: '15px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '14px', marginBottom: '15px', border: '1px solid #fecaca' }}>
                  No unassigned tags available! Please go to the "My Hardware" tab and activate new tags first.
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

      {/* Team Metrics Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
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

      {/* The Main Employee Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '25px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 5px 0' }}>Employee Directory</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Manage profiles and assign NFC tags instantly.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>+ Add Employee</button>
          </div>
        </div>

        <div className="b2b-table-wrapper">
          <table className="b2b-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Job Title</th>
                <th>Assigned Tag</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    No employees added yet. Click "+ Add Employee" to start building your team.
                  </td>
                </tr>
              ) : teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#4b5563', fontSize: '14px' }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#111' }}>{member.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{member.title}</td>
                  <td>
                    {member.tag !== 'Unassigned' ? (
                      <span style={{ fontWeight: '600', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '4px 10px', borderRadius: '20px', fontSize: '13px' }}>{member.tag}</span>
                    ) : (
                      <button onClick={() => setAssignModalEmployee(member)} style={{ fontWeight: '700', color: '#f59e0b', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>+ Assign Tag</button>
                    )}
                  </td>
                  <td>
                    {member.status === 'active' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#059669' }}><span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></span> Active</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}><span style={{ width: '8px', height: '8px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></span> Pending Setup</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a href={`/u/${member.username}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', color: '#4f46e5', fontWeight: '700', textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>View Profile ↗</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
