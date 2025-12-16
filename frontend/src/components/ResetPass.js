import React, { useState, useEffect } from "react";
import {Container,Row,Col,Card,CardBody,Form,FormGroup,Input,Button,Alert,Modal,ModalHeader,ModalBody,ModalFooter,Label} from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaLock } from "react-icons/fa";
import logo from "../image/logo.png";
import { logout } from "../store/authSlice";

const API_URL = "http://localhost:5000";

const validateNewPassword = (pwd) => {
  if (pwd.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pwd))
    return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(pwd))
    return "Password must contain at least one lowercase letter";
  if (!/\d/.test(pwd))
    return "Password must contain at least one number";
  if (!/[@$!%*?&#^()_\-+=]/.test(pwd))
    return "Password must contain at least one special character (@$!%*?&#^()_-+=)";
  return "";
};

function ResetPass() {
  const { user } = useSelector((state) => state.auth);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All fields are required");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    const pwdError = validateNewPassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/change-password`, {
        email: user.email,
        currentPassword,
        newPassword,
      });

      if (!res.data.success) {
        setError(res.data.msg || "Failed to change password");
      } else {
        setInfo("Password updated successfully. You will be logged out...");
        setTimeout(() => {
          dispatch(logout());
          navigate("/", { replace: true });
        }, 1200);
      }
    } catch {
      setError("Server error changing password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }} className="d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md="6" lg="4">
            <Card className="shadow-lg border-0">
              <CardBody className="p-4 p-md-5">
                <div className="d-flex align-items-center mb-4">
                  <img src={logo} alt="SparkUp logo" style={{ height: 40, width: 40, borderRadius: "50%" }} className="me-2" />
                  <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a4d80" }}>
                    Spark<span style={{ color: "#ff9f43" }}>Up</span>
                  </span>
                </div>

                <h3 className="fw-bold mb-2" style={{ color: "#1a4d80" }}>
                  Reset Password
                </h3>

                {error && <Alert color="danger">{error}</Alert>}
                {info && <Alert color="success">{info}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <FormGroup className="mb-3">
                    <Input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </FormGroup>

                  <FormGroup className="mb-4">
                    <Input type="password" placeholder="Confirm new password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                  </FormGroup>

                  <Button type="submit" style={{ backgroundColor: "#1a73e8", border: "none" }} disabled={loading} block>
                    {loading ? "Saving..." : "Change Password"}
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}



export function ResetPasswordModal({ isOpen, toggle }) {
  const { user } = useSelector((state) => state.auth);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All fields are required.");
      return;
    }

    //SAME VALIDATION FOR MODAL
    if (currentPassword === newPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    const pwdError = validateNewPassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/change-password`, {
        email: user.email,
        currentPassword,
        newPassword,
      });

      if (!res.data.success) {
        setError(res.data.msg || "Failed to change password.");
      } else {
        setInfo("Password updated successfully. You will be logged out...");
        setTimeout(() => {
          dispatch(logout());
          toggle();
          navigate("/", { replace: true });
        }, 1200);
      }
    } catch {
      setError("Server error changing password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} backdrop="static" keyboard centered>
      <ModalHeader toggle={toggle}>
        <FaLock className="me-2" /> Reset Password
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {error && <Alert color="danger">{error}</Alert>}
          {info && <Alert color="success">{info}</Alert>}

          <FormGroup>
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </FormGroup>

          <FormGroup>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </FormGroup>

          <FormGroup>
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <Button color="secondary" onClick={toggle}>Cancel</Button>
          <Button type="submit" style={{ backgroundColor: "#1a73e8", border: "none" }} disabled={loading}>
            {loading ? "Saving..." : "Change Password"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
}

export default ResetPass;
