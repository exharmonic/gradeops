import { useEffect, useState } from "react"
import { useUser } from "../context/UserContext"
import { useNavigate } from "react-router-dom";
import { Spinner, Button } from 'react-bootstrap';
import TADashboard from "./TADashboard"
import InstructorDashboard from "./InstructorDashboard"


const Dashboard = () => {
    const { token, user, setUser, logout } = useUser();
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await fetch('http://localhost:8000/users/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error("Failed to fetch profile");

                const userData = await response.json();
                setUser(userData);
            } catch (err) {
                console.error(err);
                logout();
                navigate('/login')
            }
            finally {
                setLoading('false')
            }
        };

        if (!user) {
            fetchUser();
        }
        else {
            setLoading(false)
        }

    }, [token, user, setUser, logout, navigate]);

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between mb-4">
                <h1>Welcome, {user?.email || 'User'}!</h1>
                <Button variant="outline-danger" onClick={() => { logout(); navigate('/login'); }}>
                    Logout
                </Button>
            </div>

            {/* ROUTING BASED ON ROLE */}
            {user?.role === 'ta' && <TADashboard />}
            {user?.role === 'instructor' && <InstructorDashboard />}
        </div>
    );
}

export default Dashboard;
