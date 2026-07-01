import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'

function Dashboard() {
    return (
        <div style={{ padding: '40px' }}>
            <h1>Welcome to MindForge Dashboard! 🎉</h1>
            <p>You are logged in.</p>
        </div>
    )
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<h1>MindForge - Home</h1>} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App