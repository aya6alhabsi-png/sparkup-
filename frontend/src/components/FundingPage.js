import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Row,
  Col,
  Button,
  Input,
  Alert,
  Spinner,
  Badge,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, authHeaders } from "./api";

export default function FundingPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const isFunder = user?.role === "funder";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [programs, setPrograms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [funders, setFunders] = useState([]);

  const [programForm, setProgramForm] = useState({ name: "", budget: 0, deadline: "", criteria: "" });
  const [contractForm, setContractForm] = useState({ ideaId: "", funderId: "", programId: "", contractUrl: "" });

  const fetchAll = async () => {
    setErr("");
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get("/funding-programs", { headers: authHeaders() }),
        api.get("/contracts", { headers: authHeaders() }),
      ]);
      setPrograms(pRes.data?.programs || []);
      setContracts(cRes.data?.contracts || []);

      if (isAdmin) {
        const [ideasRes, fundersRes] = await Promise.all([
          api.get("/ideas", { headers: authHeaders() }),
          api.get("/admin/funders/active", { headers: authHeaders() }),
        ]);
        setIdeas(ideasRes.data?.ideas || []);
        setFunders(fundersRes.data?.funders || []);
      }
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load funding data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isAdmin && !isFunder) {
      navigate(-1);
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProgram = async () => {
    setErr("");
    if (!programForm.name.trim()) {
      setErr("Program name is required");
      return;
    }
    try {
      await api.post(
        "/admin/funding-programs",
        {
          ...programForm,
          budget: Number(programForm.budget) || 0,
          deadline: programForm.deadline || null,
        },
        { headers: authHeaders() }
      );
      setProgramForm({ name: "", budget: 0, deadline: "", criteria: "" });
      fetchAll();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to create program");
    }
  };

  const issueContract = async () => {
    setErr("");
    if (!contractForm.ideaId || !contractForm.funderId) {
      setErr("Idea and funder are required");
      return;
    }
    try {
      await api.post("/admin/contracts", contractForm, { headers: authHeaders() });
      setContractForm({ ideaId: "", funderId: "", programId: "", contractUrl: "" });
      fetchAll();
      alert("Contract issued");
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to issue contract");
    }
  };

  const updateContract = async (id, status) => {
    setErr("");
    try {
      await api.patch(`/funder/contracts/${id}`, { status }, { headers: authHeaders() });
      fetchAll();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update contract");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}>
      <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="m-0">Funding & Contracts</h3>
          <div className="d-flex gap-2">
            <Button color="info" onClick={() => navigate("/notifications")}>Notifications</Button>
            <Button color="secondary" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : (
          <Row className="g-3">
            <Col md="6">
              <Card className="shadow-sm border-0">
                <CardBody>
                  <h5>Funding Programs</h5>
                  {isAdmin && (
                    <>
                      <Input className="mb-2" value={programForm.name} onChange={(e) => setProgramForm((f) => ({ ...f, name: e.target.value }))} placeholder="Program name" />
                      <Row className="g-2">
                        <Col md="6">
                          <Input type="number" value={programForm.budget} onChange={(e) => setProgramForm((f) => ({ ...f, budget: e.target.value }))} placeholder="Budget" />
                        </Col>
                        <Col md="6">
                          <Input type="date" value={programForm.deadline} onChange={(e) => setProgramForm((f) => ({ ...f, deadline: e.target.value }))} />
                        </Col>
                      </Row>
                      <Input className="mt-2" type="textarea" value={programForm.criteria} onChange={(e) => setProgramForm((f) => ({ ...f, criteria: e.target.value }))} placeholder="Criteria (eligibility, requirements...)" />
                      <Button className="mt-2" color="primary" onClick={createProgram}>Create Program</Button>
                      <hr />
                    </>
                  )}

                  {programs.length === 0 ? (
                    <Alert color="info">No active funding programs.</Alert>
                  ) : (
                    programs.map((p) => (
                      <Card key={p._id} className="border-0 bg-light mb-2">
                        <CardBody>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-semibold">{p.name}</div>
                              <div className="text-muted small">Budget: {p.budget}</div>
                              {p.deadline && <div className="text-muted small">Deadline: {new Date(p.deadline).toLocaleDateString()}</div>}
                            </div>
                            <Badge color="success">Active</Badge>
                          </div>
                          {p.criteria && <div className="small mt-2">{p.criteria}</div>}
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
                  <h5>Contracts</h5>
                  {isAdmin && (
                    <>
                      <div className="text-muted small mb-2">Issue a contract for an idea after funder decision.</div>
                      <Input type="select" className="mb-2" value={contractForm.ideaId} onChange={(e) => setContractForm((f) => ({ ...f, ideaId: e.target.value }))}>
                        <option value="">Select idea</option>
                        {ideas.map((i) => (
                          <option key={i._id} value={i._id}>{i.title} ({i.status})</option>
                        ))}
                      </Input>
                      <Input type="select" className="mb-2" value={contractForm.funderId} onChange={(e) => setContractForm((f) => ({ ...f, funderId: e.target.value }))}>
                        <option value="">Select funder</option>
                        {funders.map((f) => (
                          <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                        ))}
                      </Input>
                      <Input type="select" className="mb-2" value={contractForm.programId} onChange={(e) => setContractForm((f) => ({ ...f, programId: e.target.value }))}>
                        <option value="">(Optional) Link to program</option>
                        {programs.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </Input>
                      <Input className="mb-2" value={contractForm.contractUrl} onChange={(e) => setContractForm((f) => ({ ...f, contractUrl: e.target.value }))} placeholder="Contract URL (optional)" />
                      <Button color="primary" onClick={issueContract}>Issue Contract</Button>
                      <hr />
                    </>
                  )}

                  {contracts.length === 0 ? (
                    <Alert color="info">No contracts yet.</Alert>
                  ) : (
                    contracts.map((c) => (
                      <Card key={c._id} className="border-0 bg-light mb-2">
                        <CardBody>
                          <div className="d-flex justify-content-between">
                            <div>
                              <div className="fw-semibold">{c.ideaId?.title || "Idea"}</div>
                              <div className="text-muted small">Status: {c.status}</div>
                              {c.contractUrl && <div className="text-muted small">URL: {c.contractUrl}</div>}
                            </div>
                            <Badge color={c.status === "Completed" ? "success" : "secondary"}>{c.status}</Badge>
                          </div>
                          {isFunder && (
                            <div className="d-flex gap-2 mt-2">
                              <Button size="sm" color="secondary" onClick={() => updateContract(c._id, "Signed")}>Signed</Button>
                              <Button size="sm" color="primary" onClick={() => updateContract(c._id, "In Implementation")}>In Implementation</Button>
                              <Button size="sm" color="success" onClick={() => updateContract(c._id, "Completed")}>Completed</Button>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}
