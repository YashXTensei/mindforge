import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Layout from './components/Layout';
import Notes from './pages/notes';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes (Bina Layout ke) */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes (Layout ke andar) */}
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/vault" element={<Vault />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;