import React, { useEffect, useState } from "react";
import { Container, Card, CardBody, Button, Input, Alert, Spinner, Badge } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, authHeaders } from "./api";

export default function FeedbackPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);

  const [list, setList] = useState([]);

  const fetchAdmin = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/admin/feedback", { headers: authHeaders() });
      setList(res.data?.feedback || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (isAdmin) fetchAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setErr("");
    setOk("");
    if (!message.trim()) {
      setErr("Please write your feedback message");
      return;
    }
    try {
      await api.post("/feedback", { message, rating: Number(rating) }, { headers: authHeaders() });
      setOk("Feedback submitted. Thank you!");
      setMessage("");
      setRating(5);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to submit");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}>
      <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="m-0">Feedback</h3>
          <div className="d-flex gap-2">
            <Button color="info" onClick={() => navigate("/notifications")}>Notifications</Button>
            <Button color="secondary" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {ok && <Alert color="success">{ok}</Alert>}

        {!isAdmin ? (
          <Card className="shadow-sm border-0">
            <CardBody>
              <div className="mb-2">Share your feedback about the platform.</div>
              <Input type="textarea" className="mb-2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your feedback..." />
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="small">Rating:</span>
                <Input type="select" style={{ maxWidth: 120 }} value={rating} onChange={(e) => setRating(e.target.value)}>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Input>
              </div>
              <Button color="primary" onClick={submit}>Submit</Button>
            </CardBody>
          </Card>
        ) : (
          <>
            {loading ? (
              <div className="text-center py-5"><Spinner /></div>
            ) : list.length === 0 ? (
              <Alert color="info">No feedback received yet.</Alert>
            ) : (
              list.map((f) => (
                <Card key={f._id} className="shadow-sm border-0 mb-2">
                  <CardBody>
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="fw-semibold">
                          {f.userId?.name} <span className="text-muted small">({f.userId?.email})</span>
                        </div>
                        <div className="text-muted small">{new Date(f.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <Badge color="dark">{f.role}</Badge>
                        {f.rating != null && <Badge color="primary">Rating: {f.rating}</Badge>}
                      </div>
                    </div>
                    <div className="mt-2">{f.message}</div>
                  </CardBody>
                </Card>
              ))
            )}
          </>
        )}
      </Container>
    </div>
  );
}
