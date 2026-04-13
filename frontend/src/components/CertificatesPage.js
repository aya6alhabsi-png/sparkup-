import React, { useEffect, useState } from "react";
import { Container, Card, CardBody, Alert, Spinner, Button, Badge } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, authHeaders } from "./api";

export default function CertificatesPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [list, setList] = useState([]);

  const fetchList = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/certificates", { headers: authHeaders() });
      setList(res.data?.certificates || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}>
      <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="m-0">Certificates</h3>
          <div className="d-flex gap-2">
            <Button color="info" onClick={() => navigate("/notifications")}>Notifications</Button>
            <Button color="secondary" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : list.length === 0 ? (
          <Alert color="info">No certificates yet.</Alert>
        ) : (
          list.map((c) => (
            <Card key={c._id} className="shadow-sm border-0 mb-2">
              <CardBody className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold">{c.type.replaceAll("_", " ")}</div>
                  <div className="text-muted small">Issued: {new Date(c.issuedAt).toLocaleString()}</div>
                  <div className="small">Code: <b>{c.code}</b></div>
                </div>
                <Badge color="success">Valid</Badge>
              </CardBody>
            </Card>
          ))
        )}
      </Container>
    </div>
  );
}
