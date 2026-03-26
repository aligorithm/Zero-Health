const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zero Health API',
      version: '1.0.0',
      description: 'A comprehensive healthcare portal API with AI assistant for managing patient records, appointments, and medical data',
      contact: {
        name: 'Zero Health Development Team',
        email: 'dev@zerohealth.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            role: { type: 'string', enum: ['patient', 'doctor', 'pharmacist', 'admin'], example: 'patient' },
            phone: { type: 'string', example: '+1-555-0123' },
            date_of_birth: { type: 'string', format: 'date', example: '1990-01-01' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            patient_id: { type: 'integer', example: 1 },
            doctor_id: { type: 'integer', example: 2 },
            appointment_date: { type: 'string', format: 'date-time', example: '2024-12-15T10:00:00Z' },
            status: { type: 'string', enum: ['scheduled', 'completed', 'cancelled'], example: 'scheduled' },
            notes: { type: 'string', example: 'Regular checkup' }
          }
        },
        Prescription: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            patient_id: { type: 'integer', example: 1 },
            doctor_id: { type: 'integer', example: 2 },
            medication_name: { type: 'string', example: 'Lisinopril' },
            dosage: { type: 'string', example: '10mg' },
            frequency: { type: 'string', example: 'Once daily' },
            start_date: { type: 'string', format: 'date', example: '2024-01-01' },
            end_date: { type: 'string', format: 'date', example: '2024-07-01' },
            status: { type: 'string', enum: ['active', 'completed', 'cancelled'], example: 'active' },
            collected: { type: 'boolean', example: false }
          }
        },
        LabResult: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            patient_id: { type: 'integer', example: 1 },
            doctor_id: { type: 'integer', example: 2 },
            test_name: { type: 'string', example: 'Complete Blood Count (CBC)' },
            result: { type: 'string', example: 'WBC: 7.2, RBC: 4.5, Hemoglobin: 14.2' },
            test_date: { type: 'string', format: 'date', example: '2024-01-15' },
            file_path: { type: 'string', example: 'sample-blood-1.svg' }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'What are my recent lab results?' },
            response: { type: 'string', example: 'Here are your recent lab results...' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid credentials' },
            message: { type: 'string', example: 'Authentication failed' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization endpoints' },
      { name: 'AI Chatbot', description: 'AI-powered medical assistant with role-based capabilities' },
      { name: 'Patient Portal', description: 'Patient-specific medical data endpoints' },
      { name: 'Staff Dashboard', description: 'Healthcare staff endpoints for doctors, pharmacists, and admins' },
      { name: 'Admin', description: 'Administrative endpoints for system management' },
      { name: 'Debug', description: 'System diagnostic and monitoring endpoints' }
    ]
  },
  apis: [
    './routes/*.js', // Path to the API routes
    './server.js'    // Include main server file where routes are defined
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
}; 