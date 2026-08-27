# ApnaaZoom — Real-Time Video Conferencing Platform

A full-stack real-time video conferencing web application that enables users to create and join meetings and communicate through audio, video, chat, and screen sharing.

Built to explore real-time application development across the frontend, backend, database, authentication, signaling, media communication, and deployment layers.

## 🚀 Live Demo

**Frontend:**
https://apnaazoom-frontend.onrender.com

**Backend:**
https://apnaazoom-backend.onrender.com

**Backend Health Check:**
https://apnaazoom-backend.onrender.com/api/health

## ✨ Features

### Meeting Management

* Create a meeting
* Join meetings using a meeting code/link
* Validate meeting access
* Shareable meeting links
* Meeting status handling
* Meeting history

### Audio & Video

* Real-time audio communication
* Real-time video communication
* Camera on/off controls
* Microphone on/off controls
* Pre-join camera and microphone preview

### Real-Time Communication

* WebRTC peer-to-peer media communication
* Socket.IO signaling and real-time events
* Participant join/leave events
* Real-time chat

### Screen Sharing

* Browser-based screen sharing using WebRTC/browser media APIs

### Authentication

* Google OAuth sign-in
* Application session-based authentication
* Session validation
* Logout

### Data Persistence

* MongoDB database
* Mongoose ODM
* User data persistence
* Meeting data persistence
* Meeting history persistence

### User Interface

* Pre-join lobby
* Participant panel
* Chat panel
* Responsive interface for different screen sizes

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* JSX
* React Router
* Axios
* Material UI
* Socket.IO Client
* WebRTC browser APIs
* CSS / CSS Modules

### Backend

* Node.js
* Express.js
* Socket.IO
* Mongoose
* MongoDB
* Google Auth Library
* bcrypt
* dotenv
* CORS

### Deployment

* Render

## 🏗️ Architecture

ApnaaZoom is organized into separate frontend and backend applications.

```text
                ┌──────────────────────┐
                │      React.js        │
                │      Frontend        │
                └──────────┬───────────┘
                           │
                     REST API / Axios
                           │
                ┌──────────▼───────────┐
                │   Node.js + Express  │
                │       Backend        │
                └──────┬────────┬──────┘
                       │        │
                 MongoDB       Socket.IO
                       │        │
                ┌──────▼───┐    │
                │ Mongoose │    │ Signaling
                │ Database │    │
                └──────────┘    │
                                ▼
                         ┌─────────────┐
                         │   WebRTC    │
                         │ Audio/Video │
                         │   Sharing   │
                         └─────────────┘
```

## 🔄 Real-Time Communication Flow

ApnaaZoom uses **Socket.IO for signaling and real-time events**, while **WebRTC handles peer-to-peer audio/video media communication**.

A simplified flow is:

```text
User A
  │
  │ Create / Join Meeting
  ▼
Backend + Meeting Validation
  │
  ▼
Socket.IO Signaling
  │
  ├── SDP Offer
  ├── SDP Answer
  └── ICE Candidates
  │
  ▼
WebRTC Peer Connection
  │
  ▼
Real-Time Audio / Video
```

## 🗄️ Data Models

The application uses MongoDB with Mongoose.

Primary data models include:

* **User** — user identity and session-related information
* **Meeting** — meeting metadata and status
* **MeetingHistory** — user meeting activity/history

## 🔐 Authentication

The application uses **Google OAuth** for sign-in and an application-level session/token mechanism for authenticated access.

> JWT authentication is not used in the current implementation.

## 📂 Project Structure

```text
Apnaa-Zoom/
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/homika482005/Apnaa-Zoom.git
cd Apnaa-Zoom
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Start the frontend

```bash
npm start
```

### 4. Install backend dependencies

Open another terminal:

```bash
cd backend
npm install
```

### 5. Start the backend

```bash
npm run dev
```

For production-style startup:

```bash
npm start
```

## 🔑 Environment Variables

Create the required environment configuration for the frontend and backend based on the values expected by the application.

Typical configuration includes:

### Backend

```env
PORT=
MONGODB_URI=
GOOGLE_CLIENT_ID=
```

### Frontend

```env
REACT_APP_GOOGLE_CLIENT_ID=
```

Use your own credentials and never commit secrets to GitHub.

## 🧩 Key Engineering Challenges

### WebRTC Signaling

Coordinating SDP offers/answers and ICE candidates between peers through Socket.IO.

### ICE Candidate Timing

Handling candidates that can arrive before the remote session description is ready.

### Media Stream Lifecycle

Managing local and remote media streams and correctly attaching them to React video elements.

### Peer Connection Lifecycle

Handling connection setup, participant changes, tracks, and cleanup during meeting sessions.

### Deployment Debugging

Debugging frontend build/deployment issues and maintaining communication between the deployed frontend and backend.

## 📌 What I Learned

Building ApnaaZoom provided hands-on experience with:

* Full-stack application architecture
* React frontend development
* Node.js and Express backend development
* REST API integration
* MongoDB data persistence
* Authentication
* Socket.IO signaling
* WebRTC peer-to-peer communication
* Real-time application design
* Deployment and debugging

## 🔗 Links

**Live Application:**
https://apnaazoom-frontend.onrender.com

**GitHub Repository:**
https://github.com/homika482005/Apnaa-Zoom

**LinkedIn:**
https://www.linkedin.com/in/homikasirsate
