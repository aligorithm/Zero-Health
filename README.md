# Zero Health - Deliberately Vulnerable Healthcare Portal with AI Assistant

⚠️ **WARNING: This is a deliberately vulnerable application for educational purposes only. Do not use in production or with real data.**

![image](https://github.com/user-attachments/assets/36873934-d7d5-49b5-b730-d6e71b8c8325)

## About

Zero Health is a deliberately vulnerable healthcare portal designed to demonstrate critical security vulnerabilities in medical technology. Healthcare systems are prime targets for cyberattacks due to their valuable personal health information (PHI), financial data, and critical infrastructure. A single breach can compromise patient privacy, disrupt life-saving treatments, and violate regulations like HIPAA.

This educational platform demonstrates:
- Common web security vulnerabilities in healthcare applications
- AI/LLM integration security risks and prompt injection vulnerabilities  
- The devastating impact of poor security practices in medical environments
- Why robust security is essential for protecting patient data and maintaining trust

For full list of challenges: (https://github.com/aligorithm/Zero-Health/blob/main/challenges.md)

**Why Healthcare Security Matters**: Medical devices, patient portals, and health records systems require the highest security standards. Vulnerabilities can lead to ransomware attacks shutting down hospitals, identity theft from exposed patient data, or even manipulation of medical devices. This application helps developers understand these risks before building real healthcare systems.

## Prerequisites

- **Docker and Docker Compose** (recommended setup)
- **OpenAI-compatible API key** for chatbot functionality (OpenAI, Groq, LM Studio, Ollama, etc.)
- OR Node.js (v16+) and PostgreSQL for manual setup

## Quick Setup

I made a [Demo Video](https://youtu.be/h3jm83jw33Q) explaining everything.

### 1. Clone Repository
```bash
git clone https://github.com/aligorithm/zero-health.git
cd zero-health
```

### 2. AI Provider Configuration

Zero Health now supports **multiple LLM providers** with simplified configuration using environment files.

#### Quick Start (Recommended)
```bash
# 1. Copy the example environment file
cp .env.example .env

# 2. Edit .env with your preferred provider
# 3. Start the application
docker-compose up --build
```

#### Provider Options

**Option A: OpenAI (Default)**
```bash
# Edit .env file:
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4o-mini

# Then run:
docker compose up -d
```

**Option B: Groq**
```bash
# Edit .env file:
LLM_PROVIDER=groq
LLM_API_KEY=gsk_your-key-here
LLM_MODEL=llama3-8b-8192

# Then run:
docker compose up -d
```

**Option C: Z.AI**
```bash
# Edit .env file:
LLM_PROVIDER=z_ai
LLM_API_KEY=your-zai-key-here
LLM_MODEL=zai-medical-7b

# Then run:
docker compose up -d
```

**Option D: DeepSeek**
```bash
# Edit .env file:
LLM_PROVIDER=deepseek
LLM_API_KEY=sk-your-deepseek-key-here
LLM_MODEL=deepseek-coder

# Then run:
docker compose up -d
```

**Option E: Local Ollama**
```bash
# Edit .env file:
LLM_PROVIDER=ollama
LLM_API_KEY=your-api-key-here
LLM_MODEL=llama3.2:3b
OLLAMA_PORT=11435

# Then run:
docker compose --profile ollama up -d
```

**Option F: Custom OpenAI-Compatible API**
```bash
# Edit .env file:
LLM_PROVIDER=custom
LLM_API_KEY=your-custom-key
LLM_MODEL=your-model
LLM_BASE_URL=http://localhost:1234/v1

# Then run:
docker compose up -d
```


#### Disable Local AI

To disable Ollama service completely (if you only want to use cloud AI):

**Option 1: Use Docker Profiles (Recommended)**
```bash
# This automatically skips ollama service
docker compose up -d

# Only include ollama when explicitly needed
docker compose --profile ollama up -d
```

**Option 2: Manual Disable**
1. Edit `docker-compose.yml`
2. Comment out the entire `ollama:` service block (lines with `profiles: - ollama`)
3. Comment out the `ollama:` dependency in the `server:` section

**Option 3: Use Cloud Provider**
```bash
# Set a cloud provider in .env and ollama won't start
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4o-mini

# Then run (no ollama will start)
docker compose up -d
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs

## Test Accounts

All passwords: `password123`

**Staff Accounts:**
- **Admin**: `admin@zerohealth.com` - Full system access
- **Doctor**: `doctor@test.com` - Patient management
- **Pharmacist**: `pharmacist@zerohealth.com` - Prescription management

**Patient Accounts:**
- **Patient**: `patient@test.com` - Personal health portal
- **Patient 2**: `patient2@test.com` - Additional test data

## Key Features

### 🤖 **AI-Powered Role-Based Chatbot**
- Different capabilities for patients, doctors, pharmacists, and admins
- Real-time SQL query generation and execution
- Conversation memory and knowledge base
- **Deliberate AI vulnerabilities**: Prompt injection, SQL injection via LLM

### 👥 **Role-Based Access Control**
- **Patients**: Book appointments, view lab results, manage prescriptions
- **Doctors**: Patient management, create lab results, write prescriptions  
- **Pharmacists**: Prescription management, mark as collected
- **Admins**: User management, system statistics

### 🏥 **Healthcare Portal Features**
- Appointment booking and management
- Lab results with medical imagery (SVG)
- Prescription management system
- Secure messaging between patients and providers
- PDF medical report generation

## Major Vulnerabilities (Educational)

### **Web Security Issues**
- **SQL Injection**: Login, search, AI chatbot queries
- **Cross-Site Scripting (XSS)**: Stored in messages, reflected in search
- **Command Injection**: PDF report generation
- **Insecure Direct Object References**: Direct access to records by ID
- **File Upload Vulnerabilities**: Unrestricted file types
- **Mass Assignment**: Profile updates can modify any field including roles
- **Information Disclosure**: JWT secrets and system info exposed

### **AI-Specific Vulnerabilities**
- **Prompt Injection**: Manipulate AI behavior through crafted messages
- **SQL Injection via LLM**: AI generates malicious database queries
- **Schema Disclosure**: Complete database structure exposed through AI
- **Role-Based Access Bypass**: Weak AI query restrictions
- **Context Manipulation**: Exploit conversation history

### **Healthcare-Specific Risks**
- **Patient Data Exposure**: PHI accessible without proper authorization
- **Medical Record Tampering**: Ability to modify critical health information
- **Prescription Fraud**: Unauthorized prescription creation and modification
- **Audit Trail Bypass**: Actions not properly logged for compliance

## Database Reset

To reset the entire database and get fresh sample data:
```bash
docker-compose down -v
docker-compose up --build
```

Sample data is automatically created on first run, including realistic medical records, prescriptions, lab results, and user accounts.

## API Provider Support

Works with any OpenAI-compatible API:

```bash
# OpenAI (default)
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"

# Groq (fast inference)  
export OPENAI_BASE_URL="https://api.groq.com/openai/v1"
export OPENAI_MODEL="llama3-8b-8192"

# Local LM Studio
export OPENAI_BASE_URL="http://localhost:1234/v1"
export OPENAI_MODEL="your-local-model"

# Local Ollama
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_MODEL="llama3"
```

## Learning Objectives

By studying this application, learn:

1. **Healthcare Security Fundamentals** - HIPAA compliance, PHI protection
2. **Web Application Security** - OWASP Top 10 vulnerabilities in medical context
3. **AI Security** - Prompt injection, LLM security, AI-generated code risks
4. **Database Security** - SQL injection, access controls, audit logging
5. **API Security** - Authentication bypass, IDOR, mass assignment
6. **File Security** - Upload validation, path traversal, malware risks
7. **Incident Response** - Identifying and containing healthcare breaches

## Coming Soon

### 📱 **Mobile App**
React Native application with mobile-specific vulnerabilities (insecure storage, certificate pinning bypass)

### 🔥 **HARD MODE**
Advanced multi-step attack chains and modern vulnerability scenarios

### 🧪 **Advanced AI Vulnerabilities**
- Model extraction attacks
- Adversarial prompt techniques  
- LLM jailbreak scenarios
- AI-powered automated exploitation

## Contributing

Contributions welcome! Please maintain educational vulnerability aspects and document new security issues.

## Community & Support

### 💬 **GitHub Discussions**
Join our community to share your learnings, discuss exploits, and get help:
- **[🎯 Share Your Exploits](https://github.com/aligorithm/zero-health/discussions)** - Post successful attack chains and creative exploitation techniques
- **[❓ Get Help](https://github.com/aligorithm/zero-health/discussions)** - Ask questions if you're stuck on challenges
- **[💡 Learning Insights](https://github.com/aligorithm/zero-health/discussions)** - Share what you learned and help others
- **[🔧 Technical Issues](https://github.com/aligorithm/zero-health/discussions)** - Report setup problems or bugs
- **[🚀 Feature Requests](https://github.com/aligorithm/zero-health/discussions)** - Suggest new vulnerabilities or improvements

### 📚 **Learning Resources**
- Check out the [Security Challenges Guide](challenges.md) for hands-on exercises
- Browse [GitHub Discussions](https://github.com/aligorithm/zero-health/discussions) for community solutions and tips
- Watch the [Demo Video](https://youtu.be/h3jm83jw33Q) for setup and overview

## Environment Variables

### AI Provider Configuration (Simplified)
```bash
# Core provider selection (default: ollama for offline usage)
LLM_PROVIDER=ollama                         # Options: 'openai', 'groq', 'ollama', 'z_ai', 'deepseek', 'custom'

# Uniform LLM Configuration (works for all providers)
LLM_API_KEY=your-api-key-here              # Required for cloud providers
LLM_MODEL=your-model-name                   # Optional: model to use
LLM_BASE_URL=your-custom-url                # Only needed for custom provider

# Provider-specific (when needed)
OLLAMA_PORT=11435                           # Optional: external port (default: 11435)

# Base URLs are automatically configured based on LLM_PROVIDER:
# - openai: https://api.openai.com/v1
# - groq: https://api.groq.com/openai/v1  
# - z_ai: https://api.z.ai/v1
# - deepseek: https://api.deepseek.com/v1
# - custom: must set LLM_BASE_URL manually
# - ollama: http://ollama:11434 (internal)
```

### Database (Auto-configured in Docker)
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres  
POSTGRES_DB=zero_health
```

### Full Example Configurations

#### Cloud AI (OpenAI) - Default
```bash
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-your-key-here
export LLM_MODEL=gpt-4o-mini
docker compose up -d
```

#### Cloud AI (Groq)
```bash
export LLM_PROVIDER=groq
export LLM_API_KEY=gsk_your-key-here
export LLM_MODEL=llama3-8b-8192
docker compose up -d
```

#### Custom Ollama Port
```bash
export OLLAMA_PORT=11436
docker-compose up --build
```

## License

MIT License

## Disclaimer

⚠️ **Intentionally vulnerable application for educational purposes only. Contains deliberate security flaws including AI vulnerabilities. Do not use in production or with real data. Authors not responsible for misuse.**
