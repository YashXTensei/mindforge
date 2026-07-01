import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const navigate = useNavigate()  // Pages ke beech jaane ke liye

    const handleLogin = async (e) => {
        e.preventDefault()

        try {
            const response = await API.post('/auth/token/', {
                username,
                password,
            })

            // Tokens ko browser mein save karo
            localStorage.setItem('access_token', response.data.access)
            localStorage.setItem('refresh_token', response.data.refresh)

            setMessage('✅ Login successful!')

            // 1 second baad Dashboard pe bhej do
            setTimeout(() => {
                navigate('/dashboard')
            }, 1000)

        } catch (error) {
            setMessage('❌ Invalid username or password')
        }
    }

    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
            <h1>MindForge</h1>
            <h2>Login</h2>

            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Login
                </button>
            </form>

            {message && <p style={{ marginTop: '20px' }}>{message}</p>}
        </div>
    )
}

export default Login