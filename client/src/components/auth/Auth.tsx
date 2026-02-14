import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './Auth.css';

export const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register, setGuest } = useGameStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const success = await login(username, password);
                if (!success) {
                    setError('Invalid username or password');
                }
            } else {
                const success = await register(username, password);
                if (!success) {
                    setError('Username already taken or invalid');
                }
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Math Battle</h1>
                <div className="auth-tabs">
                    <button
                        className={isLogin ? 'active' : ''}
                        onClick={() => setIsLogin(true)}
                    >
                        Login
                    </button>
                    <button
                        className={!isLogin ? 'active' : ''}
                        onClick={() => setIsLogin(false)}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username (3-20 chars)"
                            minLength={3}
                            maxLength={20}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password (min 6 chars)"
                            minLength={6}
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="primary-btn">
                        {loading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
                    </button>
                </form>

                <div className="guest-option">
                    <button onClick={setGuest} className="secondary-btn">
                        Continue as Guest
                    </button>
                    <p className="guest-note">Guest mode: Casual games only (no ranked)</p>
                </div>
            </div>
        </div>
    );
};
