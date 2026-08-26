import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/register';
import Login from './pages/login';
import Layout from './components/Layout';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';
import Search from './pages/Search';
import NoteView from './pages/NoteView';
import Chat from './pages/Chat';
import About from './pages/About';
import Topics from './pages/Topics';
import DailyReview from './pages/DailyReview';
import NotFound from './pages/NotFound';

import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                {/* Public Routes (Bina Layout ke) */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes (Layout ke andar) */}
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/vault" element={<Vault />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notes/:id" element={<NoteView />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/topics" element={<Topics />} />
                    <Route path="/review" element={<DailyReview />} />
                    <Route path="/about" element={<About />} />
                    
                    {/* Catch-all 404 Route */}
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;