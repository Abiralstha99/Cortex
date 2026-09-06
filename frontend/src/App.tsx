import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomeWorkspace from "./pages/HomeWorkspace";
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
          <Route path="/" element={<HomeWorkspace />} />
          {/* Clerk manages its own sub-routes (verification, SSO callback, etc.)
              under these paths, so both need a /* wildcard match. */}
          <Route path="/login/*" element={<Login />} />
          <Route path="/sign-up/*" element={<SignUp />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navigate to="/" replace />
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
