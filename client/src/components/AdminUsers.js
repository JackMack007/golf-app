import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const AdminUsers = () => {
  const { user, error: contextError } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', handicap: '' });

  useEffect(() => {
    if (contextError) {
      setError(contextError);
      setLoading(false);
      return;
    }

    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [user, contextError]);

  const fetchUsers = () => {
    setLoading(true);
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      setLoading(false);
      return;
    }

    fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/users', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        console.log('GET /api/users response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('GET /api/users response data:', data);
        if (data.error) {
          setError(data.error);
          setLoading(false);
        } else {
          setUsers(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('GET /api/users fetch error:', err);
        setError('Failed to fetch users');
        setLoading(false);
      });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      handicap: user.handicap || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', handicap: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          handicap: parseFloat(formData.handicap),
        }),
      });

      const data = await response.json();
      console.log('PUT /api/users/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      // Update the local users state with the updated user
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.user_id === editingUser.user_id ? { ...u, name: formData.name, email: formData.email, handicap: parseFloat(formData.handicap) } : u
        )
      );

      alert('User updated successfully!');
      closeModal();
    } catch (err) {
      console.error('Error updating user:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user? This action cannot be undone.');
    if (!confirmed) return;

    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('DELETE /api/users/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Remove the user from the local state
      setUsers(prevUsers => prevUsers.filter(u => u.user_id !== userId));
      alert('User deleted successfully!');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(`Error: ${err.message}`);
    }
  };

  if (contextError) {
    return <div className="container mx-auto p-4">Error: {contextError}</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="container mx-auto p-4">Access denied. Admins only.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin: All Users</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.user_id}>
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">
                <Link to={`/admin/users/${user.user_id}/scores`} className="text-blue-500 hover:underline mr-2">
                  View Scores
                </Link>
                <button
                  className="text-green-500 hover:underline mr-2"
                  onClick={() => openEditModal(user)}
                >
                  Edit
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => handleDelete(user.user_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
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
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Handicap</label>
              <input
                type="number"
                name="handicap"
                value={formData.handicap}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
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
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;