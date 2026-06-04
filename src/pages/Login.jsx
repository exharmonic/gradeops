import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import loginImg from '../assets/login.png';
import { useUser } from '../context/UserContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { login } = useUser();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const formData = new URLSearchParams()
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch('http://localhost:8000/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            })

            if (!response.ok) throw new Error('Invalid email or password')

            const data = await response.json()

            login(data.access_token)

            navigate('/dashboard')
            
        }
        catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    };

    return (
        <Container>
            <Row className="justify-content-center">
                <Col lg={6} md={8} sm={10} className="login-box p-4">
                    <div className="login-key">
                        <img src={loginImg} alt="Login Key" className="key" />
                    </div>

                    <div className="login-title">
                        LOGIN
                    </div>

                    <div className="login-form mt-4">

                        <Form onSubmit={handleSubmit}>

                            <Form.Group className="mb-4" controlId="formBasicUsername">
                                <Form.Label className="form-control-label">EMAIL ADDRESS</Form.Label>
                                <Form.Control
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="formBasicPassword">
                                <Form.Label className="form-control-label">PASSWORD</Form.Label>
                                <Form.Control
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); if (error) setError(null) }}
                                />
                            </Form.Group>

                            {!loading && error && (
                                <label className="error-message">{error}</label>
                            )}

                            <div className="d-flex flex-column align-items-center mt-5 mb-2">
                                <Button variant="outline-primary" type="submit" className="login-btn mb-3">
                                    {loading ? 'LOGGING IN...' : 'LOGIN'}
                                </Button>

                                <Link to="/register" className="register-text">
                                    New to GradeOps? Register here!
                                </Link>
                            </div>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;