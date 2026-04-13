import React, { useEffect, useState } from "react";
import {Container,Card,CardBody,Button,Row,Col,Input,Modal,ModalHeader,ModalBody,ModalFooter,Alert,Spinner,Badge,} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AddAdminModal from "./AddAdminModal";
import { api, authHeaders } from "./api";

export default function UserManagementPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [err, setErr] = useState("");

  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const toggleAddAdmin = () => setAddAdminOpen((o) => !o);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  const toggleInvite = () => {
    setInviteMsg("");
    setErr("");
    setReviewerEmail("");
    setInviteModalOpen((o) => !o);
  };

  const [pendingReviewers, setPendingReviewers] = useState([]);
  const [pendingFunders, setPendingFunders] = useState([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [loadingFunders, setLoadingFunders] = useState(false);

  const fetchPendingReviewers = async () => {
    setLoadingReviewers(true);
    try {
      const res = await api.get("/admin/reviewers/pending", { headers: authHeaders() });
      setPendingReviewers(res.data?.reviewers || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load reviewers");
    } finally {
      setLoadingReviewers(false);
    }
  };

  const fetchPendingFunders = async () => {
    setLoadingFunders(true);
    try {
      const res = await api.get("/admin/funders/pending", { headers: authHeaders() });
      setPendingFunders(res.data?.funders || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load funders");
    } finally {
      setLoadingFunders(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "admin") {
      navigate(-1);
      return;
    }
    fetchPendingReviewers();
    fetchPendingFunders();
 
  }, []);

  const sendInvite = async () => {
    setErr("");
    setInviteMsg("");
    if (!reviewerEmail.trim()) {
      setErr("Enter reviewer email");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await api.post(
        "/admin/reviewers/invite",
        { email: reviewerEmail.trim() },
        { headers: authHeaders() }
      );
      setInviteMsg(res.data?.msg || "Invitation sent");
      setReviewerEmail("");
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const updateReviewerStatus = async (id, status) => {
    setErr("");
    try {
      await api.patch(`/admin/reviewers/${id}/status`, { status }, { headers: authHeaders() });
      fetchPendingReviewers();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update reviewer");
    }
  };

  const updateFunderStatus = async (id, status) => {
    setErr("");
    try {
      await api.patch(`/admin/funders/${id}/status`, { status }, { headers: authHeaders() });
      fetchPendingFunders();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update funder");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}>
      <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="m-0">Admin • User Management</h3>
          <div className="d-flex gap-2">
            <Button color="info" onClick={() => navigate("/notifications")}>Notifications</Button>
            <Button color="secondary" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>

        {err && <Alert color="danger">{err}</Alert>}

        <Row className="g-3 mb-3">
          <Col md="6">
            <Card className="shadow-sm border-0">
              <CardBody className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">Add Admin</div>
                  <div className="text-muted small">Create a new admin account.</div>
                </div>
                <Button color="primary" onClick={toggleAddAdmin}>+ Add</Button>
              </CardBody>
            </Card>
          </Col>
          <Col md="6">
            <Card className="shadow-sm border-0">
              <CardBody className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">Invite Reviewer</div>
                  <div className="text-muted small">Send registration link to reviewer email.</div>
                </div>
                <Button color="warning" onClick={toggleInvite}>Invite</Button>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row className="g-3">
          <Col md="6">
            <Card className="shadow-sm border-0">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="m-0">Pending Reviewers</h5>
                  <Button size="sm" color="secondary" onClick={fetchPendingReviewers}>Refresh</Button>
                </div>
                {loadingReviewers ? (
                  <div className="text-center py-4"><Spinner /></div>
                ) : pendingReviewers.length === 0 ? (
                  <Alert color="info">No pending reviewers.</Alert>
                ) : (
                  pendingReviewers.map((r) => (
                    <Card key={r._id} className="border-0 bg-light mb-2">
                      <CardBody className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{r.name}</div>
                          <div className="text-muted small">{r.email}</div>
                          <Badge color="warning" className="mt-1">pending</Badge>
                        </div>
                        <div className="d-flex gap-2">
                          <Button size="sm" color="success" onClick={() => updateReviewerStatus(r._id, "active")}>Approve</Button>
                          <Button size="sm" color="danger" onClick={() => updateReviewerStatus(r._id, "rejected")}>Reject</Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </CardBody>
            </Card>
          </Col>

          <Col md="6">
            <Card className="shadow-sm border-0">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="m-0">Pending Funders</h5>
                  <Button size="sm" color="secondary" onClick={fetchPendingFunders}>Refresh</Button>
                </div>
                {loadingFunders ? (
                  <div className="text-center py-4"><Spinner /></div>
                ) : pendingFunders.length === 0 ? (
                  <Alert color="info">No pending funders.</Alert>
                ) : (
                  pendingFunders.map((f) => (
                    <Card key={f._id} className="border-0 bg-light mb-2">
                      <CardBody className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{f.name}</div>
                          <div className="text-muted small">{f.email}</div>
                          <Badge color="warning" className="mt-1">pending</Badge>
                        </div>
                        <div className="d-flex gap-2">
                          <Button size="sm" color="success" onClick={() => updateFunderStatus(f._id, "active")}>Approve</Button>
                          <Button size="sm" color="danger" onClick={() => updateFunderStatus(f._id, "rejected")}>Reject</Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <AddAdminModal isOpen={addAdminOpen} toggle={toggleAddAdmin} />

      <Modal isOpen={inviteModalOpen} toggle={toggleInvite}>
        <ModalHeader toggle={toggleInvite}>Invite Reviewer</ModalHeader>
        <ModalBody>
          {inviteMsg && <Alert color="success">{inviteMsg}</Alert>}
          <Input value={reviewerEmail} onChange={(e) => setReviewerEmail(e.target.value)} placeholder="reviewer@email.com" />
          <div className="text-muted small mt-2">An invitation link valid for 24 hours will be emailed.</div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleInvite}>Cancel</Button>
          <Button color="warning" disabled={inviteLoading} onClick={sendInvite}>
            {inviteLoading ? "Sending..." : "Send"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
