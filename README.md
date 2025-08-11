# Marketing Campaign Performance Tracker - Frontend

A React-based frontend application for tracking and visualizing marketing campaign performance metrics in real-time.

## Features

- **User Authentication**: Login and signup functionality with JWT tokens
- **Campaign Metrics Management**: 
  - View all campaign metrics in a table format
  - Add new campaign metrics
  - Edit existing metrics
  - Delete metrics
  - Filter metrics by campaign name
- **Real-time Data**: Automatic calculation of CTR and conversion rates
- **Responsive Design**: Works on desktop and mobile devices
- **Protected Routes**: Only authenticated users can access metrics

## Tech Stack

- **React 19** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **Vite** for build tooling
- **Context API** for state management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## API Integration

The frontend connects to the backend API at `http://localhost:5000` and includes:

- **Authentication endpoints**: `/auth/login`, `/auth/signup`
- **Metrics endpoints**: `/metrics` (GET, POST, PUT, DELETE)

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Authentication component
│   ├── Metrics.tsx     # Main metrics management component
│   └── ProtectedRoute.tsx # Route protection component
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── services/           # API services
│   └── api.ts         # API communication layer
├── types.ts           # TypeScript type definitions
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## Usage

1. **Login/Signup**: Use the authentication form to create an account or log in
2. **View Metrics**: After authentication, you'll see all your campaign metrics
3. **Add Metrics**: Click "Add Metric" to create new campaign entries
4. **Filter**: Use the search box to filter metrics by campaign name
5. **Edit/Delete**: Use the action buttons in each row to modify or remove metrics

## Development

The application uses TypeScript for type safety and includes:

- ESLint for code linting
- Vite for fast development and building
- Hot module replacement for development
