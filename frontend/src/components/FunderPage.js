// src/components/FunderPage.js
import React, { useState } from "react";
import {Container,Row,Col,Card,CardBody,Button,Badge,Modal,ModalHeader,ModalBody,ModalFooter,} from "reactstrap";
import {FaUserCircle,FaEnvelope,FaPhone,FaKey,FaCalendarAlt,FaClipboardList,FaRobot,FaHandHoldingUsd,FaEdit,FaLanguage,FaMoon} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../image/logo.png";
import { ResetPasswordModal } from "./ResetPass";
import { logout } from "../store/authSlice";

function FunderPage() {
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

  const funderName = user?.name || "Funder";

  
  const mainCards = [
    {
      key: "ideasPresented",
      title: "Ideas Presented to Me",
      text: "View all admin-approved ideas mapped to you with summary and status.",
      icon: <FaHandHoldingUsd size={40} />,
      bg: "#123b73",
    },
    {
      key: "updateStatus",
      title: "Update Idea Status",
      text: "Set ideas to Pending, In Progress, or Resolved and add internal notes.",
      icon: <FaClipboardList size={38} />,
      bg: "#133a63",
    },
    {
      key: "reports",
      title: "Funder Reports",
      text: "See how many ideas you reviewed, approved, rejected, or kept in progress.",
      icon: <FaClipboardList size={36} />,
      bg: "#122f4c",
    },
    {
      key: "events",
      title: "Pitch & Demo Events",
      text: "Browse pitch days, demo days, and investment-related events.",
      icon: <FaCalendarAlt size={40} />,
      bg: "#0f4c5c",
    },
   
  ];

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleCardClick = (key) => {
    if (key === "aiHelp") {
      toggleAiModal();
    } else if (key === "profile") {
      toggleProfileModal();
    } else if (key === "events") {
      navigate("/events");
    } else {
      alert(
        `${key} – UI demo only. Later you can navigate to a detailed page for this feature.`
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
                  <FaUserCircle size={48} />
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="fw-semibold">Hi {funderName}</span>
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
                    Funder Home · Ideas, decisions & events
                  </div>
                </div>
              </Col>
            </Row>

            
            <Row className="gy-4">
              {mainCards.map((card) => (
                <Col key={card.key} sm="6" lg="4">
                  <Card
                    className="shadow border-0 h-100 position-relative"
                    style={{
                      backgroundColor: card.bg,
                      color: "#fff",
                      borderRadius: "18px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleCardClick(card.key)}
                  >
                    <CardBody className="d-flex flex-column justify-content-between p-4">
                     
                      {card.key === "profile" && (
                        <div
                          className="position-absolute"
                          style={{
                            top: 10,
                            right: 12,
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaUserCircle size={18} />
                        </div>
                      )}

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
        <ModalHeader toggle={toggleAiModal}>AI Funding Help</ModalHeader>
        <ModalBody></ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleAiModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

     
      <Modal isOpen={profileModalOpen} toggle={toggleProfileModal} centered>
        <ModalHeader toggle={toggleProfileModal}>
          My Profile & Organization
        </ModalHeader>
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

export default FunderPage;
