import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, Button, Badge } from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBell,
  FaEdit,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaLanguage,
} from "react-icons/fa";
import { logout } from "../store/authSlice";
import ProfileEditModal from "./ProfileEditModal";
import { AppContext } from "../context/AppContext";

const API_URL = "http://localhost:5000";

function getProfileImageSrc(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}

function SidebarRow({ icon, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="d-flex align-items-center mb-3 w-100"
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        color: "#fff",
        fontSize: "0.95rem",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span className="me-2" style={{ width: 18, display: "inline-flex", justifyContent: "center" }}>
        {icon}
      </span>
      <span>{text}</span>
    </button>
  );
}

export default function ReviewerPage() {
  const { user } = useSelector((state) => state.auth);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageOk, setImageOk] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { theme, lang, toggleTheme, toggleLang, t } = useContext(AppContext);

  const profileImg = useMemo(() => getProfileImageSrc(user?.imageUrl || ""), [user?.imageUrl]);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const toggleProfile = () => setProfileOpen((o) => !o);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const phone = user?.phone || "-";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--app-bg)" }} className="d-flex">
      <Container fluid className="py-4">
        <Row className="h-100 flex-row-reverse">
          {/* Sidebar */}
          <Col md="3" lg="2" style={{ maxWidth: 280 }}>
            <Card className="h-100 shadow border-0" style={{ backgroundColor: "#f59c32", color: "#fff" }}>
              <CardBody className="p-3 p-md-4 d-flex flex-column">
                <div className="d-flex flex-column align-items-center mb-4">
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "rgba(255,255,255,.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid rgba(255,255,255,.35)",
                    }}
                  >
                    {profileImg && imageOk ? (
                      <img
                        src={profileImg}
                        alt="Profile"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={() => setImageOk(false)}
                      />
                    ) : (
                      <FaUser size={36} />
                    )}
                  </div>

                  <div className="fw-semibold mt-3">
                    {t("hi")} {user?.name}
                  </div>

                  <Badge
                    pill
                    color="light"
                    className="mt-1 text-uppercase"
                    style={{ fontSize: "0.65rem", letterSpacing: "0.06em", color: "#f57c00" }}
                  >
                    {lang === "ar" ? "مراجع" : "REVIEWER"}
                  </Badge>

                  <div className="mt-2 d-flex align-items-center gap-2">
                    <span className="fw-semibold">{lang === "ar" ? "الحالة:" : "Status:"}</span>
                    <Badge color={user.status === "active" ? "success" : "warning"}>{user.status || "pending"}</Badge>
                  </div>
                </div>

                <div className="small mb-3">
                  <div className="d-flex align-items-center mb-3">
                    <FaEnvelope className="me-2" />
                    <span className="text-truncate">{user?.email}</span>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <FaPhone className="me-2" />
                    <span>{phone}</span>
                  </div>

                  {/* ✅ ONLY changes when clicked */}
                  <SidebarRow icon={<FaLanguage />} text={t("language")} onClick={toggleLang} />
                  <SidebarRow icon={theme === "light" ? <FaMoon /> : <FaSun />} text={t("theme")} onClick={toggleTheme} />
                </div>

                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-2"
                  style={{ color: "#f57c00", fontWeight: 800, borderRadius: 12 }}
                  onClick={() => navigate("/notifications")}
                >
                  <FaBell className="me-2" /> {lang === "ar" ? "الإشعارات" : "Notifications"}
                </Button>

                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-2"
                  style={{ color: "#f57c00", fontWeight: 800, borderRadius: 12 }}
                  onClick={toggleProfile}
                >
                  <FaEdit className="me-2" /> {lang === "ar" ? "تعديل الملف" : "Edit Profile"}
                </Button>

                <Button
                  color="light"
                  size="sm"
                  className="w-100"
                  style={{ color: "#f57c00", fontWeight: 800, borderRadius: 999 }}
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="me-2" /> {t("logout")}
                </Button>

                <div className="flex-grow-1" />
              </CardBody>
            </Card>
          </Col>

          {/* Main */}
          <Col md="9" lg="10" className="mt-4 mt-md-0">
            <Card className="shadow border-0" style={{ borderRadius: 20 }}>
              <CardBody className="p-4 p-md-5">
                <h3 className="fw-bold" style={{ color: "var(--app-text)" }}>
                  {lang === "ar" ? "لوحة المراجع" : "Reviewer Dashboard"}
                </h3>

                <div style={{ color: "var(--app-muted)" }}>
                  {lang === "ar" ? (
                    <>
                      مرحباً، <span className="fw-semibold">{user.name}</span>
                    </>
                  ) : (
                    <>
                      Welcome, <span className="fw-semibold">{user.name}</span>
                    </>
                  )}
                </div>

                <hr />

                <div style={{ color: "var(--app-muted)" }}>
                  {user.status === "active" ? (
                    <>{lang === "ar" ? "يمكنك الآن مشاهدة الأفكار المكلّف بها وإرسال التقييم." : "You can now view your assigned ideas and submit reviews."}</>
                  ) : (
                    <>
                      {lang === "ar"
                        ? "إذا كانت حالتك (pending) يجب أن يوافق الأدمن على حسابك قبل إرسال التقييمات."
                        : "If your status is pending, the admin must approve your account before you can submit reviews."}
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <ProfileEditModal isOpen={profileOpen} toggle={toggleProfile} user={user} />
    </div>
  );
}