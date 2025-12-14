import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import {Container,Row,Col,Card,CardBody,Form,FormGroup,Input,Button,Spinner,Alert,} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import regFormValidationSchema from '../validation/regFormValidationSchema';
import logo from '../image/logo.png';
import illustration from '../image/home.png';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [role, setRole] = useState('Innovator'); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [localError, setLocalError] = useState('');

  const { status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    
    const values = { name, email, password };

    regFormValidationSchema
      .validate(values, { abortEarly: false })
      .then(() => {
        setValidationErrors({});

        
        const roleSlug = role.toLowerCase(); 

        dispatch(
          registerUser({
            name,
            email,
            password,
            role: roleSlug,
            phone,
            birthday,
          })
        )
          .unwrap()
          .then(() => navigate('/login'))
          .catch(() => {});
      })
      .catch((validationError) => {
        const fieldErrors = {};
        validationError.inner.forEach((err) => {
          if (err.path && !fieldErrors[err.path]) {
            fieldErrors[err.path] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
      });
  };

  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: '#eaf4ff' }}
      className="d-flex align-items-center"
    >
      <Container>
        <Row className="justify-content-center">
         
          <Col lg="6">
            <Card className="shadow-lg border-0">
              <CardBody className="p-4 p-md-5">
              
                <div className="d-flex align-items-center mb-4">
                  <img
                    src={logo}
                    alt="SparkUp logo"
                    style={{ height: 40, width: 40, borderRadius: '50%' }}
                    className="me-2"
                  />
                  <span
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: '#1a4d80',
                    }}
                  >
                    Spark<span style={{ color: '#ff9f43' }}>Up</span>
                  </span>
                </div>

                <h3 className="fw-bold mb-3" style={{ color: '#1a4d80' }}>
                  Create Account
                </h3>

                {error && (
                  <Alert color="danger" className="py-2">
                    {error}
                  </Alert>
                )}
                {localError && (
                  <Alert color="danger" className="py-2">
                    {localError}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <FormGroup className="mb-3">
                    <Input
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {validationErrors.name && (
                      <div className="text-danger small mt-1">
                        {validationErrors.name}
                      </div>
                    )}
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {validationErrors.email && (
                      <div className="text-danger small mt-1">
                        {validationErrors.email}
                      </div>
                    )}
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Input
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Input
                      type="date"
                      placeholder="Birthday"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Input
                      type="select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Innovator">Innovator</option>
                      <option value="Funder">Funder</option>
                    </Input>
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {validationErrors.password && (
                      <div className="text-danger small mt-1">
                        {validationErrors.password}
                      </div>
                    )}
                  </FormGroup>

                  <FormGroup className="mb-4">
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                    />
                  </FormGroup>

                  <div className="d-flex justify-content-between align-items-center mb-3 small">
                    <span>
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none">
                        Login
                      </Link>
                    </span>
                  </div>

                  <div className="d-grid">
                    <Button
                      type="submit"
                      style={{ backgroundColor: '#1a73e8', border: 'none' }}
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? (
                        <Spinner size="sm" />
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>

          <Col
            lg="5"
            className="d-none d-lg-flex align-items-center justify-content-center"
          >
            <img
              src={illustration}
              alt="Create account illustration"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Register;

