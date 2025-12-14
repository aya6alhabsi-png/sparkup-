
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {Container,Row,Col,Card,CardBody,Button,Badge,Modal,ModalHeader,ModalBody,ModalFooter,} from "reactstrap";
import {FaUserShield,FaEnvelope,FaPhone,FaKey,FaLightbulb,FaCalendarCheck,FaClipboardList,FaRobot,FaUsers,FaMoneyCheckAlt,FaCertificate,FaEdit,FaLanguage,FaMoon} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import logo from "../image/logo.png";
import { ResetPasswordModal } from "./ResetPass";
import { logout } from "../store/authSlice";

function AdminPage() {
  const { user } = useSelector((state) => state.auth);
  const [resetOpen, setResetOpen] = useState(false);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleReset = () => setResetOpen((o) => !o);
  const toggleAiModal = () => setAiModalOpen((o) => !o);
  const toggleProfileModal = () => setProfileModalOpen((o) => !o);

  const phone =
    user?.phone || user?.phoneNumber || user?.mobile || "+000 00000000";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const adminName = user?.name || "Admin";

  
  const mainCards = [
    {
      key: "ideas",
      title: "Review Ideas",
      text: "Check new ideas, update status, and prepare them for funders.",
      icon: <FaLightbulb size={40} />,
      bg: "#123b73",
    },
    {
      key: "events",
      title: "Events Management",
      text: "Create and manage workshops, hackathons, and demo days.",
      icon: <FaCalendarCheck size={40} />,
      bg: "#133a63",
    },
    {
      key: "reports",
      title: "Report & Feedback",
      text: "View high-level reports and feedback from funders and innovators.",
      icon: <FaClipboardList size={38} />,
      bg: "#122f4c",
    },
    {
      key: "users",
      title: "User Management",
      text: "Approve funders, add admins, manage reviewers and innovators.",
      icon: <FaUsers size={36} />,
      bg: "#0f4c5c",
    },
    {
      key: "funding",
      title: "Funding Management",
      text: "Configure funding programs, criteria, and track funding cycles.",
      icon: <FaMoneyCheckAlt size={36} />,
      bg: "#18485c",
    },
    {
      key: "certificates",
      title: "Certificates",
      text: "Issue digital certificates for events and completed ideas.",
      icon: <FaCertificate size={36} />,
      bg: "#12325b",
    },
  ];

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleCardClick = (key) => {
    if (key === "events") {
      navigate("/events");
    } else {
      alert(
        `${key} – this is a UI demo card. Later it can open the detailed admin page.`
      );
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#eaf4ff" }}
      className="d-flex align-items-stretch"
    >
      <Container fluid className="py-4">
        <Row className="h-100 flex-row-reverse">
          <Col
            md="3"
            lg="2"
            className="d-flex flex-column"
            style={{ maxWidth: 260 }}
          >
            <Card
              className="h-100 shadow border-0"
              style={{ backgroundColor: "#f59c32", color: "#fff" }}
            >
              <CardBody className="d-flex flex-column p-3 p-md-4">
               
                <div className="d-flex flex-column align-items-center mb-4">
                  <FaUserShield size={48} />
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="fw-semibold">Hi {adminName}</span>
                    <button
                      type="button"
                      onClick={toggleProfileModal}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FaEdit size={16} />
                    </button>
                  </div>
                  <Badge
                    pill
                    color="light"
                    className="mt-1 text-uppercase"
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.06em",
                      color: "#f57c00",
                    }}
                  >
                    Admin
                  </Badge>
                </div>

               
                <div className="small mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <FaEnvelope className="me-2" />
                    <span className="text-truncate">{user?.email}</span>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <FaPhone className="me-2" />
                    <span>{phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleReset}
                    className="d-flex align-items-center mb-3"
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  >
                    <FaKey className="me-2" />
                    <span>Reset Password</span>
                  </button>
                  <div className="d-flex align-items-center mb-3">
                    <FaLanguage className="me-2" />
                    <span>Language</span>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <FaMoon className="me-2" />
                    <span>Theme mode</span>
                  </div>
                </div>

               
                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-2"
                  style={{
                    color: "#f57c00",
                    fontWeight: 600,
                    borderRadius: "8px",
                  }}
                >
                  Add New Admin
                </Button>
                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-3"
                  style={{
                    color: "#f57c00",
                    fontWeight: 600,
                    borderRadius: "8px",
                  }}
                >
                  Add Reviewer
                </Button>

           
                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-3"
                  style={{
                    color: "#f57c00",
                    fontWeight: 600,
                    borderRadius: "999px",
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>

                <div className="flex-grow-1" />

                
                <div className="d-flex justify-content-center">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#1a4d80",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 8px rgba(0,0,0,0.2)",
                      cursor: "pointer",
                    }}
                    onClick={toggleAiModal}
                  >
                    <FaRobot size={20} color="#fff" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

      
          <Col md="9" lg="10" className="mt-4 mt-md-0">
          
            <Row className="mb-3">
              <Col className="d-flex align-items-center gap-2">
                <img
                  src={logo}
                  alt="SparkUp"
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      color: "#1a4d80",
                    }}
                  >
                    Spark<span style={{ color: "#ff9f43" }}>Up</span>
                  </div>
                  <div className="small text-muted">
                    Admin Home · Manage Ideas, Events & Reports
                  </div>
                </div>
              </Col>
            </Row>

      
            <Row className="gy-4">
              {mainCards.map((card) => (
                <Col key={card.key} sm="6" lg="4">
                  <Card
                    className="shadow border-0 h-100"
                    style={{
                      backgroundColor: card.bg,
                      color: "#fff",
                      borderRadius: "18px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleCardClick(card.key)}
                  >
                    <CardBody className="d-flex flex-column justify-content-between p-4">
                      <div>
                        <div className="mb-3">{card.icon}</div>
                        <h5 className="fw-bold mb-2">{card.title}</h5>
                        <p className="small mb-0">{card.text}</p>
                      </div>
                      <div className="mt-3 text-end">
                        <Button size="sm" color="light">
                          Open
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>

     
      <ResetPasswordModal isOpen={resetOpen} toggle={toggleReset} />

   
      <Modal isOpen={aiModalOpen} toggle={toggleAiModal} centered>
        <ModalHeader toggle={toggleAiModal}>Admin AI Assistant</ModalHeader>
        <ModalBody></ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleAiModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      
      <Modal isOpen={profileModalOpen} toggle={toggleProfileModal} centered>
        <ModalHeader toggle={toggleProfileModal}>Admin Profile</ModalHeader>
        <ModalBody></ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleProfileModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default AdminPage;
