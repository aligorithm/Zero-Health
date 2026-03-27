import React, { useState, useEffect } from 'react';
import logo from '../assets/zero-health-logo-dark.svg';
import Chatbot from './Chatbot';
import { buildApiUrl, buildUploadUrl, API_BASE_URL } from '../config/api';

const StaffDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState({});
  
  // Form states
  const [newLabResult, setNewLabResult] = useState({
    patient_id: '',
    test_name: '',
    result_data: '',
    test_date: ''
  });
  const [labResultImage, setLabResultImage] = useState(null);
  const [newPrescription, setNewPrescription] = useState({
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'patient',
    first_name: '',
    last_name: '',
    phone: '',
    specialization: '',
    license_number: ''
  });
  const [newReply, setNewReply] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [showLabForm, setShowLabForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // Get JWT token from localStorage
  const getAuthToken = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.token;
    }
    return null;
  };

  // Create headers with JWT token
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed.user || parsed);
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userData = localStorage.getItem('user');
      const parsed = JSON.parse(userData);
      const userRole = (parsed.user && parsed.user.role) || parsed.role;
      
      if (userRole === 'doctor') {
        await Promise.all([
          fetchPatients(),
          fetchAppointments(),
          fetchLabResults(),
          fetchPrescriptions(),
          fetchMessages()
        ]);
      } else if (userRole === 'pharmacist') {
        await fetchPrescriptions();
      } else if (userRole === 'admin') {
        await Promise.all([
          fetchUsers(),
          fetchStatistics()
        ]);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/patients'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/appointments'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  };

  const fetchLabResults = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/lab-results'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setLabResults(data);
      }
    } catch (err) {
      console.error('Failed to fetch lab results:', err);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/prescriptions'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      }
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/messages'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/admin/users'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/admin/statistics'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleCreateLabResult = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('patient_id', newLabResult.patient_id);
      formData.append('test_name', newLabResult.test_name);
      formData.append('result_data', newLabResult.result_data);
      formData.append('test_date', newLabResult.test_date);
      if (labResultImage) {
        formData.append('image', labResultImage);
      }
      
      const response = await fetch(buildApiUrl('/api/lab-results'), {
        method: 'POST',
        headers: {
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : ''
        },
        body: formData
      });
      
      if (response.ok) {
        setNewLabResult({ patient_id: '', test_name: '', result_data: '', test_date: '' });
        setLabResultImage(null);
        setShowLabForm(false);
        fetchLabResults();
        setError('');
      } else {
        setError('Failed to create lab result');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(buildApiUrl('/api/prescriptions'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newPrescription)
      });
      
      if (response.ok) {
        setNewPrescription({ patient_id: '', medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
        setShowPrescriptionForm(false);
        fetchPrescriptions();
        setError('');
      } else {
        setError('Failed to create prescription');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(buildApiUrl('/api/admin/users'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        setNewUser({
          email: '', password: '', role: 'patient', first_name: '', last_name: '', 
          phone: '', specialization: '', license_number: ''
        });
        setShowUserForm(false);
        fetchUsers();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleCollectPrescription = async (prescriptionId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/prescriptions/${prescriptionId}/collect`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchPrescriptions();
        setError('');
      } else {
        setError('Failed to mark prescription as collected');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(buildApiUrl(`/api/admin/users/${userId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchUsers();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(buildApiUrl(`/api/admin/users/${userId}/role`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        fetchUsers();
        setError('');
      } else {
        setError('Failed to update user role');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleReplyMessage = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('recipient_id', newReply.recipient_id);
      formData.append('subject', newReply.subject);
      formData.append('content', newReply.content);
      if (replyAttachment) {
        formData.append('attachment', replyAttachment);
      }
      
      const response = await fetch(buildApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : ''
        },
        body: formData
      });
      
      if (response.ok) {
        setNewReply({ recipient_id: '', subject: '', content: '' });
        setReplyAttachment(null);
        setReplyingTo(null);
        fetchMessages();
        setError('');
      } else {
        setError('Failed to send reply');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const startReply = (message) => {
    setNewReply({
      recipient_id: message.sender_id,
      subject: message.subject.startsWith('Re: ') ? message.subject : `Re: ${message.subject}`,
      content: ''
    });
    setReplyingTo(message.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getTabsForRole = (role) => {
    switch (role) {
      case 'doctor':
        return [
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'patients', label: '👥 Patients' },
          { id: 'appointments', label: '📅 Appointments' },
          { id: 'prescriptions', label: '💊 Prescriptions' },
          { id: 'lab-results', label: '🧪 Lab Results' },
          { id: 'messages', label: '💬 Messages' }
        ];
      case 'pharmacist':
        return [
          { id: 'prescriptions', label: '💊 Prescriptions' }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'users', label: '👨‍💼 User Management' },
          { id: 'statistics', label: '📈 System Statistics' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-logo">
              <img className="header-logo-image" src={logo} alt="Zero Health" />
              <h1>Loading Dashboard...</h1>
            </div>
          </div>
        </header>
      </div>
    );
  }

  const userRole = user?.role;
  const tabs = getTabsForRole(userRole);
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-logo">
            <img className="header-logo-image" src={logo} alt="Zero Health" />
            <h1>
              {userRole === 'doctor' && '👩‍⚕️ Doctor Portal'}
              {userRole === 'pharmacist' && '💊 Pharmacist Portal'}
              {userRole === 'admin' && '👨‍💼 Admin Portal'}
            </h1>
          </div>
          <div className="user-info">
            <span>Welcome back, {user?.first_name} {user?.last_name}</span>
            <button onClick={handleLogout} className="logout-btn">
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <div className="stats-grid">
              {userRole === 'doctor' && (
                <>
                  <div className="stat-card stat-card-blue">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <h3>Total Patients</h3>
                      <div className="stat-number">{patients.length}</div>
                      <p>Active in your care</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card-green">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                      <h3>Today's Appointments</h3>
                      <div className="stat-number">
                        {appointments.filter(apt => new Date(apt.appointment_date).toDateString() === new Date().toDateString()).length}
                      </div>
                      <p>Scheduled for today</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card-purple">
                    <div className="stat-icon">💊</div>
                    <div className="stat-content">
                      <h3>Active Prescriptions</h3>
                      <div className="stat-number">{prescriptions.filter(p => p.status === 'active').length}</div>
                      <p>Currently prescribed</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card-orange">
                    <div className="stat-icon">🧪</div>
                    <div className="stat-content">
                      <h3>Lab Results</h3>
                      <div className="stat-number">{labResults.length}</div>
                      <p>Total results</p>
                    </div>
                  </div>
                </>
              )}
              {userRole === 'pharmacist' && (
                <>
                  <div className="stat-card stat-card-blue">
                    <div className="stat-icon">💊</div>
                    <div className="stat-content">
                      <h3>Total Prescriptions</h3>
                      <div className="stat-number">{prescriptions.length}</div>
                      <p>All prescriptions</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card-orange">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                      <h3>Pending Collection</h3>
                      <div className="stat-number">{prescriptions.filter(p => p.status === 'pending' || p.status === 'active').length}</div>
                      <p>Awaiting pickup</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card-green">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <h3>Collected Today</h3>
                      <div className="stat-number">
                        {prescriptions.filter(p => p.status === 'collected' && 
                          new Date(p.collected_date).toDateString() === new Date().toDateString()).length}
                      </div>
                      <p>Completed today</p>
                    </div>
                  </div>
                </>
              )}
              {userRole === 'admin' && (
                <>
                  <div className="stat-card stat-card-blue">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <h3>Total Users</h3>
                      <div className="stat-number">{statistics.users?.total || 0}</div>
                      <p>System users</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card-green">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                      <h3>Total Appointments</h3>
                      <div className="stat-number">{statistics.appointments?.total || 0}</div>
                      <p>System-wide</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card-purple">
                    <div className="stat-icon">💊</div>
                    <div className="stat-content">
                      <h3>Total Prescriptions</h3>
                      <div className="stat-number">{statistics.prescriptions?.total || 0}</div>
                      <p>System-wide</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card-orange">
                    <div className="stat-icon">💬</div>
                    <div className="stat-content">
                      <h3>Total Messages</h3>
                      <div className="stat-number">{statistics.messages?.total || 0}</div>
                      <p>System communications</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="data-section">
              <div className="section-header">
                <h2>👥 Patients</h2>
              </div>
              <div className="data-list">
                {patients.map((patient) => (
                  <div key={patient.id} className="data-item">
                    <h4>{patient.first_name} {patient.last_name}</h4>
                    <p><strong>Email:</strong> {patient.email}</p>
                    <p><strong>Phone:</strong> {patient.phone}</p>
                    <p><strong>DOB:</strong> {patient.date_of_birth}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="data-section">
              <div className="section-header">
                <h2>💊 Prescriptions</h2>
                {userRole === 'doctor' && (
                  <button onClick={() => setShowPrescriptionForm(true)} className="btn btn-primary">
                    New Prescription
                  </button>
                )}
              </div>
              <div className="data-list">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="data-item">
                    <h4>{prescription.patient_first_name} {prescription.patient_last_name}</h4>
                    {userRole === 'pharmacist' && (
                      <p><strong>Doctor:</strong> {prescription.doctor_first_name} {prescription.doctor_last_name}</p>
                    )}
                    <p><strong>Medication:</strong> {prescription.medication_name}</p>
                    <p><strong>Dosage:</strong> {prescription.dosage}</p>
                    <p><strong>Status:</strong> <span className={`status-badge status-${prescription.status || 'pending'}`}>
                      {prescription.status || 'pending'}
                    </span></p>
                    {userRole === 'pharmacist' && (prescription.status === 'pending' || prescription.status === 'active') && (
                      <button 
                        onClick={() => handleCollectPrescription(prescription.id)}
                        className="btn btn-primary" 
                        style={{marginTop: '10px'}}
                      >
                        Mark Collected
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="data-section">
              <div className="section-header">
                <h2>📅 Appointments</h2>
              </div>
              <div className="data-list">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="data-item">
                    <h4>{appointment.patient_first_name} {appointment.patient_last_name}</h4>
                    <p><strong>Date & Time:</strong> {new Date(appointment.appointment_date).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span className={`status-badge status-${appointment.status}`}>
                      {appointment.status}
                    </span></p>
                    {appointment.reason && <p><strong>Reason:</strong> {appointment.reason}</p>}
                    {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'lab-results' && (
            <div className="data-section">
              <div className="section-header">
                <h2>🧪 Lab Results</h2>
                {userRole === 'doctor' && (
                  <button onClick={() => setShowLabForm(true)} className="btn btn-primary">
                    Add Lab Result
                  </button>
                )}
              </div>
              <div className="data-list">
                {labResults.map((result) => (
                  <div key={result.id} className="data-item">
                    <h4>{result.patient_first_name} {result.patient_last_name}</h4>
                    <p><strong>Test:</strong> {result.test_name}</p>
                    <p><strong>Date:</strong> {new Date(result.test_date).toLocaleDateString()}</p>
                    <div className="result-data">
                      <strong>Results:</strong> {result.result}
                    </div>
                    {result.file_path && (
                      <div style={{marginTop: '10px'}}>
                        <img 
                          src={buildUploadUrl(result.file_path)} 
                          alt="Lab result" 
                          style={{maxHeight: '150px', maxWidth: '200px', border: '1px solid #ddd', borderRadius: '8px'}}
                          onClick={() => window.open(buildUploadUrl(result.file_path), '_blank')}
                        />
                        <br />
                        <button
                          onClick={() => window.open(buildUploadUrl(result.file_path), '_blank')}
                          className="btn btn-secondary"
                          style={{marginTop: '5px'}}
                        >
                          View Full Size
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="data-section">
              <div className="section-header">
                <h2>💬 Messages</h2>
              </div>
              
              {replyingTo && (
                <div className="form-container" style={{marginBottom: '20px'}}>
                  <h3>Reply to Message</h3>
                  <form onSubmit={handleReplyMessage}>
                    <div className="form-group">
                      <label>Subject</label>
                      <input
                        type="text"
                        value={newReply.subject}
                        onChange={(e) => setNewReply({...newReply, subject: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Reply</label>
                      <textarea
                        value={newReply.content}
                        onChange={(e) => setNewReply({...newReply, content: e.target.value})}
                        placeholder="Type your reply here..."
                        rows="4"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Attach File (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReplyAttachment(e.target.files[0])}
                      />
                      {replyAttachment && (
                        <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
                          <p>Selected: {replyAttachment.name}</p>
                          <img 
                            src={URL.createObjectURL(replyAttachment)} 
                            alt="Preview" 
                            style={{height: '80px', width: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd'}}
                          />
                        </div>
                      )}
                    </div>
                    <div className="form-actions">
                      <button type="button" onClick={() => setReplyingTo(null)} className="btn btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Send Reply
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '40px', color: '#6c757d'}}>
                    <p>No messages yet</p>
                    <p>Start a conversation with your patients</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isSentByUser = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={`message-item ${isSentByUser ? 'sent' : 'received'}`}>
                        <div className="message-header">
                          <span className="message-sender">
                            {isSentByUser ? 'You' : `${message.sender_first_name} ${message.sender_last_name} (${message.sender_role})`}
                          </span>
                          <span className="message-time">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="message-subject">{message.subject}</div>
                        <div className="message-content" dangerouslySetInnerHTML={{__html: message.content}}></div>
                        {message.attachment_path && message.attachment_path !== 'null' && message.attachment_path.trim() !== '' && (
                          <div style={{marginTop: '10px'}}>
                            <img 
                              src={buildUploadUrl(message.attachment_path)} 
                              alt="Message attachment" 
                              style={{maxHeight: '200px', maxWidth: '300px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer'}}
                              onClick={() => window.open(buildUploadUrl(message.attachment_path), '_blank')}
                            />
                          </div>
                        )}
                        {!isSentByUser && userRole === 'doctor' && (
                          <button 
                            onClick={() => startReply(message)}
                            className="btn btn-primary"
                            style={{marginTop: '10px', fontSize: '12px', padding: '6px 12px'}}
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="data-section">
              <div className="section-header">
                <h2>👨‍💼 User Management</h2>
                <button onClick={() => setShowUserForm(true)} className="btn btn-primary">
                  Add User
                </button>
              </div>
              <div className="data-list">
                {users.map((userItem) => (
                  <div key={userItem.id} className="data-item">
                    <h4>{userItem.first_name} {userItem.last_name}</h4>
                    <p><strong>Email:</strong> {userItem.email}</p>
                    <p><strong>Role:</strong> 
                      <select 
                        value={userItem.role}
                        onChange={(e) => handleUpdateUserRole(userItem.id, e.target.value)}
                        style={{marginLeft: '10px', padding: '4px 8px'}}
                      >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="admin">Admin</option>
                      </select>
                    </p>
                    <p><strong>Created:</strong> {new Date(userItem.created_at).toLocaleDateString()}</p>
                    <button
                      onClick={() => handleDeleteUser(userItem.id)}
                      className="btn btn-secondary"
                      style={{marginTop: '10px'}}
                    >
                      Delete User
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="data-section">
              <div className="section-header">
                <h2>📈 System Statistics</h2>
              </div>
              <div className="stats-grid">
                <div className="stat-card stat-card-blue">
                  <div className="stat-content">
                    <h3>User Statistics</h3>
                    <div style={{marginTop: '15px'}}>
                      <p>Total Users: {statistics.users?.total || 0}</p>
                      <p>Patients: {statistics.users?.by_role?.patient || 0}</p>
                      <p>Doctors: {statistics.users?.by_role?.doctor || 0}</p>
                      <p>Pharmacists: {statistics.users?.by_role?.pharmacist || 0}</p>
                      <p>Admins: {statistics.users?.by_role?.admin || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="stat-card stat-card-green">
                  <div className="stat-content">
                    <h3>Appointment Statistics</h3>
                    <div style={{marginTop: '15px'}}>
                      <p>Total: {statistics.appointments?.total || 0}</p>
                      {Object.entries(statistics.appointments?.by_status || {}).map(([status, count]) => (
                        <p key={status}>{status}: {count}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="stat-card stat-card-purple">
                  <div className="stat-content">
                    <h3>Prescription Statistics</h3>
                    <div style={{marginTop: '15px'}}>
                      <p>Total: {statistics.prescriptions?.total || 0}</p>
                      {Object.entries(statistics.prescriptions?.by_status || {}).map(([status, count]) => (
                        <p key={status}>{status}: {count}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="stat-card stat-card-orange">
                  <div className="stat-content">
                    <h3>Lab Results & Messages</h3>
                    <div style={{marginTop: '15px'}}>
                      <p>Lab Results: {statistics.lab_results?.total || 0}</p>
                      <p>Messages: {statistics.messages?.total || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUserForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>👤 Add New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555) 123-4567"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                />
              </div>
              {(newUser.role === 'doctor' || newUser.role === 'pharmacist') && (
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    type="text"
                    placeholder="LIC123456"
                    value={newUser.license_number}
                    onChange={(e) => setNewUser({...newUser, license_number: e.target.value})}
                  />
                </div>
              )}
              {newUser.role === 'doctor' && (
                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    placeholder="Cardiology"
                    value={newUser.specialization}
                    onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                  />
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={() => setShowUserForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLabForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🧪 Add New Lab Result</h3>
            <form onSubmit={handleCreateLabResult}>
              <div className="form-group">
                <label>Patient</label>
                <select
                  value={newLabResult.patient_id}
                  onChange={(e) => setNewLabResult({...newLabResult, patient_id: e.target.value})}
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} (ID: {patient.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Test Name</label>
                <input
                  type="text"
                  placeholder="Blood Test, X-Ray, MRI"
                  value={newLabResult.test_name}
                  onChange={(e) => setNewLabResult({...newLabResult, test_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Test Date</label>
                <input
                  type="date"
                  value={newLabResult.test_date}
                  onChange={(e) => setNewLabResult({...newLabResult, test_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Test Results</label>
                <textarea
                  placeholder="Detailed test results and findings..."
                  value={newLabResult.result_data}
                  onChange={(e) => setNewLabResult({...newLabResult, result_data: e.target.value})}
                  rows="4"
                  required
                />
              </div>
              <div className="form-group">
                <label>Upload Lab Result Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLabResultImage(e.target.files[0])}
                />
                {labResultImage && (
                  <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
                    <p>Selected: {labResultImage.name}</p>
                    <img 
                      src={URL.createObjectURL(labResultImage)} 
                      alt="Preview" 
                      style={{height: '80px', width: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd'}}
                    />
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowLabForm(false);
                    setLabResultImage(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Lab Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrescriptionForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>💊 Write New Prescription</h3>
            <form onSubmit={handleCreatePrescription}>
              <div className="form-group">
                <label>Patient</label>
                <select
                  value={newPrescription.patient_id}
                  onChange={(e) => setNewPrescription({...newPrescription, patient_id: e.target.value})}
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} (ID: {patient.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Medication Name</label>
                <input
                  type="text"
                  placeholder="Aspirin, Ibuprofen, etc."
                  value={newPrescription.medication_name}
                  onChange={(e) => setNewPrescription({...newPrescription, medication_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dosage</label>
                <input
                  type="text"
                  placeholder="500mg"
                  value={newPrescription.dosage}
                  onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Duration</label>
                <input
                  type="text"
                  placeholder="7 days"
                  value={newPrescription.duration}
                  onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <input
                  type="text"
                  placeholder="Twice daily, Every 8 hours"
                  value={newPrescription.frequency}
                  onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Special Instructions</label>
                <textarea
                  placeholder="Take with food, avoid alcohol, etc."
                  value={newPrescription.instructions}
                  onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowPrescriptionForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Write Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Chatbot user={user} />
    </div>
  );
};

export default StaffDashboard; 