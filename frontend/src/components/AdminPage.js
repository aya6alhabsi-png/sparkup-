import React, { useContext, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import {
  FaUserShield,
  FaEnvelope,
  FaPhone,
  FaKey,
  FaLightbulb,
  FaCalendarCheck,
  FaClipboardList,
  FaRobot,
  FaUsers,
  FaMoneyCheckAlt,
  FaCertificate,
  FaEdit,
  FaLanguage,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

import logo from "../image/logo2.png";
import { ResetPasswordModal } from "./ResetPass";
import { logout, updateUser } from "../store/authSlice";
import ProfileEditModal from "./ProfileEditModal";
import AddAdminModal from "./AddAdminModal";
import { AppContext } from "../context/AppContext";

function AdminPage() {
  const { user } = useSelector((state) => state.auth);

  const [resetOpen, setResetOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { theme, lang, toggleTheme, toggleLang, t, palette } =
    useContext(AppContext);

  const API_URL = "http://localhost:5000";

  const toggleReset = () => setResetOpen((o) => !o);
  const toggleAiModal = () => setAiModalOpen((o) => !o);
  const toggleProfileModal = () => setProfileModalOpen((o) => !o);
  const toggleAddAdmin = () => setAddAdminOpen((o) => !o);

  const phone =
    user?.phone || user?.phoneNumber || user?.mobile || "+000 00000000";

  const adminName = user?.name || "Admin";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const getImgSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_URL}${url}`;
  };

  const mainCards = [
    {
      key: "ideas",
      title: lang === "ar" ? "مراجعة الأفكار" : "Review Ideas",
      text:
        lang === "ar"
          ? "راجع الأفكار الجديدة وحدث حالتها."
          : "Check new ideas, update status, and prepare them for funders.",
      icon: <FaLightbulb size={40} />,
      bg: "#123b73",
    },
    {
      key: "events",
      title: lang === "ar" ? "إدارة الفعاليات" : "Events Management",
      text:
        lang === "ar"
          ? "إنشاء وإدارة الورش والهاكاثونات."
          : "Create and manage workshops, hackathons, and demo days.",
      icon: <FaCalendarCheck size={40} />,
      bg: "#133a63",
    },
    {
      key: "reports",
      title: lang === "ar" ? "التقارير والتغذية" : "Report & Feedback",
      text:
        lang === "ar"
          ? "عرض التقارير والملاحظات."
          : "View reports, analytics, and feedback summaries.",
      icon: <FaClipboardList size={38} />,
      bg: "#122f4c",
    },
    {
      key: "users",
      title: lang === "ar" ? "إدارة المستخدمين" : "User Management",
      text:
        lang === "ar"
          ? "إدارة الممولين والمراجعين والمبتكرين والأدمن في مكان واحد."
          : "Manage funders, reviewers, innovators, and admins in one advanced control center.",
      icon: <FaUsers size={36} />,
      bg: "#0f4c5c",
    },
    {
      key: "funding",
      title: lang === "ar" ? "إدارة التمويل" : "Funding Management",
      text:
        lang === "ar"
          ? "متابعة برامج التمويل."
          : "Configure funding programs and track funding cycles.",
      icon: <FaMoneyCheckAlt size={36} />,
      bg: "#18485c",
    },
    {
      key: "certificates",
      title: lang === "ar" ? "الشهادات" : "Certificates",
      text:
        lang === "ar"
          ? "إصدار الشهادات الرقمية."
          : "Issue digital certificates for events and completed ideas.",
      icon: <FaCertificate size={36} />,
      bg: "#12325b",
    },
  ];

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleCardClick = (key) => {
    if (key === "events") navigate("/events");
    if (key === "ideas") navigate("/ideas");
    if (key === "reports") navigate("/reports");
    if (key === "users") navigate("/admin/users");
    if (key === "funding") navigate("/funding");
    if (key === "certificates") navigate("/certificates");
  };

  const SideRow = ({ icon, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        width: "100%",
        color: "#fff",
        textAlign: "left",
        cursor: "pointer",
      }}
      className="d-flex align-items-center mb-3"
    >
      <span className="me-2">{icon}</span>
      <span style={{ fontSize: "0.95rem" }}>{label}</span>
    </button>
  );

  const panelCardStyle = {
    backgroundColor: palette.surface,
    color: palette.text,
    border: `1px solid ${palette.border}`,
    borderRadius: 22,
    boxShadow: "0 14px 35px rgba(17, 52, 90, 0.08)",
  };

  const brandTextStyle = {
    fontSize: "1.8rem",
    fontWeight: 900,
    letterSpacing: "0.2px",
    lineHeight: 1,
    background: "linear-gradient(90deg, #184f89 0%, #2f80ed 45%, #ff7a00 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.bg,
        color: palette.text,
      }}
      className="d-flex align-items-stretch"
    >
      <Container fluid className="py-4">
        <Row className="h-100 flex-row-reverse">
          {/* Sidebar */}
          <Col
            md="3"
            lg="2"
            className="d-flex flex-column"
            style={{ maxWidth: 260 }}
          >
            <Card
              className="h-100 shadow border-0"
              style={{ backgroundColor: "#f59c32", color: "#fff", borderRadius: 24 }}
            >
              <CardBody className="d-flex flex-column p-3 p-md-4">
                <div className="d-flex flex-column align-items-center mb-4">
                  {user?.imageUrl ? (
                    <img
                      src={getImgSrc(user.imageUrl)}
                      alt="Profile"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <FaUserShield size={48} />
                  )}

                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="fw-semibold">
                      {t("hi")} {adminName}
                    </span>
                    <button
                      type="button"
                      onClick={toggleProfileModal}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        color: "#fff",
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

                  <SideRow
                    icon={<FaKey />}
                    label={t("resetPassword")}
                    onClick={toggleReset}
                  />
                  <SideRow
                    icon={<FaLanguage />}
                    label={t("language")}
                    onClick={toggleLang}
                  />
                  <SideRow
                    icon={theme === "light" ? <FaMoon /> : <FaSun />}
                    label={t("theme")}
                    onClick={toggleTheme}
                  />
                </div>

                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-2"
                  style={{
                    color: "#f57c00",
                    fontWeight: 600,
                    borderRadius: 10,
                  }}
                  onClick={toggleAddAdmin}
                >
                  Add New Admin
                </Button>

                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-2"
                  style={{
                    color: "#f57c00",
                    fontWeight: 700,
                    borderRadius: 10,
                  }}
                  onClick={() => navigate("/admin/users")}
                >
                  User Management
                </Button>

                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-3"
                  style={{
                    color: "#f57c00",
                    fontWeight: 700,
                    borderRadius: 999,
                  }}
                  onClick={handleLogout}
                >
                  {t("logout")}
                </Button>

                <div className="flex-grow-1" />

                <div className="d-flex justify-content-center">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      backgroundColor: "#1a4d80",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 8px rgba(0,0,0,0.2)",
                      cursor: "pointer",
                    }}
                    onClick={toggleAiModal}
                    title="AI"
                  >
                    <FaRobot size={20} color="#fff" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Main */}
          <Col md="9" lg="10" className="mt-4 mt-md-0">
            {/* Header */}
            <Row className="mb-4">
              <Col className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={logo}
                    alt="SparkUp"
                    style={{
                      width: 135,
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                      filter: "drop-shadow(0 10px 22px rgba(30, 136, 229, 0.18))",
                    }}
                  />

                  <div>
                    <div style={brandTextStyle}>SparkUp</div>
                    <div style={{ fontSize: 12, color: palette.muted }}>
                      {lang === "ar"
                        ? "الرئيسية · لوحة تحكم الأدمن"
                        : "Admin Home · Advanced Control Center"}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => navigate("/admin/users")}
                    style={{
                      background: "linear-gradient(135deg, #1e88e5, #ff7a00)",
                      border: "none",
                      borderRadius: 999,
                      fontWeight: 700,
                      padding: "10px 18px",
                    }}
                  >
                    {lang === "ar" ? "إدارة المستخدمين" : "Open User Management"}
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Advanced User Management Feature Panel */}
            <Row className="mb-4">
              <Col lg="12">
                <Card className="border-0" style={panelCardStyle}>
                  <CardBody className="p-4 p-lg-5">
                    <Row className="align-items-center g-4">
                      <Col lg="8">
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 14px",
                            borderRadius: 999,
                            background: palette.isDark
                              ? "rgba(30,136,229,0.14)"
                              : "rgba(30,136,229,0.08)",
                            color: "#1e88e5",
                            fontWeight: 800,
                            marginBottom: 18,
                          }}
                        >
                          <FaUsers />
                          {lang === "ar" ? "إدارة المستخدمين" : "User Management"}
                        </div>

                        <h3
                          className="fw-bold mb-2"
                          style={{ color: palette.text, fontSize: "2rem" }}
                        >
                          {lang === "ar"
                            ? "إدارة الممولين والمراجعين والمبتكرين والأدمن من مكان واحد"
                            : "Manage funders, reviewers, innovators, and admins from one place"}
                        </h3>

                        <p
                          style={{
                            color: palette.muted,
                            fontSize: "1rem",
                            lineHeight: 1.8,
                            maxWidth: 760,
                            marginBottom: 22,
                          }}
                        >
                          {lang === "ar"
                            ? "تم نقل إدارة المراجعين إلى قسم إدارة المستخدمين حتى تكون كل الحسابات في لوحة واحدة بشكل أنظف وأكثر احترافية. من هناك يمكنك الموافقة، الرفض، البحث، والتتبع بطريقة منظمة ومتقدمة."
                            : "Reviewer handling is now moved under User Management so all accounts stay in one cleaner and more advanced control center. From there you can search, approve, reject, and manage funders, reviewers, innovators, and admins in a more organized way."}
                        </p>

                        <div className="d-flex flex-wrap gap-2">
                          <Badge
                            pill
                            style={{
                              background: "#e8f3ff",
                              color: "#1e88e5",
                              padding: "10px 14px",
                              fontWeight: 700,
                            }}
                          >
                            {lang === "ar" ? "الممولون" : "Funders"}
                          </Badge>
                          <Badge
                            pill
                            style={{
                              background: "#fff1e7",
                              color: "#ff7a00",
                              padding: "10px 14px",
                              fontWeight: 700,
                            }}
                          >
                            {lang === "ar" ? "المراجعون" : "Reviewers"}
                          </Badge>
                          <Badge
                            pill
                            style={{
                              background: "#edf8ef",
                              color: "#22c55e",
                              padding: "10px 14px",
                              fontWeight: 700,
                            }}
                          >
                            {lang === "ar" ? "المبتكرون" : "Innovators"}
                          </Badge>
                          <Badge
                            pill
                            style={{
                              background: "#f3f0ff",
                              color: "#7c3aed",
                              padding: "10px 14px",
                              fontWeight: 700,
                            }}
                          >
                            {lang === "ar" ? "الأدمن" : "Admins"}
                          </Badge>
                        </div>
                      </Col>

                      <Col lg="4">
                        <div
                          style={{
                            background: palette.isDark ? "#0b1220" : "#f7fbff",
                            border: `1px solid ${palette.border}`,
                            borderRadius: 22,
                            padding: 22,
                          }}
                        >
                          <div
                            className="d-grid gap-2"
                            style={{ gridTemplateColumns: "1fr 1fr" }}
                          >
                            <div
                              style={{
                                background: "#ffffff",
                                border: `1px solid ${palette.border}`,
                                borderRadius: 18,
                                padding: 18,
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "1.4rem",
                                  fontWeight: 900,
                                  color: "#1e88e5",
                                }}
                              >
                                4
                              </div>
                              <div style={{ color: palette.muted, fontSize: 13 }}>
                                {lang === "ar" ? "أنواع مستخدمين" : "User Roles"}
                              </div>
                            </div>

                            <div
                              style={{
                                background: "#ffffff",
                                border: `1px solid ${palette.border}`,
                                borderRadius: 18,
                                padding: 18,
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "1.4rem",
                                  fontWeight: 900,
                                  color: "#ff7a00",
                                }}
                              >
                                1
                              </div>
                              <div style={{ color: palette.muted, fontSize: 13 }}>
                                {lang === "ar" ? "مركز تحكم" : "Control Hub"}
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-100 mt-3"
                            onClick={() => navigate("/admin/users")}
                            style={{
                              background: "linear-gradient(135deg, #1e88e5, #ff7a00)",
                              border: "none",
                              borderRadius: 16,
                              fontWeight: 800,
                              minHeight: 48,
                            }}
                          >
                            {lang === "ar" ? "فتح إدارة المستخدمين" : "Go to User Management"}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Main cards */}
            <Row className="gy-4">
              {mainCards.map((card) => (
                <Col key={card.key} sm="6" lg="4">
                  <Card
                    className="shadow border-0 h-100"
                    style={{
                      backgroundColor: card.bg,
                      color: "#fff",
                      borderRadius: 20,
                      cursor: "pointer",
                      border: palette.isDark
                        ? `1px solid ${palette.border}`
                        : "none",
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
                        <Button
                          size="sm"
                          color="light"
                          style={{ borderRadius: 999, fontWeight: 700 }}
                        >
                          {t("open")}
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
      <AddAdminModal isOpen={addAdminOpen} toggle={toggleAddAdmin} />

      <Modal isOpen={aiModalOpen} toggle={toggleAiModal} centered>
        <ModalHeader
          toggle={toggleAiModal}
          style={{
            background: palette.surface,
            color: palette.text,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          {lang === "ar" ? "مساعد الإدارة" : "Admin AI Assistant"}
        </ModalHeader>
        <ModalBody
          style={{ background: palette.surface, color: palette.text }}
        />
        <ModalFooter
          style={{
            background: palette.surface,
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          <Button color="secondary" onClick={toggleAiModal}>
            {t("close")}
          </Button>
        </ModalFooter>
      </Modal>

      <ProfileEditModal
        isOpen={profileModalOpen}
        toggle={toggleProfileModal}
        user={user}
        onSaved={(u) => dispatch(updateUser(u))}
      />
    </div>
  );
}

export default AdminPage;