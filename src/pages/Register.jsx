import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import registerImg from '../assets/login.png';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ta');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (confirmPassword !== password) {
            setError('Passwords do not match!');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: role
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Registration failed");
            }

            console.log('Account created!');
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const passwordMismatch = password && confirmPassword && password !== confirmPassword;
    const activeError = passwordMismatch ? "The passwords do not match!" : error;

    return (
        <Container>
            <Row className="justify-content-center">
                <Col lg={6} md={8} sm={10} className="login-box p-4">
                    <div className="login-key">
                        <img src={registerImg} alt="Register Icon" className="key" />
                    </div>

                    <div className="login-title">REGISTER</div>

                    <div className="login-form mt-4">
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-4" controlId="formBasicEmail">
                                <Form.Label className="form-control-label">EMAIL ADDRESS</Form.Label>
                                <Form.Control
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError(null);
                                    }} 
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="formBasicPassword">
                                <Form.Label className="form-control-label">PASSWORD</Form.Label>
                                <Form.Control
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="formConfirmPassword">
                                <Form.Label className="form-control-label">CONFIRM PASSWORD</Form.Label>
                                <Form.Control
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="formRole">
                                <Form.Label className="form-control-label">ROLE</Form.Label>
                                <Form.Select
                                    className='role-select-form'
                                    required
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="ta">TA</option>
                                    <option value="instructor">INSTRUCTOR</option>
                                </Form.Select>
                            </Form.Group>

                            {!loading && activeError && (
                                <label className="error-message">{activeError}</label>
                            )}
                            
                            <div className="d-flex flex-column align-items-center mt-5 mb-2">
                                <Button 
                                    variant="outline-primary" 
                                    type="submit" 
                                    className="login-btn mb-3"
                                    disabled={loading || passwordMismatch}
                                >
                                    {loading ? "CREATING ACCOUNT..." : "REGISTER"}
                                </Button>

                                <Link to="/login" className="register-text">
                                    Already have an account? Login here!
                                </Link>
                            </div>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default Register;
