import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';

const AdminTournaments = () => {
  const { user, error: contextError } = useContext(UserContext);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (contextError) {
      setError(contextError);
      setLoading(false);
      return;
    }

    if (user === null) {
      return; // Wait for user data to load
    }

    if (!user) {
      setError('Please log in to view tournaments.');
      setLoading(false);
      return;
    }

    if (user.role !== 'admin') {
      setLoading(false);
      return;
    }

    fetchTournaments();
  }, [user, contextError]);

  const fetchTournaments = async () => {
    setLoading(true);
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/tournaments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('GET /api/tournaments response data:', data);
      console.log('Tournaments fetched with IDs:', data.tournaments?.map(t => ({ id: t.tournament_id, name: t.name })));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tournaments');
      }

      setTournaments(data.tournaments || []);
      setLoading(false);
    } catch (err) {
      console.error('GET /api/tournaments fetch error:', err);
      setError('Failed to fetch tournaments');
      setLoading(false);
    }
  };

  const calculateStatus = (startDate, endDate) => {
    const currentDate = new Date('2025-05-09');
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (currentDate < start) {
      return 'Pending';
    } else if (currentDate >= start && currentDate <= end) {
      return 'Live';
    } else {
      return 'Closed';
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (tournament) => {
    console.log('Opening edit modal for tournament:', { id: tournament.tournament_id, name: tournament.name });
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      start_date: tournament.start_date,
      end_date: tournament.end_date,
    });
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingTournament(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/tournaments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
        }),
      });

      const data = await response.json();
      console.log('POST /api/tournaments response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tournament');
      }

      setTournaments(prev => [...prev, data]);
      alert('Tournament created successfully!');
      closeModal();
    } catch (err) {
      console.error('Error creating tournament:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleEdit = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    console.log('Editing tournament with ID:', editingTournament.tournament_id);
    console.log('Edit request payload:', {
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date,
    });

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournaments/${editingTournament.tournament_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
        }),
      });

      const data = await response.json();
      console.log('PUT /api/tournaments/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tournament');
      }

      setTournaments(prev =>
        prev.map(tournament =>
          tournament.tournament_id === editingTournament.tournament_id
            ? { ...tournament, ...data }
            : tournament
        )
      );
      alert('Tournament updated successfully!');
      closeModal();
    } catch (err) {
      console.error('Error updating tournament:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (tournamentId) => {
    console.log('Attempting to delete tournament with ID:', tournamentId);
    const confirmed = window.confirm('Are you sure you want to delete this tournament? This action cannot be undone.');
    if (!confirmed) return;

    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('DELETE /api/tournaments/:id response