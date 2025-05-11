import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';

const AdminTournaments = () => {
  const { user, error: contextError } = useContext(UserContext);
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]); // New state for users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false); // New state for assign modal
  const [editingTournament, setEditingTournament] = useState(null);
  const [assigningTournament, setAssigningTournament] = useState(null); // New state for the tournament being assigned users
  const [selectedUserId, setSelectedUserId] = useState(''); // New state for selected user
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
    fetchUsers(); // Fetch users when component mounts
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

  const fetchUsers = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('GET /api/users response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data || []);
    } catch (err) {
      console.error('GET /api/users fetch error:', err);
      setError('Failed to fetch users: ' + err.message);
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

  const openAssignModal = (tournament) => {
    console.log('Opening assign modal for tournament:', { id: tournament.tournament_id, name: tournament.name });
    setAssigningTournament(tournament);
    setSelectedUserId(''); // Reset selected user
    setIsAssignModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsAssignModalOpen(false);
    setEditingTournament(null);
    setAssigningTournament(null);
    setSelectedUserId('');
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

  const handleUserSelectChange = (e) => {
    setSelectedUserId(e.target.value);
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
      console.log('DELETE /api/tournaments/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete tournament');
      }

      setTournaments(prev => prev.filter(tournament => tournament.tournament_id !== tournamentId));
      alert('Tournament deleted successfully!');
    } catch (err) {
      console.error('Error deleting tournament:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAssignUser = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    if (!selectedUserId) {
      alert('Please select a user to assign.');
      return;
    }

    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournament_id: assigningTournament.tournament_id,
          user_id: selectedUserId,
        }),
      });

      const data = await response.json();
      console.log('POST /api/tournament-participants response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign user to tournament');
      }

      alert('User assigned to tournament successfully!');
      closeModal();
    } catch (err) {
      console.error('Error assigning user to tournament:', err);
      alert(`Error: ${err.message}`);
    }
  };

  if (contextError) {
    return <div className="container mx-auto p-4">Error: {contextError}</div>;
  }

  if (user === null) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4">Please log in to view tournaments.</div>;
  }

  if (user.role !== 'admin') {
    return <div className="container mx-auto p-4">Access denied. Admins only.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin: Manage Tournaments</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
        onClick={openCreateModal}
      >
        Add New Tournament
      </button>
      {tournaments.length > 0 ? (
        <>
          {/* Table layout for medium and larger screens */}
          <div className="hidden md:block">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Start Date</th>
                  <th className="border p-2">End Date</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map(tournament => (
                  <tr key={tournament.tournament_id}>
                    <td className="border p-2">{tournament.name}</td>
                    <td className="border p-2">{tournament.start_date}</td>
                    <td className="border p-2">{tournament.end_date}</td>
                    <td className="border p-2">{calculateStatus(tournament.start_date, tournament.end_date)}</td>
                    <td className="border p-2">
                      <button
                        className="text-green-500 hover:underline mr-2"
                        onClick={() => openEditModal(tournament)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500 hover:underline mr-2"
                        onClick={() => handleDelete(tournament.tournament_id)}
                      >
                        Delete
                      </button>
                      <button
                        className="text-blue-500 hover:underline"
                        onClick={() => openAssignModal(tournament)}
                      >
                        Assign Users
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Card layout for small screens */}
          <div className="block md:hidden space-y-4">
            {tournaments.map(tournament => (
              <div key={tournament.tournament_id} className="border rounded-lg p-4 bg-white shadow">
                <h3 className="text-lg font-semibold">{tournament.name}</h3>
                <p><strong>Start Date:</strong> {tournament.start_date}</p>
                <p><strong>End Date:</strong> {tournament.end_date}</p>
                <p><strong>Status:</strong> {calculateStatus(tournament.start_date, tournament.end_date)}</p>
                <div className="mt-2 space-x-2">
                  <button
                    className="text-green-500 hover:underline"
                    onClick={() => openEditModal(tournament)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDelete(tournament.tournament_id)}
                  >
                    Delete
                  </button>
                  <button
                    className="text-blue-500 hover:underline"
                    onClick={() => openAssignModal(tournament)}
                  >
                    Assign Users
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        !loading && <p className="text-lg">No tournaments available.</p>
      )}

      {/* Create Tournament Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Tournament</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tournament Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Tournament</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Users Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Assign Users to {assigningTournament?.name}
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700">Select User</label>
              <select
                value={selectedUserId}
                onChange={handleUserSelectChange}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select a user --</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignUser}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTournaments;