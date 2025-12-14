import { Container, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}
      className="d-flex align-items-center"
    >
      <Container className="text-center">
        <h1 style={{ color: "#1a4d80", fontWeight: 700 }}>Contact SparkUp</h1>
        <p className="mt-3 text-muted">
          This is a placeholder Contact page. Add contact info or form later.
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
