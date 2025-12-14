
import React, { useState } from "react";
import {Container,Row,Col,Card,CardBody,Form,FormGroup,Input,Button,Alert} from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import logo from "../image/logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { status, error } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(login({ email, password }))
      .unwrap()
      .then((user) => {
        
        if (user.role === "admin") {
          navigate("/admin");
        } else if (user.role === "innovator") {
          navigate("/innovator");
        } else if (user.role === "funder") {
          navigate("/funder");
        } else {
          navigate("/dashboard"); 
        }
      })
      .catch(() => {});
  };

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}
      className="d-flex align-items-center"
    >
      <Container>
        <Row className="justify-content-center">
          <Col md="6" lg="4">
            <Card className="shadow-lg border-0">
              <CardBody className="p-4 p-md-5">
               
                <div className="d-flex align-items-center mb-4">
                  <img
                    src={logo}
                    alt="SparkUp logo"
                    style={{
                      height: 40,
                      width: 40,
                      borderRadius: "50%",
                      background: "#fff",
                    }}
                    className="me-2"
                  />
                  <span
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "#1a4d80",
                    }}
                  >
                    Spark<span style={{ color: "#ff9f43" }}>Up</span>
                  </span>
                </div>

                <h3 className="fw-bold mb-2" style={{ color: "#1a4d80" }}>
                  Login
                </h3>
                <p className="text-muted small mb-4">
                  Welcome back! Please sign in to your account.
                </p>

                {error && (
                  <Alert color="danger" className="py-2">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
               
                  <FormGroup className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <FaEnvelope />
                      </span>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="border-start-0"
                      />
                    </div>
                  </FormGroup>

                 
                  <FormGroup className="mb-4">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <FaLock />
                      </span>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="border-start-0"
                      />
                    </div>
                  </FormGroup>

               
                  <div className="d-flex justify-content-between align-items-center mb-3 small">
                    <span>
                      Don't have an account? <Link to="/register">Register</Link>
                    </span>
                    <Link to="/forgetpass">Forget Password?</Link>
                  </div>

                  <div className="d-grid">
                    <Button
                      type="submit"
                      style={{
                        background:
                          "linear-gradient(135deg, #1a73e8 0%, #4f9cf9 50%, #ff9f43 100%)",
                        border: "none",
                        borderRadius: "999px",
                      }}
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;
