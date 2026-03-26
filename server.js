const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();

// JWT secret configuration
const JWT_SECRET = 'zero-health-super-secret-key';

// CORS configuration
app.use(cors({
    origin: true,  // Allow any origin (deliberately insecure)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin', 'Cache-Control', 'X-File-Name'],  // Explicit headers for credentials mode
    exposedHeaders: ['Content-Type', 'Authorization', 'X-Total-Count'],  // Explicit headers for credentials mode
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Database configuration
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'db',
    database: process.env.POSTGRES_DB || 'zero_health',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
});

// The sample data script will handle all database initialization
// No need for duplicate schema creation here

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Very weak file filtering - allows most dangerous file types
        const blockedExtensions = ['.exe', '.bat', '.cmd']; // Only blocks obvious Windows executables
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (blockedExtensions.includes(fileExtension)) {
            cb(new Error('Executable files not allowed'), false);
        } else {
            cb(null, true); // Allow everything else including .php, .js, .html, .svg, etc.
        }
    }
});

// Deliberately weak JWT verification middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('Token verification attempt:', token ? 'Token present' : 'No token');
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // Deliberately weak: Accept unsigned tokens and multiple algorithms
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256', 'none'] });
        } catch (verifyError) {
            // Fallback to decode without verification for "debug" tokens
            decoded = jwt.decode(token);
            if (!decoded || !decoded.id) {
                throw new Error('Invalid token structure');
            }
            console.log('Accepted unverified token for debugging:', decoded);
        }
        
        console.log('Token decoded successfully:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Add OPTIONS handlers for all API endpoints
app.options('/api/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, X-File-Name');
    res.status(204).end();
});

/**
 * @swagger
 * /api/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account in the Zero Health system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 minLength: 3
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Authentication endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Deliberately weak password validation
        if (!password || password.length < 3) {
            return res.status(400).json({ error: 'Password must be at least 3 characters' });
        }

        // Weak password hashing (using only 5 rounds)
        const hashedPassword = await bcrypt.hash(password, 5);
        
        // SQL injection vulnerable query
        const result = await pool.query(
            `INSERT INTO users (email, password) VALUES ('${email}', '${hashedPassword}') RETURNING id, email, role`
        );

        const user = result.rows[0];
        
        // Generate JWT token with weak settings
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            JWT_SECRET,
            { 
                expiresIn: '24h',  // Deliberately long expiration
                algorithm: 'HS256' // Weak algorithm
            }
        );

        res.status(201).json({ 
            user: user,
            token: token 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user credentials and receive access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: patient@test.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // No rate limiting - vulnerable to brute force attacks
        console.log('Login attempt:', { email, password: password ? '[REDACTED]' : 'undefined' });

        // SQL injection vulnerable query
        const result = await pool.query(
            `SELECT * FROM users WHERE email = '${email}'`
        );

        console.log('User lookup result:', result.rows.length > 0 ? 'User found' : 'User not found');

        if (result.rows.length === 0) {
            console.log('Login failed: User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        console.log('Password validation:', validPassword ? 'Valid' : 'Invalid');

        if (!validPassword) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token with weak settings
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            JWT_SECRET,
            { 
                expiresIn: '24h',  // Deliberately long expiration
                algorithm: 'HS256' // Weak algorithm
            }
        );
        
        console.log('Login successful, token generated for user:', user.id);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/logout', (req, res) => {
    // Note: With JWT, logout is handled client-side by removing the token
    res.json({ message: 'Logged out successfully. Please remove token from client.' });
});

// Medical records endpoints (now using JWT)
app.post('/api/medical-records', verifyToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.user.id;

        console.log('Creating medical record for user:', userId);

        // Use parameterized query to avoid SQL injection
        const result = await pool.query(
            `INSERT INTO medical_records (user_id, title, content) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [userId, title, content]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create medical record error:', error);
        res.status(500).json({ error: 'Failed to create medical record' });
    }
});

app.get('/api/medical-records', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        console.log('Fetching medical records for user:', userId);

        // Use parameterized query to avoid SQL injection
        const result = await pool.query(
            `SELECT mr.*, u.email as user_email 
             FROM medical_records mr 
             JOIN users u ON mr.user_id = u.id 
             WHERE mr.user_id = $1`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get medical records error:', error);
        res.status(500).json({ error: 'Failed to get medical records' });
    }
});

// ===== APPOINTMENT ENDPOINTS =====
app.get('/api/appointments', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query;
        let params = [userId];
        
        if (userRole === 'patient') {
            query = `SELECT a.*, 
                           d.first_name as doctor_first_name, d.last_name as doctor_last_name
                     FROM appointments a 
                     JOIN users d ON a.doctor_id = d.id 
                     WHERE a.patient_id = $1`;
        } else if (userRole === 'doctor') {
            query = `SELECT a.*, 
                           p.first_name as patient_first_name, p.last_name as patient_last_name
                     FROM appointments a 
                     JOIN users p ON a.patient_id = p.id 
                     WHERE a.doctor_id = $1`;
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ error: 'Failed to get appointments' });
    }
});

app.post('/api/appointments', verifyToken, async (req, res) => {
    try {
        const { doctor_id, appointment_date, reason, notes } = req.body;
        const patient_id = req.user.id;
        
        // Stored XSS vulnerability - notes are stored without sanitization
        const result = await pool.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, notes) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [patient_id, doctor_id, appointment_date, reason, notes || '']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

// ===== APPOINTMENT NOTES UPDATE - Stored XSS vulnerability =====
app.put('/api/appointments/:id/notes', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, patient_feedback } = req.body;
        const userId = req.user.id;
        
        // Check if user can update this appointment
        const appointmentCheck = await pool.query(
            'SELECT * FROM appointments WHERE id = $1',
            [id]
        );
        
        if (appointmentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        const appointment = appointmentCheck.rows[0];
        
        // Allow patients to add feedback, doctors to add notes
        if (req.user.role === 'patient' && appointment.patient_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        } else if (req.user.role === 'doctor' && appointment.doctor_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        let updateQuery = '';
        let updateValues = [];
        
        if (req.user.role === 'patient') {
            // Patients can add feedback - stored XSS vulnerability
            updateQuery = `UPDATE appointments SET patient_feedback = $1 WHERE id = $2 RETURNING *`;
            updateValues = [patient_feedback, id];
        } else if (req.user.role === 'doctor' || req.user.role === 'admin') {
            // Doctors can update notes - stored XSS vulnerability
            updateQuery = `UPDATE appointments SET notes = $1 WHERE id = $2 RETURNING *`;
            updateValues = [notes, id];
        }
        
        const result = await pool.query(updateQuery, updateValues);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update appointment notes error:', error);
        res.status(500).json({ error: 'Failed to update appointment notes' });
    }
});

app.get('/api/doctors', verifyToken, async (req, res) => {
    try {
        // Excessive data exposure - returns sensitive fields like password hash, personal info
        const result = await pool.query(
            `SELECT id, first_name, last_name, email, password, phone, date_of_birth, address, 
                    specialization, license_number, created_at 
             FROM users WHERE role = 'doctor'`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({ error: 'Failed to get doctors' });
    }
});

// ===== LAB RESULTS ENDPOINTS =====
app.get('/api/lab-results', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query;
        let params = [];
        
        if (userRole === 'patient') {
            // Patients can only see their own results
            query = `SELECT lr.*, 
                           d.first_name as doctor_first_name, d.last_name as doctor_last_name
                     FROM lab_results lr 
                     JOIN users d ON lr.doctor_id = d.id 
                     WHERE lr.patient_id = $1`;
            params = [userId];
        } else {
            // Staff can see all lab results (less restrictive)
            query = `SELECT lr.*, 
                           p.first_name as patient_first_name, p.last_name as patient_last_name,
                           d.first_name as doctor_first_name, d.last_name as doctor_last_name
                     FROM lab_results lr 
                     JOIN users p ON lr.patient_id = p.id 
                     JOIN users d ON lr.doctor_id = d.id 
                     ORDER BY lr.test_date DESC`;
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get lab results error:', error);
        res.status(500).json({ error: 'Failed to get lab results' });
    }
});

app.post('/api/lab-results', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ error: 'Doctor access required' });
        }
        
        const { patient_id, test_name, result_data, test_date } = req.body;
        const doctor_id = req.user.id;
        const file_path = req.file ? req.file.filename : null;
        
        // Use parameterized query to avoid SQL injection
        const result = await pool.query(
            `INSERT INTO lab_results (patient_id, doctor_id, test_name, result, test_date, file_path) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [patient_id, doctor_id, test_name, result_data, test_date, file_path]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create lab result error:', error);
        res.status(500).json({ error: 'Failed to create lab result' });
    }
});

// ===== VULNERABLE ENDPOINT - Direct lab result access (IDOR) =====
app.get('/api/lab-results/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // IDOR vulnerability - no check if user can access this lab result
        const result = await pool.query(
            `SELECT lr.*, 
                    p.first_name as patient_first_name, p.last_name as patient_last_name,
                    d.first_name as doctor_first_name, d.last_name as doctor_last_name
             FROM lab_results lr 
             JOIN users p ON lr.patient_id = p.id 
             JOIN users d ON lr.doctor_id = d.id 
             WHERE lr.id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lab result not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get lab result error:', error);
        res.status(500).json({ error: 'Failed to get lab result' });
    }
});

// ===== PRESCRIPTION ENDPOINTS =====
app.get('/api/prescriptions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query;
        let params = [userId];
        
        if (userRole === 'patient') {
            query = `SELECT p.*, 
                           d.first_name as doctor_first_name, d.last_name as doctor_last_name
                     FROM prescriptions p 
                     JOIN users d ON p.doctor_id = d.id 
                     WHERE p.patient_id = $1`;
        } else if (userRole === 'doctor') {
            query = `SELECT p.*, 
                           pt.first_name as patient_first_name, pt.last_name as patient_last_name
                     FROM prescriptions p 
                     JOIN users pt ON p.patient_id = pt.id 
                     WHERE p.doctor_id = $1`;
        } else if (userRole === 'pharmacist') {
            query = `SELECT p.*, 
                           pt.first_name as patient_first_name, pt.last_name as patient_last_name,
                           d.first_name as doctor_first_name, d.last_name as doctor_last_name
                     FROM prescriptions p 
                     JOIN users pt ON p.patient_id = pt.id 
                     JOIN users d ON p.doctor_id = d.id`;
            params = [];
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get prescriptions error:', error);
        res.status(500).json({ error: 'Failed to get prescriptions' });
    }
});

app.post('/api/prescriptions', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ error: 'Doctor access required' });
        }
        
        const { patient_id, medication_name, dosage, frequency, duration, instructions } = req.body;
        const doctor_id = req.user.id;
        
        // Use parameterized query to avoid SQL injection
        const result = await pool.query(
            `INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create prescription error:', error);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
});

app.put('/api/prescriptions/:id/collect', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'pharmacist') {
            return res.status(403).json({ error: 'Pharmacist access required' });
        }
        
        const { id } = req.params;
        
        // Use parameterized query
        const result = await pool.query(
            `UPDATE prescriptions SET status = 'collected', collected_date = CURRENT_DATE 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update prescription error:', error);
        res.status(500).json({ error: 'Failed to update prescription' });
    }
});

// ===== MESSAGE ENDPOINTS =====
app.get('/api/messages', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // SQL injection vulnerable query - get all messages for user
        const result = await pool.query(
            `SELECT m.*, 
                    s.first_name as sender_first_name, s.last_name as sender_last_name, s.role as sender_role,
                    r.first_name as recipient_first_name, r.last_name as recipient_last_name, r.role as recipient_role
             FROM messages m 
             JOIN users s ON m.sender_id = s.id 
             JOIN users r ON m.recipient_id = r.id 
             WHERE m.sender_id = '${userId}' OR m.recipient_id = '${userId}'
             ORDER BY m.created_at DESC`
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

app.post('/api/messages', verifyToken, upload.single('attachment'), async (req, res) => {
    try {
        const { recipient_id, subject, content, message_type = 'general' } = req.body;
        const sender_id = req.user.id;
        const attachment_path = req.file ? req.file.filename : null;
        
        // Stored XSS vulnerability - content stored without sanitization
        // SQL injection vulnerable query - including attachment support
        const result = await pool.query(
            `INSERT INTO messages (sender_id, recipient_id, subject, content, attachment_path, message_type) 
             VALUES ('${sender_id}', '${recipient_id}', '${subject}', '${content}', '${attachment_path}', '${message_type}') 
             RETURNING *`
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ error: 'Failed to create message' });
    }
});

app.get('/api/patients', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ error: 'Doctor access required' });
        }
        
        // SQL injection vulnerable query
        const result = await pool.query(
            `SELECT id, first_name, last_name, email, phone, date_of_birth, gender FROM users WHERE role = 'patient'`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ error: 'Failed to get patients' });
    }
});

// =======================
// CHATBOT ENDPOINTS - DELIBERATELY VULNERABLE
// =======================

// Include the chatbot routes
const chatbotRoutes = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoutes);

// =======================
// SWAGGER API DOCUMENTATION
// =======================
const { specs, swaggerUi } = require('./swagger');

// Serve Swagger UI at /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Zero Health API Documentation'
}));

// Serve raw OpenAPI spec as JSON
app.get('/api/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

/**
 * @swagger
 * /api/debug/connection:
 *   get:
 *     tags: [Debug]
 *     summary: Get database connection details
 *     description: Retrieve current database connection configuration for monitoring
 *     responses:
 *       200:
 *         description: Database connection details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: string
 *                   example: postgres
 *                 host:
 *                   type: string
 *                   example: db
 *                 database:
 *                   type: string
 *                   example: zero_health
 *                 port:
 *                   type: integer
 *                   example: 5432
 */
// Exposed database connection for demonstration
app.get('/api/debug/connection', (req, res) => {
    res.json({
        user: pool.options.user,
        host: pool.options.host,
        database: pool.options.database,
        port: pool.options.port
    });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Debug]
 *     summary: API health check
 *     description: Basic health check endpoint
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: vulnerable
 */
// Basic health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'vulnerable' });
});

// Ollama setup status endpoint
app.get('/api/ollama/status', (req, res) => {
    const fs = require('fs');
    try {
        // Check if setup log exists
        const logPath = '/tmp/ollama-setup.log';
        if (fs.existsSync(logPath)) {
            const log = fs.readFileSync(logPath, 'utf8');
            const isComplete = log.includes('🎉 Ollama setup complete!');
            const hasError = log.includes('❌');
            
            res.json({
                status: isComplete ? 'ready' : hasError ? 'error' : 'setting_up',
                log: log.split('\n').slice(-10).join('\n'), // Last 10 lines
                provider: process.env.LLM_PROVIDER || 'ollama',
                model: process.env.OLLAMA_MODEL || 'llama3.2:3b'
            });
        } else {
            res.json({
                status: 'unknown',
                message: 'Setup log not found',
                provider: process.env.LLM_PROVIDER || 'ollama'
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            error: error.message,
            provider: process.env.LLM_PROVIDER || 'ollama'
        });
    }
});

/**
 * @swagger
 * /api/debug/token:
 *   get:
 *     tags: [Debug]
 *     summary: Generate debug token (Development only)
 *     description: Generate a development token for testing purposes
 *     parameters:
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *           enum: [patient, doctor, pharmacist, admin]
 *         description: Role for the debug token
 *       - name: id
 *         in: query
 *         schema:
 *           type: integer
 *         description: User ID for the debug token
 *     responses:
 *       200:
 *         description: Debug token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 debug_token:
 *                   type: string
 *                 warning:
 *                   type: string
 */
app.get('/api/debug/token', (req, res) => {
    const { role = 'patient', id = '1' } = req.query;
    
    // Generate weak debug token with no algorithm specification
    const debugToken = jwt.sign(
        { 
            id: parseInt(id), 
            email: `debug@${role}.com`, 
            role: role,
            debug: true
        },
        'debug-key',  // Weak secret
        { 
            expiresIn: '1h',
            algorithm: 'none'  // No signature verification
        }
    );
    
    res.json({
        debug_token: debugToken,
        role: role,
        id: id,
        warning: 'Debug token - not for production use'
    });
});

// =======================
// ADMIN ENDPOINTS - USER MANAGEMENT & STATISTICS
// =======================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users (Admin only)
 *     description: Retrieve a complete list of all users in the system (requires administrative privileges)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all users (admin only)
app.get('/api/admin/users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        // SQL injection vulnerable query
        const result = await pool.query(
            `SELECT id, email, role, first_name, last_name, phone, specialization, license_number, created_at 
             FROM users ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// ===== USER PROFILE UPDATE - Mass Assignment vulnerability =====
app.put('/api/users/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Mass assignment vulnerability - updates any field provided in request body
        const allowedFields = Object.keys(req.body);
        const updateValues = Object.values(req.body);
        
        if (allowedFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        // Build dynamic query - dangerous but educational
        const setClause = allowedFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, email, role, first_name, last_name`;
        
        console.log('Profile update query:', query);
        console.log('Update values:', updateValues);
        
        const result = await pool.query(query, [userId, ...updateValues]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * @swagger
 * /api/reports/generate:
 *   post:
 *     tags: [Reports]
 *     summary: Generate PDF medical report
 *     description: Generate a comprehensive PDF report for a patient including their medical history, recent appointments, and lab results. Requires doctor or admin privileges.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - report_type
 *             properties:
 *               patient_id:
 *                 type: integer
 *                 description: ID of the patient for whom to generate the report
 *                 example: 2
 *               report_type:
 *                 type: string
 *                 description: Type of medical report to generate
 *                 enum: [comprehensive, lab_results, appointment_summary, prescription_history]
 *                 example: comprehensive
 *               format:
 *                 type: string
 *                 description: Page size for the PDF document
 *                 enum: [A4, Letter, Legal, A3]
 *                 default: A4
 *                 example: A4
 *               orientation:
 *                 type: string
 *                 description: Page orientation for the PDF document
 *                 enum: [portrait, landscape]
 *                 default: portrait
 *                 example: portrait
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Doctor or admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: PDF generation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: PDF generation failed
 *                 details:
 *                   type: string
 *                   example: wkhtmltopdf command execution failed
 *                 command:
 *                   type: string
 *                   example: wkhtmltopdf --page-size A4 --orientation portrait --title "John Smith Medical Report" --author "John Smith" "/path/to/file.html" "/path/to/file.pdf"
 */
// ===== PDF REPORT GENERATION - Command Injection vulnerability =====
app.post('/api/reports/generate', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Doctor or admin access required' });
        }
        
        const { patient_id, report_type, format = 'A4', orientation = 'portrait' } = req.body;
        
        if (!patient_id || !report_type) {
            return res.status(400).json({ error: 'Patient ID and report type required' });
        }
        
        // Fetch patient data to include in report
        const patientResult = await pool.query(
            'SELECT first_name, last_name, email FROM users WHERE id = $1 AND role = $2',
            [patient_id, 'patient']
        );
        
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const patient = patientResult.rows[0];
        const patientName = `${patient.first_name} ${patient.last_name}`;
        
        // Fetch recent appointment data (patient-controlled content)
        const appointmentResult = await pool.query(
            'SELECT reason, appointment_date FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC LIMIT 3',
            [patient_id]
        );
        
        // Generate HTML content for the report
        let appointmentHtml = '';
        if (appointmentResult.rows.length > 0) {
            appointmentHtml = appointmentResult.rows.map(apt => 
                `<p>• ${apt.reason} (${new Date(apt.appointment_date).toLocaleDateString()})</p>`
            ).join('');
        }
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Medical Report - ${patientName}</title></head>
        <body>
            <h1>Zero Health Medical Report</h1>
            <h2>Patient: ${patientName}</h2>
            <p>Patient ID: ${patient_id}</p>
            <p>Report Type: ${report_type}</p>
            <p>Generated: ${new Date().toISOString()}</p>
            <h3>Recent Appointments:</h3>
            ${appointmentHtml}
        </body>
        </html>
        `;
        
        // Save temporary HTML file
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const htmlFile = path.join(tempDir, `report_${patient_id}_${Date.now()}.html`);
        const pdfFile = path.join(tempDir, `report_${patient_id}_${Date.now()}.pdf`);
        
        fs.writeFileSync(htmlFile, htmlContent);
        
        // Command injection vulnerability - patient name used directly in PDF metadata
        // An attacker could set their name to: John; rm -rf /tmp; echo Smith
        const command = `wkhtmltopdf --page-size ${format} --orientation ${orientation} --title "${patientName} Medical Report" --author "${patientName}" "${htmlFile}" "${pdfFile}"`;
        
        console.log('Generating PDF with command:', command);
        
        const { exec } = require('child_process');
        exec(command, (error, stdout, stderr) => {
            // Clean up temp HTML file
            if (fs.existsSync(htmlFile)) {
                fs.unlinkSync(htmlFile);
            }
            
            if (error) {
                console.error('PDF generation error:', error);
                res.status(500).json({ 
                    error: 'PDF generation failed', 
                    details: error.message,
                    command: command  // Exposing command for debugging
                });
            } else {
                // Check if PDF was created
                if (fs.existsSync(pdfFile)) {
                    res.download(pdfFile, `medical_report_${patientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, (downloadError) => {
                        // Clean up PDF file after download
                        if (fs.existsSync(pdfFile)) {
                            fs.unlinkSync(pdfFile);
                        }
                    });
                } else {
                    res.status(500).json({ error: 'PDF file not generated' });
                }
            }
        });
        
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// ===== AUTOMATIC SAMPLE DATA INITIALIZATION =====
async function initializeSampleDataOnStartup() {
    try {
        console.log('🔍 Checking if sample data initialization is needed...');
        
        // Import the initialization function
        const { initializeSampleData } = require('./scripts/init-sample-data');
        
        // Run initialization (it's idempotent - safe to run multiple times)
        await initializeSampleData();
        
    } catch (error) {
        console.log('⚠️ Sample data initialization failed, but continuing server startup:', error.message);
    }
}

// Wait for database and initialize sample data before starting server
const startServer = async () => {
    try {
        // Wait for database to be ready
        const { waitForDatabase } = require('./scripts/wait-for-db');
        await waitForDatabase();
        
        // Initialize sample data
        await initializeSampleDataOnStartup();
        
        // Start the server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🌐 Zero Health Server running on port ${PORT}`);
            console.log('🏥 Healthcare Portal API initialized successfully');
            console.log('📧 Test Patient login: patient@test.com / password123');
            console.log('👩‍⚕️ Test Doctor login: doctor@test.com / password123');
        });
    } catch (error) {
        console.error('💥 Database connection failed:', error.message);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(() => startServer(), 5000);
    }
};

// Start the server with initialization
startServer().catch(error => {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
}); 

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== FILE DOWNLOAD ENDPOINT - Directory Traversal vulnerability =====
app.get('/api/files/:filename', verifyToken, async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Directory traversal vulnerability - direct concatenation allows ../../../etc/passwd
        const filePath = __dirname + '/uploads/' + filename;
        
        console.log('File download request:', filename);
        console.log('Resolved path:', filePath);
        
        // Check if file exists
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('File download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// ===== SEARCH ENDPOINT - Reflected XSS vulnerability =====
app.get('/api/search', verifyToken, async (req, res) => {
    try {
        const { q, type = 'patients' } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }
        
        let results = [];
        let searchQuery = '';
        
        // Reflected XSS vulnerability - query parameter directly reflected in response
        const searchSummary = `<div class="search-summary">
            <h3>Search Results for: <span class="search-term">${q}</span></h3>
            <p>Search type: ${type}</p>
        </div>`;
        
        if (req.user.role === 'doctor' || req.user.role === 'admin') {
            if (type === 'patients') {
                // SQL injection vulnerable query
                searchQuery = `SELECT id, first_name, last_name, email, phone FROM users WHERE role = 'patient' AND (first_name ILIKE '%${q}%' OR last_name ILIKE '%${q}%' OR email ILIKE '%${q}%')`;
            } else if (type === 'appointments') {
                searchQuery = `SELECT a.*, p.first_name, p.last_name FROM appointments a JOIN users p ON a.patient_id = p.id WHERE a.reason ILIKE '%${q}%'`;
            }
        } else if (req.user.role === 'pharmacist') {
            if (type === 'prescriptions') {
                searchQuery = `SELECT pr.*, p.first_name, p.last_name FROM prescriptions pr JOIN users p ON pr.patient_id = p.id WHERE pr.medication_name ILIKE '%${q}%'`;
            }
        } else {
            // Patients can only search their own data
            searchQuery = `SELECT * FROM appointments WHERE patient_id = ${req.user.id} AND reason ILIKE '%${q}%'`;
        }
        
        if (searchQuery) {
            const result = await pool.query(searchQuery);
            results = result.rows;
        }
        
        res.json({
            searchSummary: searchSummary, // XSS vulnerability here
            query: q,
            type: type,
            results: results,
            count: results.length
        });
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Search failed',
            searchSummary: `<div class="error">Search for "${req.query.q}" failed</div>` // XSS here too
        });
    }
});

// ===== XML MEDICAL HISTORY IMPORT - XXE and RCE vulnerabilities =====
app.post('/api/medical-history/import', verifyToken, upload.single('xmlFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'XML file required' });
        }
        
        const xmlContent = fs.readFileSync(req.file.path, 'utf8');
        
        // XXE vulnerability - using libxmljs with external entity processing enabled
        const libxmljs = require('libxmljs');
        
        try {
            // Dangerous XML parsing - allows external entities
            const xmlDoc = libxmljs.parseXml(xmlContent, {
                noent: true,    // Enable entity substitution (XXE vulnerability)
                dtdload: true,  // Load external DTD
                dtdvalid: true  // Validate against DTD
            });
            
            // Extract medical history data
            const patientData = {};
            const conditions = xmlDoc.find('//condition');
            const medications = xmlDoc.find('//medication');
            const allergies = xmlDoc.find('//allergy');
            
            // Process conditions with potential RCE
            const processedConditions = [];
            conditions.forEach(condition => {
                const conditionText = condition.text();
                
                // Command injection vulnerability in processing
                if (conditionText.includes('{{eval:')) {
                    const evalMatch = conditionText.match(/\{\{eval:(.*?)\}\}/);
                    if (evalMatch) {
                        try {
                            // RCE vulnerability - evaluating user input
                            const result = eval(evalMatch[1]);
                            processedConditions.push(`Processed: ${result}`);
                        } catch (e) {
                            processedConditions.push(`Error processing: ${conditionText}`);
                        }
                    }
                } else {
                    processedConditions.push(conditionText);
                }
            });
            
            // Store in database with SQL injection vulnerability
            const historyData = {
                conditions: processedConditions.join(', '),
                medications: medications.map(m => m.text()).join(', '),
                allergies: allergies.map(a => a.text()).join(', '),
                import_date: new Date().toISOString(),
                imported_by: req.user.id
            };
            
            // SQL injection vulnerable insert
            const insertQuery = `INSERT INTO medical_history (patient_id, conditions, medications, allergies, import_date, imported_by) 
                               VALUES ('${req.user.id}', '${historyData.conditions}', '${historyData.medications}', '${historyData.allergies}', '${historyData.import_date}', '${historyData.imported_by}')`;
            
            await pool.query(insertQuery);
            
            res.json({
                message: 'Medical history imported successfully',
                processed: {
                    conditions: processedConditions.length,
                    medications: medications.length,
                    allergies: allergies.length
                },
                xmlPreview: xmlContent.substring(0, 500) + '...'
            });
            
        } catch (xmlError) {
            // Expose XML parsing errors (information disclosure)
            res.status(400).json({
                error: 'XML parsing failed',
                details: xmlError.message,
                xmlContent: xmlContent.substring(0, 200) // Partial content exposure
            });
        }
        
    } catch (error) {
        console.error('XML import error:', error);
        res.status(500).json({ 
            error: 'Import failed',
            stack: error.stack // Stack trace exposure
        });
    } finally {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

// ===== ENHANCED FILE UPLOAD WITH EXECUTION - RCE vulnerability =====
app.post('/api/files/upload-advanced', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File required' });
        }
        
        const { executeFile, fileType } = req.body;
        const filePath = req.file.path;
        const fileName = req.file.filename;
        const originalName = req.file.originalname;
        
        // Very weak file type validation
        const dangerousExtensions = ['.exe', '.bat']; // Only blocks Windows executables
        const fileExtension = path.extname(originalName).toLowerCase();
        
        // Allow dangerous files like .php, .js, .py, .sh, .jsp, .asp
        if (dangerousExtensions.includes(fileExtension)) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Executable files not allowed' });
        }
        
        // File execution vulnerability
        if (executeFile === 'true') {
            const { exec } = require('child_process');
            let command = '';
            
            // Determine execution command based on file type
            switch (fileExtension) {
                case '.js':
                    command = `node "${filePath}"`;
                    break;
                case '.py':
                    command = `python3 "${filePath}"`;
                    break;
                case '.sh':
                    command = `bash "${filePath}"`;
                    break;
                case '.php':
                    command = `php "${filePath}"`;
                    break;
                default:
                    // Try to execute anyway (dangerous)
                    command = `"${filePath}"`;
            }
            
            console.log('Executing uploaded file:', command);
            
            exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
                const executionResult = {
                    fileName: fileName,
                    originalName: originalName,
                    executed: true,
                    command: command,
                    stdout: stdout,
                    stderr: stderr,
                    error: error ? error.message : null
                };
                
                res.json(executionResult);
            });
        } else {
            // Just store the file
            res.json({
                fileName: fileName,
                originalName: originalName,
                size: req.file.size,
                path: `/uploads/${fileName}`,
                executed: false
            });
        }
        
    } catch (error) {
        console.error('Advanced file upload error:', error);
        res.status(500).json({ 
            error: 'Upload failed',
            details: error.message
        });
    }
});

// ===== PARAMETER POLLUTION VULNERABILITY =====
app.get('/api/users/profile', verifyToken, async (req, res) => {
    try {
        // Parameter pollution vulnerability - last value wins
        let userId = req.user.id;
        
        // If admin, allow viewing other user profiles via user_id parameter
        if (req.user.role === 'admin' && req.query.user_id) {
            // Handle parameter pollution - if multiple user_id params, use the last one
            userId = Array.isArray(req.query.user_id) ? 
                     req.query.user_id[req.query.user_id.length - 1] : 
                     req.query.user_id;
        }
        
        // SQL injection vulnerability
        const query = `SELECT id, email, role, first_name, last_name, phone, specialization, license_number FROM users WHERE id = '${userId}'`;
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// ===== JWT ALGORITHM CONFUSION VULNERABILITY =====
app.post('/api/auth/verify-token', async (req, res) => {
    try {
        const { token, algorithm } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }
        
        // Algorithm confusion vulnerability - allows user to specify algorithm
        const verifyOptions = {
            algorithms: algorithm ? [algorithm] : ['HS256', 'RS256', 'none'] // Dangerous: allows 'none' algorithm
        };
        
        try {
            // Vulnerable JWT verification
            let decoded;
            if (algorithm === 'none') {
                // None algorithm bypass - just decode without verification
                decoded = jwt.decode(token);
            } else {
                decoded = jwt.verify(token, JWT_SECRET, verifyOptions);
            }
            
            res.json({
                valid: true,
                decoded: decoded,
                algorithm: algorithm || 'default',
                message: 'Token is valid'
            });
            
        } catch (jwtError) {
            res.status(401).json({
                valid: false,
                error: jwtError.message,
                algorithm: algorithm || 'default'
            });
        }
        
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// ===== RATE LIMITING BYPASS VULNERABILITY =====
let rateLimitStore = new Map();

app.post('/api/auth/login-with-rate-limit', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Weak rate limiting implementation
        const clientId = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection.remoteAddress ||
                        req.ip;
        
        // Rate limiting bypass vulnerabilities:
        // 1. Can be bypassed with X-Forwarded-For header
        // 2. Can be bypassed with X-Real-IP header  
        // 3. Uses client-controlled identifier
        
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 5;
        
        if (!rateLimitStore.has(clientId)) {
            rateLimitStore.set(clientId, { attempts: 0, resetTime: now + windowMs });
        }
        
        const clientData = rateLimitStore.get(clientId);
        
        if (now > clientData.resetTime) {
            // Reset window
            clientData.attempts = 0;
            clientData.resetTime = now + windowMs;
        }
        
        if (clientData.attempts >= maxAttempts) {
            return res.status(429).json({ 
                error: 'Too many login attempts',
                resetTime: clientData.resetTime,
                clientId: clientId // Information disclosure
            });
        }
        
        // Increment attempts
        clientData.attempts++;
        
        // Proceed with login (reuse existing login logic)
        const result = await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Reset attempts on successful login
        rateLimitStore.delete(clientId);
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h', algorithm: 'HS256' }
        );
        
        res.json({
            user: { id: user.id, email: user.email, role: user.role },
            token: token,
            rateLimitInfo: {
                attempts: clientData.attempts,
                maxAttempts: maxAttempts,
                resetTime: clientData.resetTime
            }
        });
        
    } catch (error) {
        console.error('Rate limited login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ===== SYSTEM INFO ENDPOINT - Information Disclosure =====
app.get('/api/info', (req, res) => {
    // No authentication required - exposes system information
    res.json({
        application: 'Zero Health',
        version: '2.1.3',
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        database: {
            host: process.env.POSTGRES_HOST || 'db',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'zero_health'
        },
        jwt_secret: JWT_SECRET,  // Exposed secret!
        admin_credentials: {
            email: 'admin@test.com',
            password: 'password123'
        },
        vulnerability_count: '∞',
        last_updated: '2024-12-15'
    });
});

// ===== FORGOT PASSWORD - Reflected XSS vulnerability =====
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        
        // Check if user exists
        const result = await pool.query(
            `SELECT id, first_name, last_name FROM users WHERE email = $1`,
            [email]
        );
        
        if (result.rows.length === 0) {
            // Don't reveal if email exists or not (security through obscurity)
            return res.json({ 
                message: 'If an account with that email exists, a password reset link has been sent.',
                emailGenerated: false
            });
        }
        
        const user = result.rows[0];
        
        // Generate a "recovery code" (deliberately weak)
        const recoveryCode = Math.random().toString(36).substring(2, 15);
        
        // Store recovery code in database (vulnerable to timing attacks)
        await pool.query(
            `UPDATE users SET password = $1 WHERE email = $2`,
            [`RESET_${recoveryCode}`, email] // Temporarily store in password field
        );
        
        // Generate the recovery URL with the code - point to React frontend
        const recoveryUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}&code=${recoveryCode}`;
        
        // Generate HTML email content (this simulates what would be sent)
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Zero Health - Password Reset</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f8f9fa; }
                .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
                .footer { font-size: 12px; color: #666; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏥 Zero Health</h1>
                <p>Password Reset Request</p>
            </div>
            <div class="content">
                <h2>Hello ${user.first_name} ${user.last_name},</h2>
                <p>We received a request to reset your password for your Zero Health account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${recoveryUrl}" class="button">Reset My Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px;">${recoveryUrl}</p>
                <p>This link will expire in 24 hours for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>This is an automated message from Zero Health. Please do not reply to this email.</p>
                <p>© 2024 Zero Health - Educational Healthcare Security Platform</p>
            </div>
        </body>
        </html>
        `;
        
        // Save the email HTML to a file (simulating email sending)
        const emailsDir = path.join(__dirname, 'emails');
        if (!fs.existsSync(emailsDir)) {
            fs.mkdirSync(emailsDir);
        }
        
        const emailFileName = `password-reset-${user.id}-${Date.now()}.html`;
        const emailFilePath = path.join(emailsDir, emailFileName);
        fs.writeFileSync(emailFilePath, emailHtml);
        
        res.json({
            message: 'If an account with that email exists, a password reset link has been sent.',
            emailGenerated: true,
            emailPreviewUrl: `/emails/${emailFileName}`,
            recoveryUrl: recoveryUrl, // Exposed for testing purposes
            note: 'In a real application, this would be sent via email. Check the email preview to see the reset link.'
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// Serve email files statically for preview
app.use('/emails', express.static(path.join(__dirname, 'emails')));

// ===== PASSWORD RESET - Reflected XSS vulnerability =====
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        
        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: 'Email, code, and new password required' });
        }
        
        // Check if user exists and has the correct reset code
        const result = await pool.query(
            `SELECT id, first_name, last_name, password FROM users WHERE email = $1`,
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid reset request' });
        }
        
        const user = result.rows[0];
        
        // Check if password field contains the reset code
        if (!user.password.startsWith('RESET_') || !user.password.includes(code)) {
            return res.status(400).json({ error: 'Invalid or expired reset code' });
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 5);
        
        // Update password
        await pool.query(
            `UPDATE users SET password = $1 WHERE email = $2`,
            [hashedPassword, email]
        );
        
        res.json({
            message: 'Password reset successfully',
            user: {
                id: user.id,
                email: email,
                name: `${user.first_name} ${user.last_name}`
            }
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// ===== PASSWORD RESET PAGE - Moved to React Frontend =====
// This server-side route is no longer used - replaced by React component
/*
app.get('/reset-password', (req, res) => {
    // This route has been moved to React frontend
    // XSS vulnerability is now demonstrated in React component using dangerouslySetInnerHTML
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?${req.url.split('?')[1] || ''}`);
});
*/

// ===== FORGOT PASSWORD PAGE =====
app.get('/forgot-password', (req, res) => {
    const { message, error } = req.query;
    
    const htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forgot Password - Zero Health</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                max-width: 500px;
                width: 100%;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2rem;
                color: #007bff;
                margin-bottom: 10px;
            }
            h1 {
                color: #333;
                margin-bottom: 10px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                color: #555;
                font-weight: 500;
            }
            input[type="email"] {
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
                box-sizing: border-box;
            }
            input[type="email"]:focus {
                border-color: #007bff;
                outline: none;
            }
            .btn {
                background: #007bff;
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                margin-top: 10px;
            }
            .btn:hover {
                background: #0056b3;
            }
            .message {
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            .back-link {
                text-align: center;
                margin-top: 20px;
            }
            .back-link a {
                color: #007bff;
                text-decoration: none;
            }
            .back-link a:hover {
                text-decoration: underline;
            }
            .email-preview {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 5px;
                padding: 15px;
                margin-top: 15px;
            }
            .email-preview h4 {
                margin-top: 0;
                color: #495057;
            }
            .email-preview a {
                color: #007bff;
                text-decoration: none;
                word-break: break-all;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏥</div>
                <h1>Forgot Your Password?</h1>
                <p>Enter your email address and we'll send you a reset link</p>
            </div>
            
            ${message ? `<div class="message success">
                <strong>Success:</strong> ${message}
            </div>` : ''}
            
            ${error ? `<div class="message error">
                <strong>Error:</strong> ${error}
            </div>` : ''}
            
            <form id="forgotForm" onsubmit="forgotPassword(event)">
                <div class="form-group">
                    <label for="email">Email Address:</label>
                    <input type="email" id="email" name="email" required placeholder="Enter your email address">
                </div>
                
                <button type="submit" class="btn">Send Reset Link</button>
            </form>
            
            <div class="back-link">
                <a href="/login">← Back to Login</a>
            </div>
            
            <div id="emailPreview" style="display: none;" class="email-preview">
                <h4>📧 Email Preview (Development Mode)</h4>
                <p>In a real application, this would be sent to your email. For testing purposes, you can view the email here:</p>
                <a id="emailLink" href="#" target="_blank">View Password Reset Email</a>
                <br><br>
                <p><strong>Direct Reset Link:</strong></p>
                <a id="resetLink" href="#" target="_blank">Reset Password Now</a>
            </div>
        </div>
        
        <script>
            async function forgotPassword(event) {
                event.preventDefault();
                
                const formData = new FormData(event.target);
                const email = formData.get('email');
                
                try {
                    const response = await fetch('/api/auth/forgot-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: email })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        if (result.emailGenerated) {
                            // Show email preview for testing
                            document.getElementById('emailPreview').style.display = 'block';
                            document.getElementById('emailLink').href = result.emailPreviewUrl;
                            document.getElementById('resetLink').href = result.recoveryUrl;
                            
                            // Show success message without redirecting
                            const messageDiv = document.createElement('div');
                            messageDiv.className = 'message success';
                            messageDiv.innerHTML = '<strong>Success:</strong> ' + result.message + ' Check the email preview below for testing.';
                            
                            // Remove any existing messages
                            const existingMessages = document.querySelectorAll('.message');
                            existingMessages.forEach(msg => msg.remove());
                            
                            // Insert message after header
                            const header = document.querySelector('.header');
                            header.insertAdjacentElement('afterend', messageDiv);
                        } else {
                            // Show message without redirecting
                            const messageDiv = document.createElement('div');
                            messageDiv.className = 'message success';
                            messageDiv.innerHTML = '<strong>Success:</strong> ' + result.message;
                            
                            const existingMessages = document.querySelectorAll('.message');
                            existingMessages.forEach(msg => msg.remove());
                            
                            const header = document.querySelector('.header');
                            header.insertAdjacentElement('afterend', messageDiv);
                        }
                    } else {
                        // Show error message without redirecting
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message error';
                        messageDiv.innerHTML = '<strong>Error:</strong> ' + result.error;
                        
                        const existingMessages = document.querySelectorAll('.message');
                        existingMessages.forEach(msg => msg.remove());
                        
                        const header = document.querySelector('.header');
                        header.insertAdjacentElement('afterend', messageDiv);
                    }
                } catch (error) {
                    alert('An error occurred. Please try again.');
                }
            }
        </script>
    </body>
    </html>
    `;
    
    res.send(htmlResponse);
});