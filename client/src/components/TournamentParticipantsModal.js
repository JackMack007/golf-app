import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TournamentParticipantsModal = ({
  tournament,
  users,
  isOpen,
  onClose,
  fetchParticipants,
  participants,
  setParticipants,
}) => {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && tournament) {
      fetchParticipants(tournament.tournament_id);
    }
  }, [isOpen, tournament, fetchParticipants]);

  const handleUserSelectChange = (e) => {
    setSelectedUserId(e.target.value);
  };

  const handleAssignUser = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      onClose();
      return;
    }

    if (!selectedUserId) {
      alert('Please select a user to assign.');
      return;
    }

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
          tournament_id: tournament.tournament_id,
          user_id: selectedUserId,
        }),
      });

      const data = await response.json();
      console.log('POST /api/tournament-participants response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign user to tournament');
      }

      await fetchParticipants(tournament.tournament_id);
      setSelectedUserId('');
      alert('User assigned to tournament successfully!');
    } catch (err) {
      console.error('Error assigning user to tournament:', err);
      setError(`Error: ${err.message}`);
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

      await fetchParticipants(tournament.tournament_id);
      alert('Participant removed successfully!');
    } catch (err) {
      console.error('Error deleting participant:', err);
      setError(`Error: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Participants for {tournament?.name}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

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
                              onClose();
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
                          onClose();
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
            onClick={onClose}
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
  );
};

export default TournamentParticipantsModal;