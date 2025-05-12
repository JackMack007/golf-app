import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const AdminTournaments = () => {
  const { user, error: contextError } = useContext(UserContext);
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [isAssignCourseModalOpen, setIsAssignCourseModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [assigningTournament, setAssigningTournament] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [playDate, setPlayDate] = useState('');
  const [editingCourseAssignment, setEditingCourseAssignment] = useState(null);
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
      return;
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
    fetchUsers();
    fetchCourses();
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

  const fetchCourses = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/courses', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('GET /api/courses response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch courses');
      }

      setCourses(data || []);
    } catch (err) {
      console.error('GET /api/courses fetch error:', err);
      setError('Failed to fetch courses: ' + err.message);
    }
  };

  const fetchParticipants = async (tournamentId) => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-participants/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`GET /api/tournament-participants/${tournamentId} response data:`, data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch participants');
      }

      setParticipants(data.participants || []);
    } catch (err) {
      console.error(`GET /api/tournament-participants/${tournamentId} fetch error:`, err);
      setError('Failed to fetch participants: ' + err.message);
    }
  };

  const fetchAssignedCourses = async (tournamentId) => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-courses/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`GET /api/tournament-courses/${tournamentId} response data:`, data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch assigned courses');
      }

      setAssignedCourses(data.courses || []);
    } catch (err) {
      console.error(`GET /api/tournament-courses/${tournamentId} fetch error:`, err);
      setError('Failed to fetch assigned courses: ' + err.message);
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

  const openAssignUserModal = (tournament) => {
    console.log('Opening participants modal for tournament:', { id: tournament.tournament_id, name: tournament.name });
    setAssigningTournament(tournament);
    setSelectedUserId('');
    fetchParticipants(tournament.tournament_id);
    setIsAssignUserModalOpen(true);
  };

  const openAssignCourseModal = (tournament) => {
    console.log('Opening courses modal for tournament:', { id: tournament.tournament_id, name: tournament.name });
    setAssigningTournament(tournament);
    setSelectedCourseId('');
    setPlayDate('');
    setEditingCourseAssignment(null);
    fetchAssignedCourses(tournament.tournament_id);
    setIsAssignCourseModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsAssignUserModalOpen(false);
    setIsAssignCourseModalOpen(false);
    setEditingTournament(null);
    setAssigningTournament(null);
    setSelectedUserId('');
    setSelectedCourseId('');
    setPlayDate('');
    setParticipants([]);
    setAssignedCourses([]);
    setEditingCourseAssignment(null);
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

  const handleCourseSelectChange = (e) => {
    setSelectedCourseId(e.target.value);
  };

  const handlePlayDateChange = (e) => {
    setPlayDate(e.target.value);
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

    // Check if the user is already assigned to the tournament
    const isUserAssigned = participants.some(participant => participant.user_id === selectedUserId);
    if (isUserAssigned) {
      alert('This user is already assigned to the tournament.');
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

      await fetchParticipants(assigningTournament.tournament_id);
      setSelectedUserId('');
      alert('User assigned to tournament successfully!');
    } catch (err) {
      console.error('Error assigning user to tournament:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to remove this participant from the tournament?');
    if (!confirmed) return;

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-participants/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('DELETE /api/tournament-participants/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete participant');
      }

      await fetchParticipants(assigningTournament.tournament_id);
      alert('Participant removed successfully!');
    } catch (err) {
      console.error('Error deleting participant:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAssignCourse = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    if (!selectedCourseId) {
      alert('Please select a course to assign.');
      return;
    }

    if (!playDate || !/^\d{4}-\d{2}-\d{2}$/.test(playDate)) {
      alert('Please select a valid play date (YYYY-MM-DD).');
      return;
    }

    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournament_id: assigningTournament.tournament_id,
          course_id: selectedCourseId,
          play_date: playDate,
        }),
      });

      const data = await response.json();
      console.log('POST /api/tournament-courses response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign course to tournament');
      }

      await fetchAssignedCourses(assigningTournament.tournament_id);
      setSelectedCourseId('');
      setPlayDate('');
      alert('Course assigned to tournament successfully!');
    } catch (err) {
      console.error('Error assigning course to tournament:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditCourseAssignment = (courseAssignment) => {
    setEditingCourseAssignment(courseAssignment);
    setSelectedCourseId(courseAssignment.course_id);
    setPlayDate(courseAssignment.play_date);
  };

  const handleUpdateCourseAssignment = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    if (!playDate || !/^\d{4}-\d{2}-\d{2}$/.test(playDate)) {
      alert('Please select a valid play date (YYYY-MM-DD).');
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-courses/${editingCourseAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          play_date: playDate,
        }),
      });

      const data = await response.json();
      console.log('PUT /api/tournament-courses/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update course assignment');
      }

      await fetchAssignedCourses(assigningTournament.tournament_id);
      setEditingCourseAssignment(null);
      setSelectedCourseId('');
      setPlayDate('');
      alert('Course assignment updated successfully!');
    } catch (err) {
      console.error('Error updating course assignment:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteCourseAssignment = async (courseAssignmentId) => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to remove this course from the tournament?');
    if (!confirmed) return;

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-courses/${courseAssignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('DELETE /api/tournament-courses/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete course assignment');
      }

      await fetchAssignedCourses(assigningTournament.tournament_id);
      alert('Course assignment removed successfully!');
    } catch (err) {
      console.error('Error deleting course assignment:', err);
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
      {/* Debug Element to Test Tailwind Responsive Classes */}
      <div className="mb-4">
        <p className="hidden md:block text-green-500">This should be visible on PC (≥768px)</p>
        <p className="block md:hidden text-red-500">This should be visible on Mobile (<768px)</p>
      </div>

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
                        className="text-blue-500 hover:underline mr-2"
                        onClick={() => openAssignUserModal(tournament)}
                      >
                        Participants
                      </button>
                      <button
                        className="text-purple-500 hover:underline"
                        onClick={() => openAssignCourseModal(tournament)}
                      >
                        Courses
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
                    onClick={() => openAssignUserModal(tournament)}
                  >
                    Participants
                  </button>
                  <button
                    className="text-purple-500 hover:underline"
                    onClick={() => openAssignCourseModal(tournament)}
                  >
                    Courses
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

      {/* Participants Modal */}
      {isAssignUserModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Participants for {assigningTournament?.name}
            </h2>

            {/* List of Assigned Participants */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Assigned Participants</h3>
              {participants.length > 0 ? (
                <>
                  {/* Table layout for medium and larger screens */}
                  <div className="hidden md:block">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Email</th>
                          <th className="border p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map(participant => (
                          <tr key={participant.id}>
                            <td className="border p-2">{participant.users?.name}</td>
                            <td className="border p-2">{participant.users?.email}</td>
                            <td className="border p-2">
                              <button
                                className="text-green-500 hover:underline mr-2"
                                onClick={() => {
                                  closeModal();
                                  navigate(`/admin/users/${participant.user_id}`);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="text-red-500 hover:underline"
                                onClick={() => handleDeleteParticipant(participant.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Tile layout for small screens */}
                  <div className="block md:hidden space-y-2 max-h-48 overflow-y-auto">
                    {participants.map(participant => (
                      <div
                        key={participant.id}
                        className="flex justify-between items-center border-b py-2"
                      >
                        <span>
                          {participant.users?.name} ({participant.users?.email})
                        </span>
                        <div className="space-x-2">
                          <button
                            className="text-green-500 hover:underline"
                            onClick={() => {
                              closeModal();
                              navigate(`/admin/users/${participant.user_id}`);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-500 hover:underline"
                            onClick={() => handleDeleteParticipant(participant.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No participants assigned yet.</p>
              )}
            </div>

            {/* Add Participant Section */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Add Participant</h3>
              <label className="block text-gray-700">Select User</label>
              <select
                value={selectedUserId}
                onChange={handleUserSelectChange}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select a user --</option>
                {users
                  .filter(user => !participants.some(p => p.user_id === user.user_id))
                  .map(user => (
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
                Close
              </button>
              <button
                onClick={handleAssignUser}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Participant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Modal */}
      {isAssignCourseModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            {/* Debug Element Inside Modal */}
            <div className="mb-4">
              <p className="hidden md:block text-green-500">Modal: Table should be visible on PC (≥768px)</p>
              <p className="block md:hidden text-red-500">Modal: Tiles should be visible on Mobile (<768px)</p>
            </div>

            <h2 className="text-xl font-bold mb-4">
              Courses for {assigningTournament?.name}
            </h2>

            {/* List of Assigned Courses */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Assigned Courses</h3>
              {assignedCourses.length > 0 ? (
                <>
                  {/* Table layout for medium and larger screens */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border p-2">Course Name</th>
                          <th className="border p-2">Location</th>
                          <th className="border p-2">Play Date</th>
                          <th className="border p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedCourses.map(courseAssignment => (
                          <tr key={courseAssignment.id}>
                            <td className="border p-2">{courseAssignment.courses?.name}</td>
                            <td className="border p-2">{courseAssignment.courses?.location}</td>
                            <td className="border p-2">{courseAssignment.play_date}</td>
                            <td className="border p-2">
                              <button
                                className="text-green-500 hover:underline mr-2"
                                onClick={() => handleEditCourseAssignment(courseAssignment)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-red-500 hover:underline"
                                onClick={() => handleDeleteCourseAssignment(courseAssignment.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Tile layout for small screens */}
                  <div className="block md:hidden space-y-2 max-h-48 overflow-y-auto">
                    {assignedCourses.map(courseAssignment => (
                      <div
                        key={courseAssignment.id}
                        className="bg-gray-50 p-4 rounded shadow"
                      >
                        <div className="flex justify-between items-center">
                          <span>
                            {courseAssignment.courses?.name} ({courseAssignment.courses?.location})
                          </span>
                          <div className="space-x-2">
                            <button
                              className="text-green-500 hover:underline"
                              onClick={() => handleEditCourseAssignment(courseAssignment)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500 hover:underline"
                              onClick={() => handleDeleteCourseAssignment(courseAssignment.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Play Date: {courseAssignment.play_date}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No courses assigned yet.</p>
              )}
            </div>

            {/* Add/Edit Course Section */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {editingCourseAssignment ? 'Edit Course Assignment' : 'Add Course'}
              </h3>
              <label className="block text-gray-700">Select Course</label>
              <select
                value={selectedCourseId}
                onChange={handleCourseSelectChange}
                className="w-full p-2 border rounded"
                disabled={!!editingCourseAssignment}
              >
                <option value="">-- Select a course --</option>
                {courses.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.name} ({course.location})
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <label className="block text-gray-700">Play Date</label>
                <input
                  type="date"
                  value={playDate}
                  onChange={handlePlayDateChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
              {editingCourseAssignment ? (
                <button
                  onClick={handleUpdateCourseAssignment}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Update
                </button>
              ) : (
                <button
                  onClick={handleAssignCourse}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Course
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTournaments;