import React, { useEffect, useState } from "react";
import { Container, Card, CardBody, Row, Col, Alert, Spinner, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, authHeaders } from "./api";

export default function ReportsPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "admin") {
      navigate(-1);
      return;
    }

    const fetch = async () => {
      setErr("");
      setLoading(true);
      try {
        const res = await api.get("/admin/reports/summary", { headers: authHeaders() });
        setSummary(res.data?.summary || null);
      } catch (e) {
        setErr(e.response?.data?.msg || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}>
      <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="m-0">Admin Reports (Summary)</h3>
          <div className="d-flex gap-2">
            <Button color="info" onClick={() => navigate("/notifications")}>Notifications</Button>
            <Button color="secondary" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : !summary ? (
          <Alert color="info">No report data.</Alert>
        ) : (
          <Row className="g-3">
            {Object.entries(summary).map(([k, v]) => (
              <Col md="3" key={k}>
                <Card className="shadow-sm border-0">
                  <CardBody>
                    <div className="text-muted small text-uppercase">{k}</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{v}</div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}
