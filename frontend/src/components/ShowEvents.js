import { Container, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";

export default function ShowEvents() {
  const navigate = useNavigate();

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}
      className="d-flex align-items-center"
    >
      <Container className="text-center">
        <h1 style={{ color: "#1a4d80", fontWeight: 700 }}>Events Page (UI)</h1>
        <p className="mt-3 text-muted">
         
        </p>

        <Button
          style={{ backgroundColor: "#1a73e8", border: "none", marginTop: 20 }}
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </Container>
    </div>
  );
}
