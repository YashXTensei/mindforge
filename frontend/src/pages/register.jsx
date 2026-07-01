import { useState } from 'react'
import API from '../api/axios'

function Register() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')

    const handleRegister = async (e) => {
        e.preventDefault()  // Page reload mat karo

        try {
            const response = await API.post('/auth/register/', {
                username,
                email,
                password,
            })
            setMessage('✅ ' + response.data.message)
        } catch (error) {
            setMessage('❌ ' + error.response.data.error)
        }
    }

    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
            <h1>MindForge</h1>
            <h2>Register</h2>

            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Register
                </button>
            </form>

            {message && <p style={{ marginTop: '20px' }}>{message}</p>}
        </div>
    )
}

export default Register