# Dabro App

This is a React-based web application for Pesantren Darul Abror.

## Key Features & Benefits

*   **User Interface:** Provides a user-friendly interface built with React and Bootstrap.
*   **React Components:** Uses reusable React components for enhanced maintainability and scalability.
*   **Data Handling:** Implements Axios for efficient data fetching and API interactions.
*   **Real-time Communication:** Integrates Socket.io for real-time chat functionality.
*   **Authentication:** Uses AuthContext to manage user authentication.
*   **Routing:** Uses React Router for navigation between pages.
*   **Supabase Integration:** Utilizes Supabase for database management and authentication.

## Prerequisites & Dependencies

Before you begin, ensure you have the following installed:

*   **Node.js:**  (v16 or higher) - [https://nodejs.org/](https://nodejs.org/)
*   **npm** (Node Package Manager) or **yarn:** (Recommended) - Included with Node.js installation.
*   **Git:** For version control - [https://git-scm.com/](https://git-scm.com/)

The project relies on the following dependencies:

*   **React:**  A JavaScript library for building user interfaces.
*   **React DOM:**  Provides DOM-specific methods for React.
*   **React Router DOM:** For routing and navigation in React applications.
*   **Axios:** Promise-based HTTP client for making API requests.
*   **Bootstrap:** CSS framework for responsive design.
*   **Bootstrap Icons:** Icon library for Bootstrap.
*   **Socket.io-client:** For client-side real-time communication.
*   **Supabase:** Backend-as-a-Service platform.

## Installation & Setup Instructions

Follow these steps to set up the project locally:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Yoochan45/dabro-app.git
    cd dabro-app
    ```

2.  **Install Dependencies:**

    Using npm:

    ```bash
    npm install
    ```

    or using yarn:

    ```bash
    yarn install
    ```

3.  **Configuration:**

    *   Create a `.env` file in the root directory.
    *   Add the following environment variables (replace with your actual values):

        ```
        REACT_APP_API_URL=http://localhost:3002/api
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```

        You will need to set up a Supabase project and obtain these keys.

4.  **Start the Development Server:**

    Using npm:

    ```bash
    npm start
    ```

    or using yarn:

    ```bash
    yarn start
    ```

    This will start the development server, and the application should be accessible at `http://localhost:3000` (or another port if 3000 is already in use).

## Usage Examples & API Documentation

### API Base URL

The API base URL is defined in `src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
```

### Axios Instance

An Axios instance is created with the base URL and default headers:

```javascript
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Authentication

The application uses a token-based authentication system. The token is stored in `localStorage`.

### Example API Request

```javascript
import api from './services/api';

const fetchData = async () => {
  try {
    const response = await api.get('/data');
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};
```

## Configuration Options

*   **`REACT_APP_API_URL`:** Specifies the base URL for the backend API.
*   **`VITE_SUPABASE_URL`:** The URL of your Supabase project.
*   **`VITE_SUPABASE_ANON_KEY`:** The anonymous key for your Supabase project.

These variables should be set in the `.env` file.

## Project Structure

```
├── .gitignore             // Specifies intentionally untracked files that Git should ignore
├── package-lock.json      // Records the exact versions of dependencies
├── package.json           // Contains project metadata and dependencies
└── public/                // Contains static assets
    ├── index.html         // The main HTML file
└── src/                   // Contains the application's source code
    ├── App.jsx            // The main application component
    └── components/        // Reusable React components
        ├── BottomNavbar.jsx  // Bottom navigation bar component
        ├── Footer.jsx         // Footer component
        ├── Navbar.jsx         // Navigation bar component
    └── context/           // React context providers
        ├── AuthContext.jsx  // Authentication context
        ├── index.js         // Exports context providers
    └── pages/             // Application pages
        ├── AdminChat.jsx    // Admin chat page
        ├── Berita.jsx       // News page
        ├── BeritaDetail.jsx // News detail page
        ├── Chat.jsx         // Chat page
        ├── Home.jsx         // Home page
```

## Contributing Guidelines

Contributions are welcome! Here's how you can contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes.
4.  Commit your changes with descriptive commit messages.
5.  Push your branch to your forked repository.
6.  Submit a pull request.

## License Information

This project does not currently have a specified license. All rights are reserved.

## Acknowledgments

*   [Bootstrap](https://getbootstrap.com/)
*   [React](https://reactjs.org/)
*   [Axios](https://axios-http.com/)
*   [Socket.IO](https://socket.io/)
*   [Supabase](https://supabase.com/)
