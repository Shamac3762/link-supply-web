'use client'
import { useState } from 'react'

export default function TeamAdminSection({ teamMembers, supabase, companyId, companyName, stickers, refreshData }) {
  // Add Employee State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Tag State
  const [assignModalEmployee, setAssignModalEmployee] = useState(null);
  const [selectedTagId, setSelectedTagId] = useState('');

  // Edit Profile State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({ bio: '', job_title: '', theme_color: '#111111' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Employee Links State
  const [employeeLinks, setEmployeeLinks] = useState([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // --- Handlers ---

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!companyId) return alert("Error: No company ID found for this account.");
    setIsSubmitting(true);
    
    try {
      const cleanBase = newEmpName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const randomStr = Math.random().toString(36).substring(2, 6);
      const newUsername = `${cleanBase}${randomStr}`;
      
      // 🔥 Bulletproof UUID generator (works on localhost and production)
      const generateUUID = () => {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
          return window.crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const newEmpId = generateUUID(); 

      const { error } = await supabase.from('customers').insert([{
        id: newEmpId,
        display_name: newEmpName,
        display_email: newEmpEmail,
        job_title: newEmpTitle,
        company_id: companyId,
        username: newUsername,
        profile_status: 'live' 
      }]);

      if (error) {
        if (error.code === '23503') throw new Error("Foreign Key Constraint: We need to run one quick SQL script to allow ghost profiles.");
        throw error;
      }

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
      const profileUrl = `https://linksupply.co.uk/u/${assignModalEmployee.username}`;
      const { error } = await supabase.from('nfc_stickers').update({ 
          target_url: profileUrl, 
          tag_name: assignModalEmployee.name 
        }).eq('id', selectedTagId);

      if (error) throw error;

      setAssignModalEmployee(null);
      setSelectedTagId('');
      refreshData();
    } catch (error) {
      alert("Database Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal and Fetch Current Data & Links
  const openEditModal = async (member) => {
    setEditingEmployee(member);
    
    // Fetch Profile
    const { data } = await supabase.from('customers').select('bio, job_title, theme_color').eq('id', member.id).single();
    if (data) {
      setEditForm({
        bio: data.bio || '',
        job_title: data.job_title || member.title || '',
        theme_color: data.theme_color || '#111111'
      });
    }

    // Fetch Links
    const { data: links } = await supabase.from('page_links').select('*').eq('owner_id', member.id).order('sort_order', { ascending: true });
    if (links) setEmployeeLinks(links);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      const { error } = await supabase.from('customers').update({
        bio: editForm.bio,
        job_title: editForm.job_title,
        theme_color: editForm.theme_color
      }).eq('id', editingEmployee.id);

      if (error) throw error;
      setEditingEmployee(null);
      refreshData(); 
    } catch (error) {
      alert("Error saving profile: " + error.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Add Link to Employee
  const handleAddEmployeeLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl || !editingEmployee) return;
    
    const { data, error } = await supabase.from('page_links').insert([{ 
      owner_id: editingEmployee.id, 
      title: newLinkTitle, 
      url: newLinkUrl, 
      sort_order: employeeLinks.length 
    }]).select();

    if (!error && data) {
      setEmployeeLinks([...employeeLinks, data[0]]);
      setNewLinkTitle('');
      setNewLinkUrl('');
