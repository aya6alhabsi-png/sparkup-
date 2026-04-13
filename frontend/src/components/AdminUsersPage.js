import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Input,
  Spinner,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import {
  FaEnvelope,
  FaPhone,
  FaKey,
  FaLanguage,
  FaMoon,
  FaRobot,
  FaEdit,
  FaComments,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import logo from "../image/logo2.png";
import "./adminUsers.css";

const API_URL = "http://localhost:5000";

function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});

  const [mode, setMode] = useState("funders"); // funders | reviewers
  const [reviewers, setReviewers] = useState([]);
  const [funders, setFunders] = useState([]);

  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [loadingFunders, setLoadingFunders] = useState(false);

  const [reviewersError, setReviewersError] = useState("");
  const [fundersError, setFundersError] = useState("");

  const [selectedAccept, setSelectedAccept] = useState({});
  const [selectedBlock, setSelectedBlock] = useState({});

  const [inviteOpen, setInviteOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteErr, setInviteErr] = useState("");

  const token = localStorage.getItem("token") || "";
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const adminName = user?.name || "Admin";
  const adminEmail = user?.email || "admin@email.com";
  const adminPhone =
    user?.phone || user?.phoneNumber || user?.mobile || "+968 00000000";

  const toggleInvite = () => {
    setInviteOpen((v) => !v);
    setReviewerEmail("");
    setInviteMsg("");
    setInviteErr("");
  };

  const toggleAdmin = () => setAdminOpen((v) => !v);

  const fetchReviewers = async () => {
    setLoadingReviewers(true);
    setReviewersError("");
    try {
      const res = await axios.get(`${API_URL}/admin/reviewers/pending`, {
        headers: authHeaders,
      });
      setReviewers(res.data?.reviewers || []);
    } catch (err) {
      setReviewersError(
        err.response?.data?.msg || "Failed to load reviewers."
      );
    } finally {
      setLoadingReviewers(false);
    }
  };

  const fetchFunders = async () => {
    setLoadingFunders(true);
    setFundersError("");
    try {
      const res = await axios.get(`${API_URL}/admin/users?role=funder`, {
        headers: authHeaders,
      });
      setFunders(res.data?.users || res.data?.funders || []);
    } catch (err) {
      setFundersError(
        err.response?.data?.msg || "Failed to load funders."
      );
    } finally {
      setLoadingFunders(false);
    }
  };

  useEffect(() => {
    fetchReviewers();
    fetchFunders();
  }, []);

  const currentList = useMemo(() => {
    return mode === "funders" ? funders : reviewers;
  }, [mode, funders, reviewers]);

  const currentLoading = mode === "funders" ? loadingFunders : loadingReviewers;
  const currentError = mode === "funders" ? fundersError : reviewersError;

  const handleAcceptSelect = (id) => {
    setSelectedAccept((prev) => ({ ...prev, [id]: !prev[id] }));
    setSelectedBlock((prev) => ({ ...prev, [id]: false }));
  };

  const handleBlockSelect = (id) => {
    setSelectedBlock((prev) => ({ ...prev, [id]: !prev[id] }));
    setSelectedAccept((prev) => ({ ...prev, [id]: false }));
  };

  const submitStatuses = async () => {
    const items = currentList || [];

    for (const item of items) {
      const accept = !!selectedAccept[item._id];
      const block = !!selectedBlock[item._id];

      if (!accept && !block) continue;

      const status = accept ? "active" : "blocked";

      try {
        if (mode === "funders") {
          await axios.patch(
            `${API_URL}/admin/funders/${item._id}/status`,
            { status },
            { headers: authHeaders }
          );
        } else {
          await axios.patch(
            `${API_URL}/admin/reviewers/${item._id}/status`,
            { status },
            { headers: authHeaders }
          );
        }
      } catch (err) {
        console.error("Status update failed:", err);
      }
    }

    setSelectedAccept({});
    setSelectedBlock({});
    if (mode === "funders") fetchFunders();
    else fetchReviewers();
  };

  const sendReviewerInvite = async () => {
    setInviteErr("");
    setInviteMsg("");

    if (!reviewerEmail.trim()) {
      setInviteErr("Enter reviewer email");
      return;
    }

    setInviteLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/reviewers/invite`,
        { email: reviewerEmail.trim() },
        { headers: authHeaders }
      );
      setInviteMsg(res.data?.msg || "Invitation sent successfully.");
      setReviewerEmail("");
    } catch (err) {
      setInviteErr(err.response?.data?.msg || "Failed to send invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="aum-page">
      <Container fluid className="aum-shell">
        <Row className="g-0">
          {/* LEFT MAIN */}
          <Col lg="9" className="aum-main-col">
            <div className="aum-top-logo">
              <img src={logo} alt="SparkUp" />
            </div>

            <div className="aum-main-panel">
              <div className="aum-table-head">
                <h2>
                  {mode === "funders" ? "Review the Funders" : "Review the Reviewers"}
                </h2>
              </div>

              <div className="aum-switch-row">
                <Button
                  className={mode === "funders" ? "aum-switch active" : "aum-switch"}
                  onClick={() => setMode("funders")}
                >
                  Funders
                </Button>
                <Button
                  className={mode === "reviewers" ? "aum-switch active" : "aum-switch"}
                  onClick={() => setMode("reviewers")}
                >
                  Reviewers
                </Button>
              </div>

              {currentError && (
                <Alert color="danger" className="mb-3">
                  {currentError}
                </Alert>
              )}

              <div className="aum-table-wrap">
                <div className="aum-table-header aum-grid">
                  <div className="aum-col-name">Name / Email</div>
                  <div className="aum-col-status">Status</div>
                  <div className="aum-col-actions">
                    <span className="aum-accept-label">Accept</span>
                    <span className="aum-block-label">Block</span>
                  </div>
                </div>

                {currentLoading ? (
                  <div className="aum-loading">
                    <Spinner />
                  </div>
                ) : currentList.length === 0 ? (
                  <div className="aum-empty">
                    No {mode === "funders" ? "funders" : "reviewers"} found.
                  </div>
                ) : (
                  currentList.map((item, index) => (
                    <div className="aum-table-row aum-grid" key={item._id || index}>
                      <div className="aum-col-name">
                        <div className="aum-user-name">{item.name || `${mode === "funders" ? "Funder" : "Reviewer"} ${index + 1}`}</div>
                        <div className="aum-user-email">{item.email || "-"}</div>
                      </div>

                      <div className="aum-col-status-text">
                        {String(item.status || "pending")}
                      </div>

                      <div className="aum-col-actions aum-checks">
                        <input
                          type="checkbox"
                          checked={!!selectedAccept[item._id]}
                          onChange={() => handleAcceptSelect(item._id)}
                        />
                        <input
                          type="checkbox"
                          checked={!!selectedBlock[item._id]}
                          onChange={() => handleBlockSelect(item._id)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="aum-submit-row">
                <Button className="aum-submit-btn" onClick={submitStatuses}>
                  Submit
                </Button>
              </div>
            </div>
          </Col>

          {/* RIGHT SIDEBAR */}
          <Col lg="3" className="aum-side-col">
            <div className="aum-sidebar">
              <div className="aum-admin-top">
                <div className="aum-avatar-circle">👤</div>
                <div className="aum-admin-name">
                  Hi {adminName}
                  <FaEdit className="aum-edit-icon" />
                </div>
              </div>

              <div className="aum-admin-info">
                <div className="aum-info-row">
                  <FaEnvelope />
                  <span>{adminEmail}</span>
                </div>

                <div className="aum-info-row">
                  <FaPhone />
                  <span>{adminPhone}</span>
                </div>

                <button className="aum-side-link">
                  <FaKey />
                  <span>Reset Password</span>
                </button>

                <button className="aum-side-link">
                  <FaLanguage />
                  <span>Language</span>
                </button>

                <button className="aum-side-link">
                  <FaMoon />
                  <span>Theme mode</span>
                </button>
              </div>

              <div className="aum-side-buttons">
                <Button className="aum-side-btn white-btn" onClick={toggleAdmin}>
                  Add New Admin
                </Button>

                <Button className="aum-side-btn white-btn" onClick={toggleInvite}>
                  Add Reviewer
                </Button>
              </div>

              <div className="aum-side-icons">
                <FaComments className="aum-chat-icon" />
                <div className="aum-bot-circle">
                  <FaRobot />
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <Modal isOpen={inviteOpen} toggle={toggleInvite} centered>
        <ModalHeader toggle={toggleInvite}>Invite Reviewer</ModalHeader>
        <ModalBody>
          {inviteErr && <Alert color="danger">{inviteErr}</Alert>}
          {inviteMsg && <Alert color="success">{inviteMsg}</Alert>}

          <Input
            type="email"
            value={reviewerEmail}
            onChange={(e) => setReviewerEmail(e.target.value)}
            placeholder="reviewer@example.com"
          />
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleInvite}>
            Close
          </Button>
          <Button color="warning" onClick={sendReviewerInvite} disabled={inviteLoading}>
            {inviteLoading ? "Sending..." : "Send"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={adminOpen} toggle={toggleAdmin} centered>
        <ModalHeader toggle={toggleAdmin}>Add Admin</ModalHeader>
        <ModalBody>
          Hook your Add Admin modal or form here.
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleAdmin}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default AdminUsersPage;