import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Button,
  Input,
  Row,
  Col,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Spinner,
  Form,
  FormGroup,
  Label,
} from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, API_URL, authHeaders } from "./api";
import ideaBoardBg from "../image/idea_board_bg.jpg";
import { io } from "socket.io-client";
import "./theme_updated.css";

const STATUS_LABELS = {
  submitted: "Submitted to Admin",
  admin_changes_requested: "Admin Asked for Changes",
  with_reviewer: "With Reviewer",
  reviewer_changes_requested: "Reviewer Asked for Changes",
  reviewer_approved: "Reviewer Approved",
  presented_to_funders: "Presented to Funder",
  funding_pending: "Funding Pending",
  in_progress: "In Progress",
  resolved: "Funded / Completed",
  rejected: "Rejected",
  under_review: "Under Review",
  approved: "Approved",
};

const statusFlow = [
  "submitted",
  "with_reviewer",
  "reviewer_approved",
  "presented_to_funders",
  "resolved",
];

const statusColor = (s) => {
  switch (s) {
    case "submitted":
      return "secondary";
    case "admin_changes_requested":
    case "reviewer_changes_requested":
    case "under_review":
      return "warning";
    case "reviewer_approved":
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    case "with_reviewer":
    case "presented_to_funders":
      return "primary";
    case "funding_pending":
      return "info";
    case "in_progress":
      return "dark";
    case "resolved":
      return "success";
    default:
      return "secondary";
  }
};

const getProgressPercent = (status) => {
  if (status === "rejected") return 15;
  if (status === "admin_changes_requested") return 25;
  if (status === "reviewer_changes_requested") return 45;
  if (status === "funding_pending") return 82;
  if (status === "in_progress") return 90;
  if (status === "approved") return 60;
  if (status === "under_review") return 40;
  const idx = statusFlow.indexOf(status);
  if (idx === -1) return 0;
  return Math.round((idx / (statusFlow.length - 1)) * 100);
};

const getNextStepText = (idea, role) => {
  switch (idea.status) {
    case "submitted":
      return role === "innovator"
        ? "Waiting for admin review."
        : "Admin should review this idea and either comment or send it to a reviewer.";
    case "admin_changes_requested":
      return role === "innovator"
        ? "Update your idea based on the admin comment, then resubmit it."
        : "Waiting for the innovator to update and resubmit the idea.";
    case "with_reviewer":
    case "under_review":
      return role === "innovator"
        ? "Your idea is with the reviewer."
        : "Reviewer should accept it or request changes.";
    case "reviewer_changes_requested":
      return role === "innovator"
        ? "Reviewer requested changes. Wait for the admin note, then update and resubmit."
        : "Admin should review the reviewer comment and send the required updates to the innovator.";
    case "reviewer_approved":
    case "approved":
      return role === "innovator"
        ? "Reviewer approved your idea. Waiting for admin to present it to a funder."
        : "Admin can now present this idea to a funder.";
    case "presented_to_funders":
      return role === "innovator"
        ? "Your idea is now visible to funders."
        : "Funder can review the idea and contact details.";
    case "funding_pending":
      return "Funding is pending.";
    case "in_progress":
      return "Funding is in progress.";
    case "resolved":
      return "This idea is complete.";
    case "rejected":
      return "This idea was rejected.";
    default:
      return "Follow the next workflow step.";
  }
};

const normalizeAssetUrl = (url) => {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const formatIdeaDate = (value) => {
  if (!value) return "Recently updated";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Recently updated";
  return dt.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};


const buildTrackingMoments = (idea) => {
  if (!idea) return [];

  const moments = [
    {
      key: `created-${idea._id}`,
      title: "Idea submitted",
      detail: "Your idea entered the SparkUp workflow.",
      when: idea.createdAt,
      tone: "primary",
    },
  ];

  (idea.adminComments || []).forEach((comment, index) => {
    moments.push({
      key: `admin-${index}-${comment.createdAt || index}`,
      title: "Admin comment",
      detail: comment.comment || "Admin left a comment.",
      when: comment.createdAt || idea.updatedAt,
      tone: "warning",
    });
  });

  (idea.evaluations || []).forEach((evaluation, index) => {
    moments.push({
      key: `review-${index}-${evaluation.createdAt || index}`,
      title:
        evaluation.decision === "changes_requested"
          ? "Reviewer requested changes"
          : "Reviewer evaluation submitted",
      detail: `${evaluation.reviewerName || "Reviewer"} scored ${evaluation.score}/10${
        evaluation.comments ? ` — ${evaluation.comments}` : ""
      }`,
      when: evaluation.createdAt || idea.updatedAt,
      tone: evaluation.decision === "changes_requested" ? "warning" : "success",
    });
  });

  moments.push({
    key: `status-${idea.status}-${idea.updatedAt || idea.createdAt}`,
    title: STATUS_LABELS[idea.status] || idea.status,
    detail: getNextStepText(idea, "innovator"),
    when: idea.updatedAt || idea.createdAt,
    tone: idea.status === "resolved" ? "success" : idea.status === "rejected" ? "danger" : "primary",
  });

  return moments
    .filter((item) => item.when)
    .sort((a, b) => new Date(a.when) - new Date(b.when));
};

function AdvancedTrackingPanel({ idea, compact = false }) {
  const milestones = [
    {
      key: "submitted",
      label: "Submit",
      info: "Idea sent to admin",
      done: [
        "submitted",
        "admin_changes_requested",
        "with_reviewer",
        "reviewer_changes_requested",
        "reviewer_approved",
        "approved",
        "presented_to_funders",
        "funding_pending",
        "in_progress",
        "resolved",
      ].includes(idea.status),
    },
    {
      key: "review",
      label: "Review",
      info: "Admin and reviewer check",
      done: [
        "with_reviewer",
        "reviewer_changes_requested",
        "reviewer_approved",
        "approved",
        "presented_to_funders",
        "funding_pending",
        "in_progress",
        "resolved",
      ].includes(idea.status),
    },
    {
      key: "present",
      label: "Present",
      info: "Shared with funder",
      done: ["presented_to_funders", "funding_pending", "in_progress", "resolved"].includes(idea.status),
    },
    {
      key: "fund",
      label: idea.status === "resolved" ? "Funded" : "Final stage",
      info: idea.status === "resolved" ? "Completed successfully" : "Funding decision and execution",
      done: ["funding_pending", "in_progress", "resolved"].includes(idea.status),
    },
  ];

  const moments = buildTrackingMoments(idea);
  const currentStatus = STATUS_LABELS[idea.status] || idea.status;
  const toneColor =
    idea.status === "resolved"
      ? "#1f9254"
      : idea.status === "rejected"
      ? "#cc3f3f"
      : ["admin_changes_requested", "reviewer_changes_requested", "under_review"].includes(idea.status)
      ? "#d88718"
      : "#1e5fa7";

  return (
    <div
      style={{
        background: compact ? "#f7fbff" : "linear-gradient(180deg, #f9fbff 0%, #f1f7ff 100%)",
        border: "1px solid #e2ecfa",
        borderRadius: 22,
        padding: compact ? 16 : 20,
      }}
    >
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
        <div>
          <div style={{ color: "#6f88aa", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
            ADVANCED TRACKING
          </div>
          <div style={{ color: "#102846", fontWeight: 800, fontSize: compact ? 18 : 20 }}>
            {currentStatus}
          </div>
        </div>
        <div
          style={{
            background: `${toneColor}15`,
            color: toneColor,
            borderRadius: 999,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {getProgressPercent(idea.status)}% complete
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "repeat(auto-fit, minmax(120px, 1fr))" : "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {milestones.map((item, index) => (
          <div
            key={item.key}
            style={{
              borderRadius: 18,
              padding: "14px 14px 12px",
              background: item.done ? "#ffffff" : "#eef4fb",
              border: `1px solid ${item.done ? "#d8e7fb" : "#e3ebf7"}`,
              boxShadow: item.done ? "0 10px 24px rgba(26, 78, 138, 0.06)" : "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                marginBottom: 10,
                background: item.done ? "linear-gradient(135deg, #1e5fa7, #63a6ff)" : "#dce7f6",
                color: item.done ? "#fff" : "#6b82a2",
                fontWeight: 800,
              }}
            >
              {index + 1}
            </div>
            <div style={{ color: "#102846", fontWeight: 800, fontSize: 14 }}>{item.label}</div>
            <div style={{ color: "#6f88aa", fontSize: 12, lineHeight: 1.5 }}>{item.info}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #e0eafb",
          padding: compact ? 14 : 16,
        }}
      >
        <div style={{ color: "#102846", fontWeight: 800, marginBottom: 8 }}>What happens next?</div>
        <div style={{ color: "#567396", lineHeight: 1.7 }}>{getNextStepText(idea, "innovator")}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ color: "#102846", fontWeight: 800, marginBottom: 10 }}>Tracking timeline</div>
        <div style={{ display: "grid", gap: 10 }}>
          {moments.map((item) => (
            <div
              key={item.key}
              style={{
                display: "grid",
                gridTemplateColumns: "16px 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background:
                    item.tone === "success"
                      ? "#1f9254"
                      : item.tone === "warning"
                      ? "#e39a26"
                      : item.tone === "danger"
                      ? "#cc3f3f"
                      : "#1e5fa7",
                  marginTop: 7,
                }}
              />
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e4edf8",
                  borderRadius: 16,
                  padding: "12px 14px",
                }}
              >
                <div className="d-flex justify-content-between gap-3 flex-wrap">
                  <div style={{ color: "#102846", fontWeight: 800 }}>{item.title}</div>
                  <div style={{ color: "#7d91ac", fontSize: 12 }}>{formatIdeaDate(item.when)}</div>
                </div>
                <div style={{ color: "#5e7899", marginTop: 6, lineHeight: 1.6 }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrackingRoadmap({ status }) {
  const normalized =
    status === "funding_pending"
      ? "presented_to_funders"
      : status === "in_progress"
      ? "resolved"
      : status === "admin_changes_requested"
      ? "submitted"
      : status === "reviewer_changes_requested"
      ? "with_reviewer"
      : status === "under_review"
      ? "with_reviewer"
      : status === "approved"
      ? "reviewer_approved"
      : status;

  const currentIndex = statusFlow.indexOf(normalized);

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {statusFlow.map((step, index) => {
          const active = currentIndex >= index;
          return (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 120,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: active
                    ? "linear-gradient(135deg, #1f4f91, #4f7cff)"
                    : "#dce7f7",
                  color: active ? "#fff" : "#6f86a8",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  boxShadow: active ? "0 10px 20px rgba(47, 98, 196, 0.25)" : "none",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? "#163763" : "#7d90ae",
                }}
              >
                {STATUS_LABELS[step]}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          height: 12,
          background: "#dfe9f6",
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 14,
        }}
      >
        <div
          style={{
            width: `${getProgressPercent(status)}%`,
            height: "100%",
            background:
              status === "rejected"
                ? "linear-gradient(90deg, #ff9a9e, #f44336)"
                : "linear-gradient(90deg, #1d63b2, #6fb8ff)",
            borderRadius: 999,
            transition: "width 0.35s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function IdeasBoard() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === "admin";
  const isInnovator = user?.role === "innovator";
  const isReviewer = user?.role === "reviewer";
  const isFunder = user?.role === "funder";

  const params = new URLSearchParams(location.search);
  const initialView =
    params.get("view") || (user?.role === "innovator" ? "submit" : "progress");

  const [activeView, setActiveView] = useState(initialView);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [q, setQ] = useState("");

  const [submitForm, setSubmitForm] = useState({ title: "", description: "" });
  const [ipFormFile, setIpFormFile] = useState(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [adminStatus, setAdminStatus] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [activeReviewers, setActiveReviewers] = useState([]);
  const [assignIds, setAssignIds] = useState([]);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewScore, setReviewScore] = useState(7);
  const [reviewDecision, setReviewDecision] = useState("accepted");
  const [reviewComment, setReviewComment] = useState("");

  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resubmitIdea, setResubmitIdea] = useState(null);
  const [resubmitForm, setResubmitForm] = useState({ title: "", description: "" });
  const [resubmitFile, setResubmitFile] = useState(null);

  const [funderStatus, setFunderStatus] = useState("funding_pending");
  const [detailOpen, setDetailOpen] = useState(false);
  const [quickComment, setQuickComment] = useState("");
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    setActiveView(qp.get("view") || (user?.role === "innovator" ? "submit" : "progress"));
  }, [location.search, user?.role]);

  const filteredIdeas = useMemo(() => {
    if (!q.trim()) return ideas;
    const qq = q.toLowerCase();
    return ideas.filter(
      (i) =>
        (i.title || "").toLowerCase().includes(qq) ||
        (i.description || "").toLowerCase().includes(qq) ||
        (i.innovatorName || "").toLowerCase().includes(qq)
    );
  }, [ideas, q]);

  const ideaMetrics = useMemo(() => {
    const total = ideas.length;
    const activeReview = ideas.filter((item) =>
      ["submitted", "under_review", "with_reviewer", "reviewer_approved", "approved"].includes(item.status)
    ).length;
    const changesRequested = ideas.filter((item) =>
      ["admin_changes_requested", "reviewer_changes_requested"].includes(item.status)
    ).length;
    const funded = ideas.filter((item) =>
      ["resolved", "in_progress", "funding_pending"].includes(item.status)
    ).length;

    return { total, activeReview, changesRequested, funded };
  }, [ideas]);

  const upsertIdea = (incoming) => {
    if (!incoming?._id) return;

    setIdeas((prev) => {
      const exists = prev.some((item) => item._id === incoming._id);
      const next = exists
        ? prev.map((item) => (item._id === incoming._id ? { ...item, ...incoming } : item))
        : [incoming, ...prev];

      return [...next].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      );
    });

    setSelectedIdea((prev) => (prev?._id === incoming._id ? { ...prev, ...incoming } : prev));
    setLastLiveUpdate(new Date().toISOString());
  };

  const submitQuickComment = async () => {
    if (!selectedIdea?._id || !quickComment.trim()) return;
    setErr("");
    try {
      const res = await api.patch(
        `/ideas/${selectedIdea._id}/admin-review`,
        { status: selectedIdea.status, comment: quickComment.trim() },
        { headers: authHeaders() }
      );
      const updated = res.data?.idea;
      if (updated) upsertIdea(updated);
      setQuickComment("");
      setOkMsg("Comment added successfully");
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to add comment");
    }
  };

  const fetchIdeas = async () => {
    setErr("");
    setLoading(true);
    try {
      const endpoint = isInnovator ? "/ideas/my" : "/ideas";
      const res = await api.get(endpoint, { headers: authHeaders() });
      setIdeas(res.data?.ideas || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load ideas");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewers = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("/admin/users?role=reviewer&status=active", {
        headers: authHeaders(),
      });
      setActiveReviewers(res.data?.users || []);
    } catch {
      setActiveReviewers([]);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchIdeas();
    fetchReviewers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    fetchIdeas();
    const fallback = setInterval(fetchIdeas, 15000);

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => setLiveConnected(true));
    socket.on("disconnect", () => setLiveConnected(false));
    socket.on("idea:updated", (incoming) => {
      if (!incoming?._id) return;

      const shouldInclude =
        user.role === "admin" ||
        (user.role === "innovator" && String(incoming.innovatorId) === String(user._id)) ||
        (user.role === "reviewer" &&
          Array.isArray(incoming.assignedReviewerIds) &&
          incoming.assignedReviewerIds.some((rid) => String(rid) === String(user._id))) ||
        (user.role === "funder" &&
          ["presented_to_funders", "funding_pending", "in_progress", "resolved"].includes(incoming.status));

      if (shouldInclude) upsertIdea(incoming);
    });

    return () => {
      clearInterval(fallback);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.role]);

  const submitIdea = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setOkMsg("");

    if (!submitForm.title || !submitForm.description) {
      setErr("Title and description are required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", submitForm.title);
      formData.append("description", submitForm.description);
      if (ipFormFile) formData.append("ipForm", ipFormFile);

      await api.post("/ideas", formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      setSubmitForm({ title: "", description: "" });
      setIpFormFile(null);
      setOkMsg("Idea submitted successfully");
      await fetchIdeas();
      navigate("/ideas?view=progress");
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to submit idea");
    }
  };

  const openDetail = (idea) => {
    setSelectedIdea(idea);
    setQuickComment("");
    setDetailOpen(true);
  };

  const openAdmin = (idea) => {
    setSelectedIdea(idea);
    setQuickComment("");
    setAdminStatus(idea.status);
    setAdminComment("");
    setAssignIds(idea.assignedReviewerIds?.map((r) => r._id || r) || []);
    setAdminOpen(true);
  };

  const adminSave = async () => {
    setErr("");
    try {
      await api.patch(
        `/ideas/${selectedIdea._id}/admin-review`,
        { status: adminStatus, comment: adminComment },
        { headers: authHeaders() }
      );
      setAdminComment("");
      setOkMsg("Idea updated successfully");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update");
    }
  };

  const adminAssign = async () => {
    setErr("");
    try {
      await api.patch(
        `/ideas/${selectedIdea._id}/assign-reviewers`,
        { reviewerIds: assignIds },
        { headers: authHeaders() }
      );
      setOkMsg("Reviewers assigned successfully");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to assign");
    }
  };

  const adminPresent = async () => {
    setErr("");
    try {
      await api.patch(`/ideas/${selectedIdea._id}/present`, {}, { headers: authHeaders() });
      setOkMsg("Idea presented to funders");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to present");
    }
  };

  const openReview = (idea) => {
    setSelectedIdea(idea);
    setReviewScore(7);
    setReviewDecision("accepted");
    setReviewComment("");
    setReviewOpen(true);
  };

  const openResubmit = (idea) => {
    setResubmitIdea(idea);
    setResubmitForm({ title: idea.title || "", description: idea.description || "" });
    setResubmitFile(null);
    setResubmitOpen(true);
  };

  const submitReview = async () => {
    setErr("");
    try {
      await api.post(
        `/reviewer/ideas/${selectedIdea._id}/evaluation`,
        { score: Number(reviewScore), decision: reviewDecision, comments: reviewComment },
        { headers: authHeaders() }
      );
      setReviewOpen(false);
      setOkMsg("Evaluation submitted successfully");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to submit evaluation");
    }
  };

  const submitResubmission = async () => {
    setErr("");
    try {
      const formData = new FormData();
      formData.append("title", resubmitForm.title);
      formData.append("description", resubmitForm.description);
      if (resubmitFile) formData.append("ipForm", resubmitFile);

      await api.patch(`/ideas/${resubmitIdea._id}/resubmit`, formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      setResubmitOpen(false);
      setOkMsg("Idea resubmitted successfully");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to resubmit idea");
    }
  };

  const updateFundingStatus = async (idea) => {
    setErr("");
    try {
      await api.patch(
        `/funder/ideas/${idea._id}/status`,
        { status: funderStatus },
        { headers: authHeaders() }
      );
      setOkMsg("Funding status updated");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #eef6ff 0%, #dfeeff 100%)" }}>
      <Container className="py-4">
        {err && <Alert color="danger">{err}</Alert>}
        {okMsg && <Alert color="success">{okMsg}</Alert>}

        {activeView === "submit" && (
          <Card
            className="border-0 shadow-sm overflow-hidden mb-4"
            style={{
              borderRadius: 26,
              background: "linear-gradient(120deg, #0e2f57 0%, #164982 50%, #1f5fa8 100%)",
            }}
          >
            <CardBody style={{ padding: 0 }}>
              <Row className="g-0 align-items-stretch">
                <Col lg="7" style={{ padding: "34px 34px 30px" }}>
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
                    <div>
                      <div
                        style={{
                          color: "#d9ecff",
                          fontSize: 14,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        SparkUp Ideas Center
                      </div>
                      <h2 style={{ color: "#fff", fontWeight: 800, marginBottom: 10 }}>
                        Submit ideas and track your innovation journey
                      </h2>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.88)",
                          maxWidth: 560,
                          marginBottom: 0,
                        }}
                      >
                        Create your idea, attach your IP form, and follow each stage from submission to funding in one clear space.
                      </p>
                    </div>

                    <div className="d-flex gap-2">
                      <Button color="info" onClick={() => navigate("/notifications")}>
                        Notifications
                      </Button>
                      <Button color="light" onClick={() => navigate(-1)}>
                        Back
                      </Button>
                    </div>
                  </div>

                  {isInnovator ? (
                    <Card
                      className="border-0"
                      style={{
                        borderRadius: 22,
                        background: "rgba(255,255,255,0.96)",
                        boxShadow: "0 18px 40px rgba(6, 26, 56, 0.18)",
                        marginTop: 26,
                      }}
                    >
                      <CardBody style={{ padding: 28 }}>
                        <div className="d-flex justify-content-between gap-3 align-items-start flex-wrap mb-3">
                          <div>
                            <h3
                              style={{
                                fontWeight: 800,
                                color: "#102846",
                                marginBottom: 6,
                              }}
                            >
                              Submit Idea + IP Form
                            </h3>
                            <p style={{ color: "#6481a6", marginBottom: 0 }}>Innovator workflow</p>
                          </div>

                          <div
                            style={{
                              background: "linear-gradient(135deg, #fff3e0, #ffe2bf)",
                              color: "#b36a06",
                              borderRadius: 999,
                              padding: "8px 14px",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            Safe submission
                          </div>
                        </div>

                        <Form onSubmit={submitIdea}>
                          <FormGroup className="mb-3">
                            <Label
                              style={{
                                color: "#0f2747",
                                fontSize: 17,
                                fontWeight: 700,
                              }}
                            >
                              Title
                            </Label>
                            <Input
                              type="text"
                              value={submitForm.title}
                              onChange={(e) => setSubmitForm((f) => ({ ...f, title: e.target.value }))}
                              placeholder="Enter your idea title"
                              style={{
                                minHeight: 50,
                                borderRadius: 14,
                                borderColor: "#d9e5f2",
                              }}
                            />
                          </FormGroup>

                          <FormGroup className="mb-3">
                            <Label
                              style={{
                                color: "#0f2747",
                                fontSize: 17,
                                fontWeight: 700,
                              }}
                            >
                              Description
                            </Label>
                            <Input
                              type="textarea"
                              value={submitForm.description}
                              onChange={(e) =>
                                setSubmitForm((f) => ({
                                  ...f,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Explain your idea and its value"
                              style={{
                                minHeight: 130,
                                borderRadius: 14,
                                borderColor: "#d9e5f2",
                              }}
                            />
                          </FormGroup>

                          <FormGroup className="mb-4">
                            <Label
                              style={{
                                color: "#0f2747",
                                fontSize: 17,
                                fontWeight: 700,
                              }}
                            >
                              IP Form (PDF/Image)
                            </Label>
                            <Input
                              type="file"
                              accept=".pdf,image/*"
                              onChange={(e) => setIpFormFile(e.target.files?.[0] || null)}
                              style={{
                                borderRadius: 14,
                                borderColor: "#d9e5f2",
                              }}
                            />
                          </FormGroup>

                          <Button
                            type="submit"
                            style={{
                              background: "linear-gradient(135deg, #f79c2e, #ffbf6d)",
                              border: "none",
                              borderRadius: 14,
                              padding: "12px 24px",
                              fontSize: 16,
                              fontWeight: 800,
                              boxShadow: "0 14px 24px rgba(247, 156, 46, 0.28)",
                            }}
                          >
                            Submit Idea
                          </Button>
                        </Form>
                      </CardBody>
                    </Card>
                  ) : null}
                </Col>

                <Col
                  lg="5"
                  style={{
                    minHeight: 420,
                    backgroundImage: `linear-gradient(180deg, rgba(8,27,51,0.10), rgba(8,27,51,0.02)), url(${ideaBoardBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "end",
                      padding: 28,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.14)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        borderRadius: 22,
                        padding: 20,
                        color: "#211b30",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          lineHeight: 1.2,
                          marginTop: 8,
                        }}
                      >
                        From submission to funding, every step is visible.
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        )}

        {activeView === "progress" && (
          <div>
            <Card
              className="border-0 shadow-sm overflow-hidden mb-4"
              style={{
                borderRadius: 28,
                background: "linear-gradient(135deg, #0f2747 0%, #18457f 50%, #1e67c7 100%)",
                color: "#fff",
              }}
            >
              <CardBody style={{ padding: 28 }}>
                <Row className="g-4 align-items-center">
                  <Col lg="7">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                      <div
                        style={{
                          color: "rgba(255,255,255,0.78)",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontSize: 12,
                        }}
                      >
                        {isAdmin
                          ? "Admin idea workspace"
                          : isReviewer
                          ? "Reviewer idea workspace"
                          : isFunder
                          ? "Funder idea workspace"
                          : "Creative tracking"}
                      </div>
                      <div className={`ideas-live-chip ${liveConnected ? "connected" : ""}`}>
                        {liveConnected ? "Live sync on" : "Sync reconnecting"}
                      </div>
                    </div>

                    <h2
                      style={{
                        color: "#ffffff",
                        fontWeight: 900,
                        fontSize: "2.2rem",
                        lineHeight: 1.15,
                        marginBottom: 12,
                      }}
                    >
                      {isAdmin
                        ? "Review ideas in one clean command center."
                        : isReviewer
                        ? "Evaluate assigned ideas faster and clearly."
                        : isFunder
                        ? "Track promising ideas ready for funding."
                        : "My Ideas & Progress"}
                    </h2>

                    <p
                      style={{
                        color: "rgba(255,255,255,0.86)",
                        maxWidth: 720,
                        fontSize: "1rem",
                        lineHeight: 1.75,
                        marginBottom: 0,
                      }}
                    >
                      {isAdmin
                        ? "A simplified list-first layout for SparkUp. See innovator profile, contact details, status, comments, and submitted files without the extra top images."
                        : isReviewer
                        ? "Everything you need for review is organized into cleaner cards with better spacing, stronger hierarchy, and easier actions."
                        : isFunder
                        ? "Browse visible ideas in a cleaner interface with stronger focus on profile details, progress, and funding actions."
                        : "Track every idea from submission to funding in one elegant dashboard with clearer cards and easier file access."}
                    </p>
                  </Col>

                  <Col lg="5">
                    <Row className="g-3">
                      <Col xs="6">
                        <div className="ideas-metric-card">
                          <div className="ideas-metric-label">Total ideas</div>
                          <div className="ideas-metric-value">{ideaMetrics.total}</div>
                        </div>
                      </Col>
                      <Col xs="6">
                        <div className="ideas-metric-card">
                          <div className="ideas-metric-label">{isFunder ? "Funding stage" : "In review"}</div>
                          <div className="ideas-metric-value">
                            {isFunder ? ideaMetrics.funded : ideaMetrics.activeReview}
                          </div>
                        </div>
                      </Col>
                      <Col xs="6">
                        <div className="ideas-metric-card">
                          <div className="ideas-metric-label">Changes needed</div>
                          <div className="ideas-metric-value">{ideaMetrics.changesRequested}</div>
                        </div>
                      </Col>
                      <Col xs="6">
                        <div className="ideas-metric-card">
                          <div className="ideas-metric-label">Last sync</div>
                          <div className="ideas-metric-mini">
                            {lastLiveUpdate
                              ? new Date(lastLiveUpdate).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <Card
              className="shadow-sm border-0 mb-4"
              style={{
                borderRadius: 20,
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(10px)",
              }}
            >
              <CardBody style={{ padding: 20 }}>
                <Row className="g-3 align-items-center">
                  <Col lg="7">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={
                        isInnovator
                          ? "Search your ideas, descriptions, or progress..."
                          : "Search ideas by title, description, or innovator..."
                      }
                      style={{
                        minHeight: 52,
                        borderRadius: 16,
                        borderColor: "#d7e4f3",
                        boxShadow: "none",
                      }}
                    />
                  </Col>

                  <Col lg="5">
                    <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                      {isInnovator && (
                        <Button
                          color="light"
                          onClick={() => navigate("/ideas?view=submit")}
                          style={{
                            borderRadius: 14,
                            fontWeight: 700,
                            padding: "10px 18px",
                            border: "1px solid #d7e4f3",
                          }}
                        >
                          Submit New Idea
                        </Button>
                      )}

                      {isAdmin && (
                        <Button
                          color="primary"
                          onClick={() => navigate("/funding")}
                          style={{
                            borderRadius: 14,
                            fontWeight: 700,
                            padding: "10px 18px",
                          }}
                        >
                          Funding & Contracts
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {loading ? (
              <div className="text-center py-5">
                <Spinner />
              </div>
            ) : filteredIdeas.length === 0 ? (
              <Alert color="info">No ideas found for your account.</Alert>
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                {filteredIdeas.map((idea, index) => (
                  <Card
                    key={idea._id}
                    className="border-0 shadow-sm idea-sequence-card"
                    style={{
                      borderRadius: 26,
                      overflow: "hidden",
                      background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                      border: "1px solid #deebfb",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(idea);
                    }}
                  >
                    <CardBody style={{ padding: 24 }}>
                      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <div className="idea-sequence-chip">Idea #{index + 1}</div>
                          <div
                            style={{
                              background: "#f2f7ff",
                              color: "#56779e",
                              borderRadius: 999,
                              padding: "7px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              border: "1px solid #dfebfa",
                            }}
                          >
                            Updated {formatIdeaDate(idea.updatedAt || idea.createdAt)}
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#edf4ff",
                            color: "#295d9c",
                            borderRadius: 999,
                            padding: "10px 16px",
                            fontWeight: 800,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getProgressPercent(idea.status)}% complete
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-start gap-4 flex-wrap mb-3">
                        <div style={{ flex: 1, minWidth: 320 }}>
                          <div className="d-flex align-items-start gap-3 mb-2">
                            <div
                              className="idea-avatar-shell"
                              style={{
                                width: 58,
                                height: 58,
                                borderRadius: "50%",
                                overflow: "hidden",
                                background: "#dbe8fb",
                                display: "grid",
                                placeItems: "center",
                                color: "#1a4e8a",
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {idea.innovatorImageUrl ? (
                                <img
                                  src={normalizeAssetUrl(idea.innovatorImageUrl)}
                                  alt={idea.innovatorName || "Innovator"}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                (idea.innovatorName || "I").charAt(0).toUpperCase()
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                <h4
                                  className="m-0"
                                  style={{
                                    color: "#102846",
                                    fontWeight: 800,
                                    fontSize: "1.45rem",
                                  }}
                                >
                                  {idea.title}
                                </h4>

                                <Badge
                                  color={statusColor(idea.status)}
                                  pill
                                  className="text-uppercase"
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "8px 12px",
                                  }}
                                >
                                  {STATUS_LABELS[idea.status] || idea.status}
                                </Badge>
                              </div>

                              <div
                                style={{
                                  color: "#557395",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  marginBottom: 10,
                                }}
                              >
                                {idea.innovatorName || "Unknown innovator"}
                                {idea.innovatorEmail ? ` • ${idea.innovatorEmail}` : ""}
                              </div>

                              <div
                                style={{
                                  color: "#5d7698",
                                  fontSize: 15,
                                  lineHeight: 1.7,
                                  maxWidth: 900,
                                }}
                              >
                                {idea.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isInnovator && (
                        <div style={{ marginBottom: 14 }}>
                          <AdvancedTrackingPanel idea={idea} compact />
                        </div>
                      )}

                      <div
                        className="small"
                        style={{
                          color: "#476585",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px 18px",
                          marginTop: 10,
                          background: "#f7faff",
                          border: "1px solid #e3edf8",
                          borderRadius: 16,
                          padding: 14,
                        }}
                      >
                        <span>
                          <b>Innovator:</b> {idea.innovatorName || idea.innovatorId?.name || "—"}
                        </span>

                        {(isFunder || isAdmin) && idea.innovatorEmail ? (
                          <span>
                            <b>Email:</b> {idea.innovatorEmail}
                          </span>
                        ) : null}

                        {(isFunder || isAdmin) && idea.innovatorPhone ? (
                          <span>
                            <b>Contact:</b> {idea.innovatorPhone}
                          </span>
                        ) : null}

                        {idea.ipFormUrl ? (
                          <span>
                            <b>IP Form:</b>{" "}
                            <a
                              href={normalizeAssetUrl(idea.ipFormUrl)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontWeight: 700 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open File
                            </a>
                          </span>
                        ) : null}
                      </div>

                      {idea.assignedReviewers?.length ? (
                        <div className="small mt-3" style={{ color: "#476585" }}>
                          <b>Assigned reviewers:</b> {idea.assignedReviewers.map((r) => r.name).join(", ")}
                        </div>
                      ) : null}

                      {idea.evaluations?.length ? (
                        <div className="small mt-3">
                          <b style={{ color: "#102846" }}>Evaluations:</b>
                          <ul className="mb-0 mt-2 ps-3" style={{ color: "#5c789d" }}>
                            {idea.evaluations.map((ev) => (
                              <li key={ev._id || `${ev.reviewerId}-${ev.createdAt}`}>
                                {ev.reviewerName || "Reviewer"}:{" "}
                                {ev.decision === "changes_requested" ? "changes requested" : "accepted"}, score{" "}
                                {ev.score} — {ev.comments || "No comment"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="small mt-3" style={{ color: "#173d6b", fontWeight: 600 }}>
                        Next step: {getNextStepText(idea, user?.role)}
                      </div>

                      {idea.adminComments?.length ? (
                        <div className="small mt-3">
                          <b style={{ color: "#102846" }}>Admin comments:</b>
                          <ul className="mb-0 mt-2 ps-3" style={{ color: "#5c789d" }}>
                            {idea.adminComments.map((c, idx) => (
                              <li key={`${c.createdAt || idx}-${idx}`}>{c.comment}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="d-flex gap-2 align-items-start flex-wrap mt-3">
                        <Button
                          size="sm"
                          color="light"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(idea);
                          }}
                          style={{
                            borderRadius: 12,
                            fontWeight: 700,
                            border: "1px solid #d4e3f6",
                          }}
                        >
                          View Details
                        </Button>

                        {isAdmin && (
                          <Button
                            size="sm"
                            color="warning"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdmin(idea);
                            }}
                            style={{ borderRadius: 12, fontWeight: 700 }}
                          >
                            Manage
                          </Button>
                        )}

                        {isInnovator &&
                          ["admin_changes_requested", "reviewer_changes_requested"].includes(idea.status) && (
                            <Button
                              size="sm"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openResubmit(idea);
                              }}
                              style={{ borderRadius: 12, fontWeight: 700 }}
                            >
                              Update & Resubmit
                            </Button>
                          )}

                        {isReviewer && (
                          <Button
                            size="sm"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReview(idea);
                            }}
                            style={{ borderRadius: 12, fontWeight: 700 }}
                          >
                            Submit Evaluation
                          </Button>
                        )}

                        {isFunder && (
                          <>
                            <Input
                              type="select"
                              value={funderStatus}
                              onChange={(e) => {
                                e.stopPropagation();
                                setFunderStatus(e.target.value);
                              }}
                              style={{ borderRadius: 12, minWidth: 160 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="funding_pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </Input>

                            <Button
                              size="sm"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateFundingStatus(idea);
                              }}
                              style={{ borderRadius: 12, fontWeight: 700 }}
                            >
                              Update
                            </Button>
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Container>

      <Modal
        isOpen={detailOpen}
        toggle={() => setDetailOpen(false)}
        size="lg"
        centered
        modalClassName="idea-detail-modal"
      >
        <ModalHeader toggle={() => setDetailOpen(false)}>Idea Details</ModalHeader>
        <ModalBody>
          {selectedIdea ? (
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#dbe8fb",
                    display: "grid",
                    placeItems: "center",
                    color: "#1a4e8a",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {selectedIdea.innovatorImageUrl ? (
                    <img
                      src={normalizeAssetUrl(selectedIdea.innovatorImageUrl)}
                      alt={selectedIdea.innovatorName || "Innovator"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    (selectedIdea.innovatorName || "I").charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: "#102846" }}>
                    {selectedIdea.innovatorName || "Innovator"}
                  </div>
                  <div style={{ color: "#5d7698", fontSize: 14 }}>{selectedIdea.innovatorEmail || ""}</div>
                </div>
              </div>

              <div style={{ fontWeight: 800, fontSize: 22, color: "#102846", marginBottom: 10 }}>
                {selectedIdea.title}
              </div>
              <div style={{ color: "#4c6889", lineHeight: 1.8, marginBottom: 18 }}>
                {selectedIdea.description}
              </div>

              <div className="mb-3"><AdvancedTrackingPanel idea={selectedIdea} /></div>

              {selectedIdea.ipFormUrl ? (
                <div className="mb-3 idea-file-box">
                  <div>
                    <div style={{ fontWeight: 800, color: "#102846" }}>Submitted file</div>
                    <div style={{ color: "#6985a8", fontSize: 13 }}>IP form uploaded by the innovator</div>
                  </div>
                  <a
                    href={normalizeAssetUrl(selectedIdea.ipFormUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="idea-file-link"
                  >
                    Open file
                  </a>
                </div>
              ) : null}

              <div style={{ marginBottom: 12, fontWeight: 700, color: "#173d6b" }}>Admin comments</div>
              {selectedIdea.adminComments?.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {selectedIdea.adminComments.map((c, idx) => (
                    <div
                      key={`${c.createdAt || idx}-${idx}`}
                      style={{
                        background: "#f7fbff",
                        border: "1px solid #e2edf9",
                        borderRadius: 14,
                        padding: 12,
                      }}
                    >
                      <div style={{ color: "#4e6788" }}>{c.comment}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#7a8faa" }}>No admin comments yet.</div>
              )}

              {isAdmin ? (
                <div className="mt-4">
                  <div style={{ fontWeight: 800, color: "#102846", marginBottom: 10 }}>
                    Add comment for innovator
                  </div>
                  <Input
                    type="textarea"
                    value={quickComment}
                    onChange={(e) => setQuickComment(e.target.value)}
                    placeholder="Write a clear comment that will appear in the innovator tracking page..."
                    style={{ minHeight: 96, borderRadius: 16, borderColor: "#dbe6f5" }}
                  />
                  <div className="d-flex justify-content-end mt-3">
                    <Button color="primary" onClick={submitQuickComment} style={{ borderRadius: 12, fontWeight: 700 }}>
                      Send Comment
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDetailOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={adminOpen} toggle={() => setAdminOpen(false)}>
        <ModalHeader toggle={() => setAdminOpen(false)}>Manage Idea</ModalHeader>
        <ModalBody>
          <div className="mb-2">
            <b>{selectedIdea?.title}</b>
          </div>

          <label className="small">Status</label>
          <Input
            type="select"
            value={adminStatus}
            onChange={(e) => setAdminStatus(e.target.value)}
            className="mb-2"
          >
            <option value="submitted">submitted</option>
            <option value="admin_changes_requested">admin_changes_requested</option>
            <option value="with_reviewer">with_reviewer</option>
            <option value="reviewer_changes_requested">reviewer_changes_requested</option>
            <option value="reviewer_approved">reviewer_approved</option>
            <option value="presented_to_funders">presented_to_funders</option>
            <option value="funding_pending">funding_pending</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
            <option value="rejected">rejected</option>
          </Input>

          <label className="small">Admin comment (optional)</label>
          <Input
            type="textarea"
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            className="mb-3"
            placeholder="Write a comment..."
          />

          <hr />

          <label className="small">Assign reviewers</label>
          <Input
            type="select"
            multiple
            value={assignIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              setAssignIds(selected);
            }}
            className="mb-2"
          >
            {activeReviewers.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} ({r.email})
              </option>
            ))}
          </Input>

          <div className="d-flex gap-2 flex-wrap">
            <Button color="secondary" onClick={adminSave}>
              Save Review
            </Button>

            <Button
              color="warning"
              onClick={async () => {
                setAdminStatus("admin_changes_requested");
                await api.patch(
                  `/ideas/${selectedIdea._id}/admin-review`,
                  {
                    status: "admin_changes_requested",
                    comment: adminComment,
                    sendBackToInnovator: true,
                  },
                  { headers: authHeaders() }
                );
                setOkMsg("Idea returned to innovator");
                setAdminOpen(false);
                fetchIdeas();
              }}
            >
              Return to Innovator
            </Button>

            <Button color="primary" onClick={adminAssign}>
              Send to Reviewer
            </Button>

            <Button color="success" onClick={adminPresent}>
              Present to Funder
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setAdminOpen(false)}>
            Close
          </Button>
          <Button color="warning" onClick={adminSave}>
            Save
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={resubmitOpen} toggle={() => setResubmitOpen(false)}>
        <ModalHeader toggle={() => setResubmitOpen(false)}>Update & Resubmit Idea</ModalHeader>
        <ModalBody>
          <label className="small">Title</label>
          <Input
            type="text"
            value={resubmitForm.title}
            onChange={(e) => setResubmitForm((f) => ({ ...f, title: e.target.value }))}
            className="mb-2"
          />

          <label className="small">Description</label>
          <Input
            type="textarea"
            value={resubmitForm.description}
            onChange={(e) => setResubmitForm((f) => ({ ...f, description: e.target.value }))}
            className="mb-2"
          />

          <label className="small">Replace IP Form (optional)</label>
          <Input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setResubmitOpen(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={submitResubmission}>
            Resubmit
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={reviewOpen} toggle={() => setReviewOpen(false)}>
        <ModalHeader toggle={() => setReviewOpen(false)}>Submit Evaluation</ModalHeader>
        <ModalBody>
          <div className="mb-2">
            <b>{selectedIdea?.title}</b>
          </div>

          <label className="small">Score (0..10)</label>
          <Input
            type="number"
            min={0}
            max={10}
            value={reviewScore}
            onChange={(e) => setReviewScore(e.target.value)}
            className="mb-2"
          />

          <label className="small">Decision</label>
          <Input
            type="select"
            value={reviewDecision}
            onChange={(e) => setReviewDecision(e.target.value)}
            className="mb-2"
          >
            <option value="accepted">Accept</option>
            <option value="changes_requested">Request changes</option>
          </Input>

          <label className="small">Comments</label>
          <Input
            type="textarea"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Your evaluation..."
          />
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setReviewOpen(false)}>
            Cancel
          </Button>
          <Button color="success" onClick={submitReview}>
            Submit
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}