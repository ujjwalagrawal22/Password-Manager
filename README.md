# 🔐 Secure Password Manager

A full-stack password manager with end-to-end encryption, featuring a Chrome extension for auto-capture and autofill capabilities. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Security Model](#-security-model)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Chrome Extension Usage](#-chrome-extension-usage)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Security Considerations](#-security-considerations)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Features

### Core Security
- **Zero-Knowledge Architecture**: Master password never leaves your device
- **End-to-End Encryption**: All passwords encrypted with AES-256-CBC
- **Secure Key Derivation**: Scrypt algorithm (cost: 2^15, blockSize: 8, parallelization: 1)
- **JWT Authentication**: Secure, stateless session management
- **Auth Tag Verification**: Zero-knowledge proof of password correctness

### Chrome Extension
- **Auto-Capture**: Automatically detects and prompts to save login credentials
- **One-Click Autofill**: Visual icon on login forms for instant credential insertion
- **Smart Matching**: Origin-based URL matching for security
- **In-Memory Storage**: Encryption keys stored only in memory (cleared on browser close)
- **System Notifications**: Confirmation when passwords are saved

### Backend API
- **RESTful Design**: Clean, intuitive API endpoints
- **MongoDB Integration**: Encrypted vault storage with timestamps
- **CORS Protection**: Configurable origin restrictions
- **Error Handling**: Comprehensive error responses
- **Production Ready**: PM2 process management support

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                              │
│  ┌──────────────────┐            ┌─────────────────┐           │
│  │ Chrome Extension │            │   Web Frontend  │           │
│  │                  │            │   (Optional)    │           │
│  │ • Capture Login  │            │                 │           │
│  │ • Encrypt Data   │            │                 │           │
│  │ • Autofill Forms │            │                 │           │
│  └────────┬─────────┘            └────────┬────────┘           │
│           │                               │                     │
│           │     Master Password           │                     │
│           │            ↓                  │                     │
│           │     ┌──────────────┐          │                     │
│           │     │ Scrypt KDF   │          │                     │
│           │     │ (Client-side)│          │                     │
│           │     └──────┬───────┘          │                     │
│           │            │                  │                     │
│           │     Encryption Key            │                     │
│           │     (Never sent to server)    │                     │
│           └────────────┼──────────────────┘                     │
│                        │                                         │
└────────────────────────┼─────────────────────────────────────────┘
                         │ Encrypted Data + IV
                         │ JWT Token
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Express.js API                        │  │
│  │                                                          │  │
│  │  • JWT Verification                                      │  │
│  │  • Auth Tag Validation (Zero-Knowledge Proof)            │  │
│  │  • CRUD Operations on Encrypted Vault                    │  │
│  │  • NO Access to Plaintext Passwords                      │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MongoDB Atlas                         │  │
│  │                                                          │  │
│  │  Users Collection:                                       │  │
│  │  • email                                                 │  │
│  │  • salt (for KDF)                                        │  │
│  │  • kdfParams                                             │  │
│  │  • authTagData (encrypted verification string)           │  │
│  │  • authTagIv                                             │  │
│  │  • vault[] (encrypted password entries)                  │  │
│  │    - data (encrypted)                                    │  │
│  │    - iv (initialization vector)                          │  │
│  │    - createdAt, updatedAt                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🛡️ Security Model

### 1. Registration Flow
```
User enters master password
         ↓
Generate random salt (16 bytes)
         ↓
Derive encryption key using Scrypt
         ↓
Encrypt verification string with key
         ↓
Store: email, salt, kdfParams, encrypted auth tag
         ↓
Encryption key DISCARDED (never stored)
```

### 2. Login Flow
```
User enters master password
         ↓
Fetch salt + kdfParams from server
         ↓
Derive encryption key client-side
         ↓
Try to decrypt auth tag
         ↓
If successful → Issue JWT token
If failed → Authentication failed
```

### 3. Password Storage Flow
```
User saves password on website
         ↓
Extension captures credentials
         ↓
Encrypt with derived key (AES-256-CBC)
         ↓
Send encrypted data + IV to server
         ↓
Server stores encrypted blob
         ↓
Plaintext never touches server
```

### Encryption Specifications
- **Algorithm**: AES-256-CBC
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes)
- **KDF**: Scrypt
  - Cost (N): 2^15 (32,768)
  - Block size (r): 8
  - Parallelization (p): 1
  - Memory: ~32 MB

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas**: Account and cluster set up
- **Chrome**: Version 88+ (for extension)

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/Password-Manager.git
cd Password-Manager

# Setup backend
cd server
npm install
cp .env.example .env  # Create and configure .env
npm start

# Setup extension (in new terminal)
cd ../chrome-extension
npm install
npm run build
```

## 📦 Installation

### Backend Installation

```bash
cd server
npm install
```

**Dependencies installed:**
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT generation/verification
- `cors`: Cross-origin resource sharing
- `crypto-js`: Cryptographic functions
- `dotenv`: Environment variable management

### Chrome Extension Installation

```bash
cd chrome-extension
npm install
npm run build
```

**Dependencies installed:**
- `scrypt-js`: Scrypt implementation for browser
- `vite`: Build tool
- `vite-plugin-web-extension`: Extension bundler

**Load Extension in Chrome:**
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `chrome-extension/dist` folder
5. Extension icon should appear in toolbar

## ⚙️ Configuration

### Backend Environment Variables

Create `server/.env`:

```env
# Server Configuration
PORT=3001

# JWT Configuration
JWT_SECRET=your-super-secret-and-long-jwt-secret-key-change-this-in-production
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
# For production: CORS_ORIGIN=https://yourdomain.com
```

### MongoDB Configuration

Edit `server/database/mongo.js`:

```javascript
mongoose.connect('mongodb+srv://username:password@cluster.mongodb.net/password-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch((err) => console.error('MongoDB connection error:', err));
```

**MongoDB Atlas Setup:**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster (free tier available)
3. Add database user with read/write permissions
4. Whitelist IP address (or use 0.0.0.0/0 for development)
5. Get connection string from "Connect" → "Connect your application"

### Extension Configuration

Edit `chrome-extension/background.js`:

```javascript
const BASE_API_URL = 'http://localhost:3001/api';
// For production: const BASE_API_URL = 'https://api.yourdomain.com/api';
```

## 📡 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Public Endpoints

#### 1. Register User
```http
POST /api/setup
Content-Type: application/json

{
  "email": "user@example.com",
  "masterPassword": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully."
}
```

**Errors:**
- `400`: Invalid input (missing fields, password < 8 chars)
- `409`: User already exists

---

#### 2. Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "masterPassword": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "salt": "a1b2c3d4e5f6...",
  "kdfParams": {
    "cost": 32768,
    "blockSize": 8,
    "parallelization": 1,
    "maxmem": 33554432
  }
}
```

**Errors:**
- `400`: Missing credentials
- `404`: User not found
- `401`: Invalid password

---

### Protected Endpoints

All protected endpoints require JWT token in header:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 3. Get All Passwords
```http
GET /api/passwords
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "data": "a1b2c3d4e5f6...",
    "iv": "1a2b3c4d5e6f...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

#### 4. Add Password
```http
POST /api/passwords
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "encryptedData": "a1b2c3d4e5f6...",
  "iv": "1a2b3c4d5e6f..."
}
```

**Response (201):**
```json
{
  "message": "Password entry added successfully.",
  "entry": {
    "_id": "507f1f77bcf86cd799439011",
    "data": "a1b2c3d4e5f6...",
    "iv": "1a2b3c4d5e6f...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 5. Update Password
```http
PUT /api/passwords/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "encryptedData": "new_encrypted_data...",
  "iv": "new_iv..."
}
```

**Response (200):**
```json
{
  "message": "Password entry updated successfully.",
  "entry": { ... }
}
```

---

#### 6. Delete Password
```http
DELETE /api/passwords/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "message": "Password entry deleted successfully.",
  "id": "507f1f77bcf86cd799439011"
}
```

---

#### 7. Test Protected Route
```http
GET /api/test-protected
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "message": "Success! You have accessed a protected route.",
  "user": {
    "sub": "user@example.com"
  }
}
```

## 🔌 Chrome Extension Usage

### First Time Setup

1. **Click extension icon** in Chrome toolbar
2. **Enter credentials**:
   - Email address
   - Master password
3. **Click "Login"**

### Auto-Capture Credentials

1. **Visit any login page** (e.g., github.com/login)
2. **Enter username and password**
3. **Submit the form**
4. **Extension prompts**: "Save to your Vault?"
5. **Click "Save"** → Credentials encrypted and stored
6. **System notification** confirms save

### Autofill Credentials

1. **Visit saved login page**
2. **Look for extension icon** next to username field
3. **Click the icon**
4. **Credentials auto-populated** in both username and password fields

### Logout

1. **Click extension icon**
2. **Click "Logout"**
3. **Encryption key cleared** from memory

## 🚢 Deployment

### GitHub Actions CI/CD

The project includes automated deployment to GCP via GitHub Actions.

**Setup:**

1. **Generate SSH key pair** on your local machine:
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions"
```

2. **Add public key to GCP VM**:
```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

3. **Add secrets to GitHub repository**:
   - Go to Settings → Secrets and variables → Actions
   - Add:
     - `GCP_SSH_HOST`: Your VM's IP address
     - `GCP_SSH_USER`: Your VM username
     - `GCP_SSH_PRIVATE_KEY`: Contents of private key file

4. **Push to main branch**:
```bash
git push origin main
```

**Deployment automatically:**
- Pulls latest code
- Installs backend dependencies
- Builds frontend/extension
- Restarts PM2 process

### Manual Deployment

#### On GCP VM (or any Linux server):

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/Password-Manager.git
cd Password-Manager/server

# Install dependencies
npm install --only=production

# Setup environment
nano .env  # Add your configuration

# Start with PM2
pm2 start server.js --name "password-manager-server"
pm2 save
pm2 startup
```

#### Nginx Configuration (Optional):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📁 Project Structure

```
Password-Manager/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD pipeline configuration
│
├── chrome-extension/
│   ├── images/
│   │   ├── icon16.png              # Extension icon (16x16)
│   │   └── icon48.png              # Extension icon (48x48)
│   │
│   ├── autofill.css                # Styles for autofill icon
│   ├── background.js               # Service worker (API calls, encryption)
│   ├── content.js                  # DOM manipulation, form detection
│   ├── crypto.js                   # Client-side crypto (Scrypt, AES)
│   ├── popup.html                  # Extension popup UI
│   ├── popup.js                    # Popup logic (login/logout)
│   ├── manifest.json               # Extension configuration
│   ├── vite.config.js              # Build configuration
│   ├── package.json                # Extension dependencies
│   └── .gitignore
│
├── server/
│   ├── database/
│   │   ├── mongo.js                # MongoDB connection
│   │   └── User.js                 # Mongoose user schema
│   │
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT verification middleware
│   │
│   ├── services/
│   │   └── cryptoService.js        # Server-side crypto utilities
│   │
│   ├── server.js                   # Express app + API routes
│   ├── package.json                # Server dependencies
│   ├── .env                        # Environment variables (gitignored)
│   └── .gitignore
│
├── .gitignore                      # Global gitignore
└── README.md                       # This file
```

## 🔒 Security Considerations

### What's Encrypted
✅ All password entries (AES-256-CBC)  
✅ Auth verification tag  
✅ Credentials never stored in plaintext  
✅ Encryption keys never leave client  

### What's NOT Encrypted
⚠️ Email addresses (used for login)  
⚠️ Salt values (required for KDF)  
⚠️ KDF parameters (algorithm configuration)  
⚠️ Timestamps (metadata)  

### Best Practices

1. **Master Password**:
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Never reuse from other services
   - Store in secure location (not digitally)

2. **Production Deployment**:
   - Use HTTPS only (Let's Encrypt free certificates)
   - Rotate JWT secret regularly
   - Implement rate limiting
   - Enable MongoDB encryption at rest
   - Use strong firewall rules
   - Regular security audits

3. **Extension Usage**:
   - Only use on trusted devices
   - Logout when done
   - Don't share extension ID
   - Review saved sites regularly

### Known Limitations

- **No password recovery**: Lost master password = lost access (by design)
- **Browser-dependent**: Extension only works in Chrome/Chromium
- **Single device**: No cross-device sync (add encryption sync if needed)
- **No 2FA**: Consider adding TOTP for additional security

## 🧪 Testing

### Test Protected Routes

```bash
# 1. Login and get token
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","masterPassword":"password123"}'

# 2. Use token to access protected route
curl http://localhost:3001/api/test-protected \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Extension Locally

1. Load unpacked extension
2. Open DevTools → Extensions tab
3. Check background service worker logs
4. Visit test login form
5. Monitor console for errors

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Steps to Contribute

1. **Fork the repository**
```bash
git clone https://github.com/yourusername/Password-Manager.git
cd Password-Manager
```

2. **Create feature branch**
```bash
git checkout -b feature/AmazingFeature
```

3. **Make changes and commit**
```bash
git add .
git commit -m 'Add: AmazingFeature description'
```

4. **Push to branch**
```bash
git push origin feature/AmazingFeature
```

5. **Open Pull Request** on GitHub

### Commit Message Convention
```
Type: Brief description

Types:
- Add: New feature
- Fix: Bug fix
- Update: Modify existing feature
- Remove: Delete code/feature
- Docs: Documentation changes
- Style: Formatting, no code change
- Refactor: Code restructuring
```

## 📄 License

This project is licensed under the **ISC License**.

```
Copyright (c) 2024 Ujjwal Agrawal

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## 🙏 Acknowledgments

- Scrypt algorithm by Colin Percival
- Chrome Extension API documentation
- MongoDB Atlas for database hosting
- Express.js community

---

## ⚠️ Important Disclaimer

**This is an educational project demonstrating password management concepts.**

For production use:
- Conduct professional security audit
- Implement rate limiting
- Add CAPTCHA on login
- Enable 2FA options
- Regular penetration testing
- Compliance with data protection laws (GDPR, CCPA)

**Use at your own risk. Not recommended for storing critical passwords without additional security measures.**


