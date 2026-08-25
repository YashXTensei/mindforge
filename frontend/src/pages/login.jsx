import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../api/axios'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await API.post('/auth/token/', {
                username,
                password,
            })

            localStorage.setItem('access_token', response.data.access)
            localStorage.setItem('refresh_token', response.data.refresh)

            toast.success('Login successful! Welcome back.')
            
            setTimeout(() => {
                navigate('/dashboard')
            }, 1000)

        } catch (error) {
            console.error('Login error:', error.response?.data);
            const errorMsg = error.response?.data?.detail 
                || error.response?.data?.error 
                || 'Invalid username or password';
            toast.error(errorMsg);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <span className="font-bold text-white text-xl">M</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            MindForge
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm">Welcome back to your digital brain</p>
                </div>

                {/* Glassmorphism Card */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <Input
                            label="Username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        
                        <div className="pt-2">
                            <Button 
                                type="submit" 
                                className="w-full" 
                                size="lg"
                                isLoading={isLoading}
                                icon={!isLoading && <LogIn size={18} />}
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            Create one now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Login