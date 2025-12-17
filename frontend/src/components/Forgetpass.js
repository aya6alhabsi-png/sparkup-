import { useState } from "react";
import axios from "axios";
import {Container,Row,Col,Card,CardBody,Form,FormGroup,Input,Button,Alert,} from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../image/logo.png";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

function Forgetpass() {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new pass
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  //send code (ONLY if email exists)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const cleanEmail = email.trim().toLowerCase();

    // basic frontend validation
    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: cleanEmail,
      });

      // move to step 2 ONLY if success true
      if (!res.data?.success) {
        setError(res.data?.msg || "Email does not exist");
        setLoading(false);
        return;
      }

      setInfo(res.data?.msg || "Confirmation code sent.");
      setStep(2);
    } catch (err) {
      //show exact backend error
      if (err.response?.status === 404) {
        setError(err.response?.data?.msg || "Email does not exist");
      } else if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else {
        setError("Failed to send confirmation code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  //verify code
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (!code.trim()) {
      setError("Please enter the confirmation code.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/verify-code`, {
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });

      if (!res.data.success) {
        setError(res.data.msg || "Invalid or expired code.");
      } else {
        setInfo("Code verified successfully.");
        setStep(3);
      }
    } catch (err) {
      console.error("Verify-code error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //reset password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });

      if (!res.data.success) {
        setError(res.data.msg || "Failed to reset password.");
      } else {
        setInfo("Password changed successfully! Redirecting...");

        setTimeout(() => {
          if (res.data.role === "admin") {
            navigate("/adminlogin");
          } else {
            navigate("/login");
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Reset-password error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <Form onSubmit={handleEmailSubmit}>
          <FormGroup className="mb-3">
            <Input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>

          <div className="d-grid">
            <Button
              type="submit"
              style={{ backgroundColor: "#1a73e8", border: "none" }}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Confirmation Code"}
            </Button>
          </div>
        </Form>
      );
    }

    if (step === 2) {
      return (
        <Form onSubmit={handleCodeSubmit}>
          <p className="small text-muted mb-3">
            We sent a confirmation code to <strong>{email}</strong>
          </p>
          <FormGroup className="mb-3">
            <Input
              type="text"
              placeholder="Confirmation code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </FormGroup>
          <div className="d-grid">
            <Button
              type="submit"
              style={{ backgroundColor: "#1a73e8", border: "none" }}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </div>
        </Form>
      );
    }

    return (
      <Form onSubmit={handlePasswordSubmit}>
        <p className="small text-muted mb-3">
          Set a new password for <strong>{email}</strong>
        </p>
        <FormGroup className="mb-3">
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </FormGroup>
        <FormGroup className="mb-4">
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </FormGroup>
        <div className="d-grid">
          <Button
            type="submit"
            style={{ backgroundColor: "#1a73e8", border: "none" }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Change Password"}
          </Button>
        </div>
      </Form>
    );
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
                  <img src={logo} alt="SparkUp" style={{ height: 150, width: 200 }} />
                </div>

                <h3 className="fw-bold mb-2" style={{ color: "#1a4d80" }}>
                  {step === 1 && "Forgot Password"}
                  {step === 2 && "Enter Confirmation Code"}
                  {step === 3 && "New Password"}
                </h3>

                {error && (
                  <Alert color="danger" className="py-2">
                    {error}
                  </Alert>
                )}
                {info && (
                  <Alert color="info" className="py-2">
                    {info}
                  </Alert>
                )}

                {renderStep()}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Forgetpass;

