import React, { useState, useEffect } from 'react';
import logo from '../assets/zero-health-logo-dark.svg';
import Chatbot from './Chatbot';
import { buildApiUrl, buildUploadUrl, API_BASE_URL } from '../config/api';

const PatientPortal = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [appointments, setAppointments] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  // Form states
  const [newAppointment, setNewAppointment] = useState({
    doctor_id: '',
    appointment_date: '',
    reason: ''
  });
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });
  const [messageAttachment, setMessageAttachment] = useState(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);

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
      await Promise.all([
        fetchAppointments(),
        fetchLabResults(),
        fetchPrescriptions(),
        fetchMessages(),
        fetchDoctors()
      ]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
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

  const fetchDoctors = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/doctors'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(buildApiUrl('/api/appointments'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newAppointment)
      });
      
      if (response.ok) {
        setNewAppointment({ doctor_id: '', appointment_date: '', reason: '' });
        setShowAppointmentForm(false);
        fetchAppointments();
        setError('');
      } else {
        setError('Failed to book appointment');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('recipient_id', newMessage.recipient_id);
      formData.append('subject', newMessage.subject);
      formData.append('content', newMessage.content);
      if (messageAttachment) {
        formData.append('attachment', messageAttachment);
      }
      
      const response = await fetch(buildApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : ''
        },
        body: formData
      });
      
      if (response.ok) {
        setNewMessage({ recipient_id: '', subject: '', content: '' });
        setMessageAttachment(null);
        setShowMessageForm(false);
        fetchMessages();
        setError('');
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-logo">
              <img src={logo} alt="Zero Health Logo" className="header-logo-image" />
              <h1>Patient Portal</h1>
            </div>
          </div>
        </header>
        <div className="dashboard-loading">
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '3px solid #dee2e6',
              borderTop: '3px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2 style={{ color: 'var(--color-obscure-note)', fontWeight: '500', fontSize: '18px' }}>Loading Patient Portal...</h2>
            <p style={{ color: 'var(--color-obscure-note)', fontSize: '14px', marginTop: '8px' }}>Please wait while we fetch your medical data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-logo">
            <img src={logo} alt="Zero Health Logo" className="header-logo-image" />
            <h1>Patient Portal</h1>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.first_name || user?.email || 'Patient'}</span>
            <button onClick={handleLogout} className="logout-btn">
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
          <button 
            className={`tab-btn ${activeTab === 'lab-results' ? 'active' : ''}`}
            onClick={() => setActiveTab('lab-results')}
          >
            Lab Results
          </button>
          <button 
            className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            Prescriptions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            Messages
          </button>
        </div>

        {activeTab === 'appointments' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>My Appointments</h2>
              <button 
                onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                className="btn btn-primary"
              >
                {showAppointmentForm ? 'Cancel' : 'Book New Appointment'}
              </button>
            </div>

            {showAppointmentForm && (
              <div className="form-container">
                <h3>Book New Appointment</h3>
                <form onSubmit={handleBookAppointment}>
                  <div className="form-group">
                    <label>Doctor</label>
                    <select
                      value={newAppointment.doctor_id}
                      onChange={(e) => setNewAppointment({...newAppointment, doctor_id: e.target.value})}
                      required
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newAppointment.appointment_date}
                      onChange={(e) => setNewAppointment({...newAppointment, appointment_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Reason for Visit</label>
                    <textarea
                      value={newAppointment.reason}
                      onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})}
                      placeholder="Describe the reason for your appointment"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Book Appointment</button>
                </form>
              </div>
            )}

            <div className="data-list">
              {appointments.length === 0 ? (
                <p>No appointments found</p>
              ) : (
                appointments.map(appointment => (
                  <div key={appointment.id} className="data-item">
                    <h4>Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}</h4>
                    <p><strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleString()}</p>
                    <p><strong>Status:</strong> {appointment.status}</p>
                    <p><strong>Reason:</strong> {appointment.reason}</p>
                    {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'lab-results' && (
          <div className="tab-content">
            <h2>Lab Results</h2>
            <div className="data-list">
              {labResults.length === 0 ? (
                <p>No lab results found</p>
              ) : (
                labResults.map(result => (
                  <div key={result.id} className="data-item">
                    <h4>{result.test_name}</h4>
                    <p><strong>Test Date:</strong> {new Date(result.test_date).toLocaleDateString()}</p>
                    <p><strong>Doctor:</strong> Dr. {result.doctor_first_name} {result.doctor_last_name}</p>
                    <div className="result-data">
                      <strong>Results:</strong>
                      <div style={{ marginTop: '8px' }} dangerouslySetInnerHTML={{__html: result.result}}></div>
                    </div>
                    {result.file_path && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Lab Image:</strong>
                        <div style={{ marginTop: '8px' }}>
                          <img 
                            src={buildUploadUrl(result.file_path)} 
                            alt="Lab result" 
                            style={{
                              maxWidth: '100%',
                              height: 'auto',
                              maxHeight: '300px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(buildUploadUrl(result.file_path), '_blank')}
                          />
                          <div style={{ marginTop: '4px' }}>
                            <button
                              onClick={() => window.open(buildUploadUrl(result.file_path), '_blank')}
                              style={{
                                background: 'var(--color-teal-zero)',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              View Full Size
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="tab-content">
            <h2>My Prescriptions</h2>
            <div className="data-list">
              {prescriptions.length === 0 ? (
                <p>No prescriptions found</p>
              ) : (
                prescriptions.map(prescription => (
                  <div key={prescription.id} className="data-item">
                    <h4>{prescription.medication_name}</h4>
                    <p><strong>Prescribed by:</strong> Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}</p>
                    <p><strong>Dosage:</strong> {prescription.dosage}</p>
                    <p><strong>Frequency:</strong> {prescription.frequency}</p>
                    <p><strong>Duration:</strong> {prescription.duration}</p>
                    <p><strong>Status:</strong> {prescription.status}</p>
                    <p><strong>Prescribed Date:</strong> {prescription.prescribed_date}</p>
                    {prescription.instructions && <p><strong>Instructions:</strong> {prescription.instructions}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Messages</h2>
              <button 
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="btn btn-primary"
              >
                {showMessageForm ? 'Cancel' : 'New Message'}
              </button>
            </div>

            {showMessageForm && (
              <div className="form-container">
                <h3>Send New Message</h3>
                <form onSubmit={handleSendMessage}>
                  <div className="form-group">
                    <label>To (Doctor)</label>
                    <select
                      value={newMessage.recipient_id}
                      onChange={(e) => setNewMessage({...newMessage, recipient_id: e.target.value})}
                      required
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                      placeholder="Message subject"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                      placeholder="Type your message here..."
                      rows="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Attach Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setMessageAttachment(e.target.files[0])}
                    />
                    {messageAttachment && (
                      <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
                        <p>Selected: {messageAttachment.name}</p>
                        <img 
                          src={URL.createObjectURL(messageAttachment)} 
                          alt="Preview" 
                          style={{height: '80px', width: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd'}}
                        />
                      </div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary">Send Message</button>
                </form>
              </div>
            )}

            <div className="messages-container">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-obscure-note)', padding: '40px 20px' }}>
                  <p style={{ fontSize: '16px' }}>No messages yet</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Start a conversation with your healthcare provider</p>
                </div>
              ) : (
                messages.map(message => {
                  const isSentByUser = message.sender_id === user?.id;
                  const messageDate = new Date(message.created_at);
                  const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateString = messageDate.toLocaleDateString();
                  
                  return (
                    <div key={message.id} className={`message-item ${isSentByUser ? 'sent' : 'received'}`}>
                      <div className={`message-bubble ${isSentByUser ? 'sent' : 'received'}`}>
                        <div className="message-header">
                          <span className="message-sender">
                            {isSentByUser ? 'You' : `${message.sender_first_name} ${message.sender_last_name} (${message.sender_role})`}
                          </span>
                          <span className="message-time">{dateString} {timeString}</span>
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add the Chatbot component */}
      <Chatbot user={user} />
    </div>
  );
};

export default PatientPortal; 