-- Deliberately weak database configuration
-- No password complexity requirements
-- No encryption
-- Predictable IDs
-- Excessive permissions
-- Weak constraints

-- Create users table with weak security (single table for all user types)
CREATE TABLE users (
    id SERIAL PRIMARY KEY, -- Predictable IDs
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255), -- Will store plaintext passwords
    role VARCHAR(50) DEFAULT 'patient', -- patient, doctor, admin
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    specialization VARCHAR(255), -- For doctors: their medical specialty
    license_number VARCHAR(100), -- For doctors: their license number
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create medical_records table 
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create medical_history table for XML import (XXE vulnerability)
CREATE TABLE medical_history (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id),
    conditions TEXT, -- Stores processed XML content (XSS vulnerable)
    medications TEXT, -- Stores processed XML content (XSS vulnerable)
    allergies TEXT, -- Stores processed XML content (XSS vulnerable)
    import_date TIMESTAMP,
    imported_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY, -- Predictable IDs
    patient_id INTEGER REFERENCES users(id),
    doctor_id INTEGER REFERENCES users(id),
    appointment_date TIMESTAMP,
    status VARCHAR(20), -- No enum type for status validation
    reason TEXT, -- Added reason field for appointment booking
    notes TEXT, -- Doctor notes (stored XSS vulnerable)
    patient_feedback TEXT, -- Patient feedback (stored XSS vulnerable)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prescriptions table
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY, -- Predictable IDs
    patient_id INTEGER REFERENCES users(id),
    doctor_id INTEGER REFERENCES users(id),
    medication_name VARCHAR(100),
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    duration VARCHAR(50), -- Added duration field
    instructions TEXT, -- Added instructions field
    status VARCHAR(20) DEFAULT 'pending', -- No enum type for status validation
    collected_date DATE, -- Added collected_date field
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lab_results table
CREATE TABLE lab_results (
    id SERIAL PRIMARY KEY, -- Predictable IDs
    patient_id INTEGER REFERENCES users(id),
    doctor_id INTEGER REFERENCES users(id),
    test_name VARCHAR(100),
    result TEXT, -- Storing sensitive data in plaintext
    test_date DATE,
    file_path TEXT, -- Storing file paths without validation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY, -- Predictable IDs
    sender_id INTEGER REFERENCES users(id),
    recipient_id INTEGER REFERENCES users(id),
    subject VARCHAR(255),
    content TEXT, -- No XSS protection (stored XSS vulnerable)
    attachment_path TEXT, -- Added field for image attachments
    message_type VARCHAR(50) DEFAULT 'general', -- general, appointment, prescription, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- Create chat_history table for LLM conversation context
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY, -- Predictable IDs
    user_id INTEGER REFERENCES users(id),
    message TEXT, -- No XSS protection
    response TEXT, -- No validation on LLM responses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deliberately weak indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_medical_history_patient_id ON medical_history(patient_id); 