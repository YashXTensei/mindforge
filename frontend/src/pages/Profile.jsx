import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';
import { User, Mail, Calendar } from 'lucide-react';

// Naya fetch function - Backend se data lane ke liye
const fetchUserProfile = async () => {
    const response = await API.get('/auth/me/');
    return response.data;
};

export default function Profile() {
    // API se data fetch kar rahe hain
    const { data: user, isLoading, isError } = useQuery({
        queryKey: ['userProfile'],
        queryFn: fetchUserProfile,
    });

    if (isLoading) return <div style={{ color: 'white' }}>Loading profile... ⏳</div>;
    if (isError) return <div style={{ color: '#ff4d4d' }}>Error loading profile! ❌</div>;

    return (
        <div>
            <h1 style={{ color: 'white', marginBottom: '30px' }}>Your Profile</h1>
            
            <div style={{
                backgroundColor: '#1E1E1E', padding: '30px', borderRadius: '12px',
                border: '1px solid #333', maxWidth: '500px'
            }}>
                {/* Avatar Icon */}
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#2A2A2A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '20px', border: '2px solid #A076F9'
                }}>
                    <User size={40} color="#A076F9" />
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={18} color="#aaa" />
                        <span style={{ color: '#aaa', width: '100px', textAlign: 'left', display: 'inline-block' }}>Username :</span>
                        <strong style={{ color: 'white', fontSize: '18px' }}>{user.username}</strong>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Mail size={18} color="#aaa" />
                        <span style={{ color: '#aaa', width: '100px', textAlign: 'left', display: 'inline-block' }}>Email :</span>
                        <strong style={{ color: 'white' }}>{user.email}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={18} color="#aaa" />
                        <span style={{ color: '#aaa', width: '100px', textAlign: 'left', display: 'inline-block' }}>Joined on :</span>
                        <strong style={{ color: 'white' }}>
                            {new Date(user.date_joined).toLocaleDateString()}
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
}