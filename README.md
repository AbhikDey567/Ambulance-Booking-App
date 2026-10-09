# 🚑 Ambulance Booking System

A full-stack web application designed to simplify ambulance booking, improve emergency response coordination, and connect patients with ambulance drivers and nearby hospitals through an interactive map-based interface.

Built using the **MERN stack**, Leaflet.js, and OpenStreetMap, the system provides dedicated dashboards for patients and drivers, location-based services, and secure role-based access.

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [How It Works](#-how-it-works)
- [Installation and Setup](#-installation-and-setup)
- [Environment Variables](#-environment-variables)
- [Security](#-security)
- [Future Enhancements](#-future-enhancements)
- [Project Objectives](#-project-objectives)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

During medical emergencies, delays in ambulance booking and communication can have serious consequences. Traditional booking methods often rely on phone calls and manual coordination, making it difficult to identify nearby resources and manage requests efficiently.

The **Ambulance Booking System** addresses these challenges through a centralized web platform where patients can submit ambulance requests, view nearby resources on an interactive map, and manage their bookings. Ambulance drivers can access requests through a dedicated dashboard, manage booking statuses, and view patient locations and hospital destinations.

The project aims to provide a more accessible, organized, and extensible approach to emergency transportation management.

## ✨ Key Features

### 👤 Patient Dashboard
- User registration and authentication.
- Book an ambulance through a user-friendly interface.
- Enter patient details and medical condition.
- Select the required ambulance category.
- Use geolocation to identify the patient's location.
- View nearby ambulance drivers and hospitals on an interactive map.
- Track booking status and review booking history.
- Manage or cancel bookings where supported.

### 🚑 Driver Dashboard
- Dedicated dashboard for ambulance drivers.
- View incoming ambulance booking requests.
- Accept or reject requests.
- View patient pickup locations and hospital destinations.
- Calculate distances between relevant locations.
- Update booking status and estimated arrival information.
- Manage assigned requests through a centralized interface.

### 🗺️ Map and Location Services
- Interactive maps powered by Leaflet.js.
- OpenStreetMap integration for map visualization.
- Browser-based geolocation support.
- Location markers for patients, drivers, and hospitals.
- Distance calculations to assist with ambulance coordination.
- Hospital discovery through OpenStreetMap data services.

### 🔐 Authentication and Data Protection
- JWT-based authentication.
- Role-based access for patients and drivers.
- Password hashing with bcrypt.js.
- Protected API endpoints.
- Separation of user and driver operations.

### ⚙️ Full-Stack Architecture
- React-based frontend.
- Node.js and Express.js backend.
- MongoDB database.
- REST API communication.
- Modular design intended to support future enhancements.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcrypt.js |
| Maps | Leaflet.js, OpenStreetMap |
| Location Services | Browser Geolocation API |
| Hospital Discovery | OpenStreetMap / Overpass API |
| Development Tools | Visual Studio Code, Git, GitHub |
| API Testing | Postman or Thunder Client |

## 🏗️ System Architecture

The application follows a client-server architecture.

```text
                 ┌──────────────────────┐
                 │       Patients       │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │   React Frontend     │
                 │ Patient / Driver UI  │
                 │   Leaflet Maps       │
                 └──────────┬───────────┘
                            │
                       REST API
                            │
                 ┌──────────▼───────────┐
                 │   Express.js API     │
                 │ Authentication       │
                 │ Booking Management   │
                 │ Access Control       │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │      MongoDB         │
                 │ Users and Bookings   │
                 └──────────────────────┘

          External Services:
          ├── OpenStreetMap
          ├── Leaflet.js
          └── Overpass API
```

## 🔄 How It Works

1. **User authentication:** Patients and drivers sign in to access their respective dashboards.
2. **Ambulance booking:** The patient provides the required information, medical condition, location, and ambulance category.
3. **Location visualization:** The system uses geolocation and mapping services to display relevant locations.
4. **Request management:** Available driver functionality allows incoming requests to be reviewed and accepted or rejected.
5. **Booking updates:** The driver can update the request status and estimated arrival information.
6. **Hospital discovery:** Nearby hospitals can be displayed using OpenStreetMap data services.
7. **Booking history:** Patients can review their requests and manage bookings through their dashboard.

*The exact availability of each step depends on the application's implemented modules and configuration.*

## 💻 Installation and Setup

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) — preferably an LTS release compatible with the project.
- [MongoDB](https://www.mongodb.com/) — local installation or MongoDB Atlas.
- [Git](https://git-scm.com/).
- [Visual Studio Code](https://code.visualstudio.com/) or another code editor.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ambulance-booking-system.git
cd ambulance-booking-system
```

Replace `YOUR_USERNAME` and the repository name with your actual GitHub details.

### 2. Install Dependencies

Install dependencies in the backend and frontend directories.

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

If your repository uses different directory names, such as `backend` and `frontend`, adjust these commands accordingly.

### 3. Configure Environment Variables

Create a `.env` file in the backend directory and configure the required variables.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

Use the actual variable names expected by your source code. Configure any additional environment variables required by your frontend or deployment platform.

### 4. Start the Backend

From the backend directory:

```bash
npm run dev
```

If your project does not define a `dev` script, use the start command specified in its `package.json`.

### 5. Start the Frontend

Open a separate terminal:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite in your terminal, commonly `http://localhost:5173`.

**Note:** These commands assume a frontend/backend directory structure and scripts that may need to be adapted to your repository.

## 🔐 Security

The system incorporates security mechanisms intended to protect user accounts and booking information:

- JWT-based authentication for protected operations.
- Password hashing using bcrypt.js.
- Role-based authorization for patient and driver functionality.
- Environment variables for sensitive configuration.
- Server-side validation of incoming requests.
- Restricted access to protected resources.

For production deployment, additional measures should include HTTPS, rate limiting, secure token handling, input validation, database access controls, and appropriate protection of sensitive medical information.

## 🚀 Future Enhancements

The platform can be extended with the following capabilities:

- **Live ambulance tracking:** Display continuously updated driver locations on the map.
- **Automated dispatch:** Match requests with available ambulances based on distance, availability, and ambulance category.
- **Hospital integration:** Connect with hospital systems to access verified contact information and relevant availability data.
- **Emergency helpline integration:** Integrate with appropriate government emergency services where authorized.
- **Online payments:** Add secure payment processing for supported ambulance services.
- **Notifications:** Send booking confirmations and status updates through SMS, email, or push notifications.
- **Route optimization:** Integrate routing services to estimate travel time and recommend suitable routes.
- **Analytics dashboard:** Analyze booking volumes, response times, and service utilization.
- **Scalable deployment:** Introduce cloud hosting, monitoring, automated testing, and deployment pipelines.

These enhancements are proposed extensions and should not be interpreted as currently implemented functionality.

## 🎓 Project Objectives

The primary objectives of the project are to:

1. Simplify ambulance booking through a digital interface.
2. Improve coordination between patients and ambulance drivers.
3. Use geolocation and interactive maps to visualize relevant locations.
4. Provide dedicated dashboards for booking management.
5. Protect account information through authentication and authorization.
6. Establish a modular foundation for future emergency healthcare integrations.

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch to your fork.
5. Open a pull request describing your changes.

Please test your changes before submitting a pull request.

## 📄 License

This project is intended for educational and development purposes. Add an appropriate open-source license, such as the MIT License, if you wish to permit reuse and redistribution.

---

**Developed as a full-stack web development project using the MERN stack.**

*Disclaimer: This project is not a substitute for official emergency dispatch services. In a medical emergency, contact the appropriate local emergency number.*
