import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import ProtectedRoute from "./components/ProtectedRoute";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          {/* Clerk manages its own sub-routes (verification, SSO callback, etc.)
              under these paths, so both need a /* wildcard match. */}
          <Route path="/login/*" element={<Login />} />
          <Route path="/sign-up/*" element={<SignUp />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/create"
            element={
              <ProtectedRoute>
                <CreateGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/join"
            element={
              <ProtectedRoute>
                <JoinGame />
              </ProtectedRoute>
            }
          />

          <Route path="/game/lobby/:roomCode" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
