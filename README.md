# Dabro App

[![Top Language](https://img.shields.io/github/languages/top/Yoochan45/dabro-app)](https://github.com/Yoochan45/dabro-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Package Manager](https://img.shields.io/badge/Package-npm-blue.svg)]()
[![Build Status](https://img.shields.io/badge/CI-not_configured-lightgrey)]()

Dabro App is a React-based web application for Pesantren Darul Abror. It provides real-time chat, news pages, and user authentication backed by Supabase and a REST API.

## Key Features
- User-friendly UI built with React and Bootstrap
- Reusable React components for maintainability
- Axios for API requests with a centralized instance
- Real-time communication via Socket.io
- Token-based authentication (AuthContext)
- Routing with React Router
- Supabase integration for database and auth

## Quick Start

Prerequisites:
- Node.js (v16+)
- npm or yarn
- Git

Clone and install:
```bash
git clone https://github.com/Yoochan45/dabro-app.git
cd dabro-app
npm install
# or
# yarn install
```

Create a `.env` file (see .env.example) and run:
```bash
npm start
# or
# yarn start
```
The app runs at http://localhost:3000 by default.

## Environment Variables
Create a `.env` file in the project root. Example (do not commit secrets):
```
REACT_APP_API_URL=http://localhost:3002/api
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```
Notes:
- Use REACT_APP_* prefix for Create React App. If you plan to migrate to Vite, rename to VITE_* and update scripts accordingly.
- Never commit real keys to the repository.

## API / Axios
The API base URL is read from REACT_APP_API_URL. A central axios instance is recommended:
- Add auth header injection via an interceptor (Authorization: Bearer <token>).
- Add a response interceptor to handle 401 and attempt token refresh if supported.

## Folder Structure
```
├── .gitignore
├── package.json
├── public/
│   └── index.html
└── src/
    ├── App.jsx
    ├── components/
    │   ├── BottomNavbar.jsx
    │   ├── Footer.jsx
    │   └── Navbar.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   └── index.js
    ├── pages/
    │   ├── AdminChat.jsx
    │   ├── Berita.jsx
    │   ├── BeritaDetail.jsx
    │   ├── Chat.jsx
    │   └── Home.jsx
    └── services/
        └── api.js
```

## Suggested Improvements / TODO
- Add LICENSE file (MIT) and set "license" in package.json.
- Add .env.example to repo.
- Resolve environment variable naming (REACT_APP_* vs VITE_*).
- Add axios interceptors (auth + error handling).
- Replace localStorage token storage with more secure method (HttpOnly cookies) if possible.
- Add CI (GitHub Actions) and display build/test badges.
- Add linting (ESLint) and formatting (Prettier) with corresponding npm scripts.
- Add repository, homepage, and author fields in package.json.
- Add CONTRIBUTING.md and CODE_OF_CONDUCT.md if accepting contributions.
- Add unit/integration tests (Jest/React Testing Library).

## Contributing
1. Fork the repo
2. Create a feature branch
3. Make changes and commit with clear messages
4. Open a pull request

## License
This repository currently has no license file. It is recommended to add a LICENSE (MIT) to clarify reuse rights.

## Acknowledgments
- React
- Bootstrap
- Axios
- Socket.IO
- Supabase

## Author
Aisiya Qutwatunnada
@yoockh
