import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

dotenv.config();

import User from "./models/User.js";
import Admin from "./models/Admin.js";
import ReviewerInvite from "./models/ReviewerInvite.js";
import Idea from "./models/Idea.js";
import Evaluation from "./models/Evaluation.js";
import Event from "./models/Event.js";
import Feedback from "./models/Feedback.js";
import Notification from "./models/Notification.js";
import FundingProgram from "./models/FundingProgram.js";
import Contract from "./models/Contract.js";
import Certificate from "./models/Certificate.js";
import { sendEmail } from "./utils/sendEmail.js";

const app = express();
const server = http.createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true },
});
app.set("io", io);

io.on("connection", () => {
  console.log("🔌 Live client connected");
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/") && !file.mimetype?.includes("pdf")) {
      return cb(new Error("Only image and PDF files are allowed"));
    }
    cb(null, true);
  },
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err.message));

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const IDEA_STATUSES = Idea.allowedStatuses;
const CONTRACT_STATUSES = Contract.allowedStatuses;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
function signToken({ id, role }) {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
}
function fullUploadUrl(url) {
  return url || "";
}
function buildUserResponse(u) {
  if (!u) return null;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    phone: u.phone || "",
    birthday: u.birthday || "",
    bio: u.bio || "",
    imageUrl: fullUploadUrl(u.imageUrl),
    specialization: u.specialization || "",
    organization: u.organization || "",
    experienceYears: u.experienceYears || 0,
    linkedin: u.linkedin || "",
    createdAt: u.createdAt,
  };
}
function buildAdminResponse(a) {
  if (!a) return null;
  return {
    _id: a._id,
    name: a.name,
    email: a.email,
    role: "admin",
    status: "active",
    phone: a.phone || "",
    birthday: a.birthday || "",
    bio: a.bio || "",
    imageUrl: fullUploadUrl(a.imageUrl),
    createdAt: a.createdAt,
  };
}
function buildIdeaResponse(idea) {
  if (!idea) return null;
  return {
    _id: idea._id,
    title: idea.title,
    description: idea.description,
    ipFormUrl: idea.ipFormUrl || "",
    status: idea.status,
    innovatorId: idea.innovatorId?._id || idea.innovatorId,
    innovatorName: idea.innovatorId?.name || idea.innovatorName || "",
    innovatorEmail: idea.innovatorId?.email || "",
    innovatorPhone: idea.innovatorId?.phone || "",
    innovatorImageUrl: fullUploadUrl(idea.innovatorId?.imageUrl || idea.innovatorImageUrl || ""),
    adminComments: idea.adminComments || [],
    assignedReviewerIds: (idea.assignedReviewerIds || []).map((r) => r?._id || r),
    assignedReviewers: (idea.assignedReviewerIds || []).map((r) =>
      typeof r === "object"
        ? { _id: r._id, name: r.name, email: r.email, specialization: r.specialization }
        : { _id: r }
    ),
    evaluations:
      (idea.evaluationIds || []).map((e) =>
        typeof e === "object"
          ? {
              _id: e._id,
              score: e.score,
              decision: e.decision || "accepted",
              comments: e.comments,
              reviewerId: e.reviewerId?._id || e.reviewerId,
              reviewerName: e.reviewerId?.name || "",
              createdAt: e.createdAt,
            }
          : e
      ) || [],
    contractId: idea.contractId?._id || idea.contractId || null,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  };
}

async function emitIdeaUpdate(ideaId) {
  try {
    const populated = await Idea.findById(ideaId)
      .populate("innovatorId", "name email phone imageUrl")
      .populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } })
      .populate("assignedReviewerIds", "name email specialization")
      .populate("contractId");
    if (populated) io.emit("idea:updated", buildIdeaResponse(populated));
  } catch (e) {
    console.error("socket emit idea error", e.message);
  }
}

function buildEventResponse(event) {
  if (!event) return null;
  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    imageUrl: fullUploadUrl(event.imageUrl),
    capacity: event.capacity,
    createdByAdminId: event.createdByAdminId,
    registrations: event.registrations || [],
    registrationCount: event.registrations?.length || 0,
    createdAt: event.createdAt,
  };
}

async function createNotification(userId, type, message, meta = {}) {
  if (!userId) return;
  try {
    await Notification.create({ userId, type, message, meta });
  } catch (e) {
    console.error("Notification error", e.message);
  }
}
async function notifyAllAdmins(type, message, meta = {}) {
  try {
    const admins = await Admin.find({}, "_id");
    await Promise.all(admins.map((admin) => createNotification(admin._id, type, message, meta)));
  } catch (e) {
    console.error("Admin notification error", e.message);
  }
}
async function getAccountByEmail(email) {
  let account = await Admin.findOne({ email });
  if (account) return { account, isAdmin: true };
  account = await User.findOne({ email });
  if (account) return { account, isAdmin: false };
  return { account: null, isAdmin: false };
}
async function getAccountByAuth(auth) {
  if (!auth?.id || !auth?.role) return null;
  if (auth.role === "admin") return Admin.findById(auth.id);
  return User.findById(auth.id);
}

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, msg: "No token" });
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, msg: "Invalid token" });
  }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth?.role) return res.status(401).json({ success: false, msg: "Unauthorized" });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ success: false, msg: "Forbidden" });
    next();
  };
}

app.get("/", (req, res) => res.send("SparkUp API running"));

// ---------- AUTH ----------
app.post("/userRegister", async (req, res) => {
  try {
    const { name, email, password, role, phone, birthday } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    if (!["innovator", "funder"].includes(role)) {
      return res.status(400).json({ msg: "Role must be innovator or funder" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail }) || await Admin.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ msg: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      status: role === "funder" ? "pending" : "active",
      phone: phone || "",
      birthday: birthday || "",
    });
    return res.status(201).json({ msg: "Registration Success", user: buildUserResponse(user) });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ msg: "Server Error" });
  }
});

app.post("/adminRegister", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: "All fields are required" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await Admin.findOne({ email: normalizedEmail })) return res.status(400).json({ msg: "Admin email already exists" });
    const admin = await Admin.create({ name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10) });
    return res.status(201).json({ msg: "Admin created", admin: buildAdminResponse(admin) });
  } catch (err) {
    console.error("Admin register error:", err);
    return res.status(500).json({ msg: "Server Error" });
  }
});

app.post("/userLogin", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.json({ serverMsg: "All fields are required", loginStatus: false });

    const normalizedEmail = email.toLowerCase().trim();
    let account = null;
    let isAdmin = false;

    if (role === "admin") {
      account = await Admin.findOne({ email: normalizedEmail });
      isAdmin = true;
    } else if (role) {
      account = await User.findOne({ email: normalizedEmail, role });
    } else {
      const lookup = await getAccountByEmail(normalizedEmail);
      account = lookup.account;
      isAdmin = lookup.isAdmin;
    }

    if (!account) return res.json({ serverMsg: "Account not found", loginStatus: false });
    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) return res.json({ serverMsg: "Incorrect password", loginStatus: false });

    if (!isAdmin) {
      if (["rejected", "blocked"].includes(account.status)) {
        return res.json({ serverMsg: "Account is not allowed to login", loginStatus: false });
      }
      if (account.status === "pending") {
        return res.json({ serverMsg: `${account.role} account pending admin approval`, loginStatus: false });
      }
    }

    const token = signToken({ id: account._id, role: isAdmin ? "admin" : account.role });
    return res.json({
      serverMsg: "Login Success",
      loginStatus: true,
      token,
      user: isAdmin ? buildAdminResponse(account) : buildUserResponse(account),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.json({ serverMsg: "Server Error", loginStatus: false });
  }
});

app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "Email is required" });
    const { account } = await getAccountByEmail(email.toLowerCase().trim());
    if (!account) return res.json({ success: true, msg: "If this email exists, a confirmation code was sent." });

    account.resetCode = generateCode();
    account.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await account.save();

    try {
      await sendEmail({
        to: account.email,
        subject: "SparkUp Password Reset Code",
        text: `Your code is ${account.resetCode}`,
        html: `<p>Your SparkUp password reset code is:</p><h2>${account.resetCode}</h2>`,
      });
    } catch (e) {
      console.log("Email send skipped/failed:", e.message);
    }
    return res.json({ success: true, msg: "If this email exists, a confirmation code was sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ success: false, msg: "Server error sending code" });
  }
});

app.post("/auth/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    const { account } = await getAccountByEmail((email || "").toLowerCase().trim());
    if (!account || !account.resetCode || account.resetCode !== code || account.resetCodeExpiry < new Date()) {
      return res.status(400).json({ success: false, msg: "Invalid or expired code" });
    }
    return res.json({ success: true, msg: "Code verified" });
  } catch (err) {
    console.error("Verify code error:", err);
    return res.status(500).json({ success: false, msg: "Server error verifying code" });
  }
});

app.post("/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const lookup = await getAccountByEmail((email || "").toLowerCase().trim());
    const account = lookup.account;
    if (!account || !account.resetCode || account.resetCode !== code || account.resetCodeExpiry < new Date()) {
      return res.status(400).json({ success: false, msg: "Invalid or expired code" });
    }
    account.passwordHash = await bcrypt.hash(newPassword, 10);
    account.resetCode = undefined;
    account.resetCodeExpiry = undefined;
    await account.save();
    return res.json({ success: true, msg: "Password has been updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ success: false, msg: "Server error resetting password" });
  }
});

app.post("/auth/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, msg: "Current password and new password are required" });
    }
    const account = await getAccountByAuth(req.auth);
    if (!account) return res.status(404).json({ success: false, msg: "Account not found" });
    const ok = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!ok) return res.status(400).json({ success: false, msg: "Current password is incorrect" });
    account.passwordHash = await bcrypt.hash(newPassword, 10);
    await account.save();
    return res.json({ success: true, msg: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ success: false, msg: "Server error changing password" });
  }
});

app.post("/resetPassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const { account } = await getAccountByEmail((email || "").toLowerCase().trim());
    if (!account) return res.status(404).json({ success: false, msg: "Account not found" });
    account.passwordHash = await bcrypt.hash(newPassword, 10);
    await account.save();
    return res.json({ success: true, msg: "Password updated" });
  } catch (err) {
    console.error("/resetPassword error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/users/me", requireAuth, async (req, res) => {
  const account = await getAccountByAuth(req.auth);
  if (!account) return res.status(404).json({ success: false, msg: "Account not found" });
  return res.json({ success: true, user: req.auth.role === "admin" ? buildAdminResponse(account) : buildUserResponse(account) });
});

app.patch("/users/me", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const account = await getAccountByAuth(req.auth);
    if (!account) return res.status(404).json({ success: false, msg: "Account not found" });
    const { name, bio, phone, birthday, specialization, organization, experienceYears, linkedin } = req.body;
    if (typeof name === "string") account.name = name;
    if (typeof bio === "string") account.bio = bio;
    if (typeof phone === "string") account.phone = phone;
    if (typeof birthday === "string") account.birthday = birthday;
    if (req.auth.role !== "admin") {
      if (typeof specialization === "string") account.specialization = specialization;
      if (typeof organization === "string") account.organization = organization;
      if (typeof experienceYears !== "undefined") account.experienceYears = Number(experienceYears || 0);
      if (typeof linkedin === "string") account.linkedin = linkedin;
    }
    if (req.file) account.imageUrl = `/uploads/${req.file.filename}`;
    await account.save();
    return res.json({ success: true, user: req.auth.role === "admin" ? buildAdminResponse(account) : buildUserResponse(account) });
  } catch (e) {
    console.error("update profile error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

// ---------- ADMIN / REVIEWER / FUNDER MANAGEMENT ----------
app.post("/admin/create-admin", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, msg: "name, email, password required" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await Admin.findOne({ email: normalizedEmail })) return res.status(400).json({ success: false, msg: "Admin already exists" });
    const admin = await Admin.create({ name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10) });
    return res.json({ success: true, msg: "Admin created", admin: buildAdminResponse(admin) });
  } catch (e) {
    console.error("create-admin error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.post("/admin/reviewers/invite", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "email required" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(400).json({ success: false, msg: "This email already has a user account" });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const invite = await ReviewerInvite.create({ email: normalizedEmail, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), status: "pending", invitedByAdminId: req.auth.id });
    const inviteLink = `${FRONTEND_URL}/reviewer-register?token=${rawToken}`;
    try {
      await sendEmail({ to: normalizedEmail, subject: "SparkUp Reviewer Invitation", text: inviteLink, html: `<a href="${inviteLink}">${inviteLink}</a>` });
    } catch (e) {
      console.log("Invite email failed:", e.message);
    }
    return res.json({ success: true, msg: "Invitation sent", inviteId: invite._id, inviteLink });
  } catch (e) {
    console.error("invite reviewer error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/reviewers/invite/validate", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ success: false, msg: "token required" });
    const invite = await ReviewerInvite.findOne({ tokenHash: sha256(token) });
    if (!invite) return res.status(400).json({ success: false, msg: "Invalid token" });
    if (invite.status !== "pending") return res.status(400).json({ success: false, msg: "Invite already used" });
    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();
      return res.status(400).json({ success: false, msg: "Invite expired" });
    }
    return res.json({ success: true, email: invite.email });
  } catch (e) {
    console.error("validate invite error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.post("/reviewers/register", async (req, res) => {
  try {
    const { token, name, password, specialization, organization, experienceYears, linkedin, phone } = req.body;
    if (!token || !name || !password) return res.status(400).json({ success: false, msg: "token, name, password required" });
    const invite = await ReviewerInvite.findOne({ tokenHash: sha256(token) });
    if (!invite) return res.status(400).json({ success: false, msg: "Invalid token" });
    if (invite.status !== "pending") return res.status(400).json({ success: false, msg: "Invite already used" });
    if (invite.expiresAt < new Date()) return res.status(400).json({ success: false, msg: "Invite expired" });
    const reviewer = await User.create({
      name,
      email: invite.email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "reviewer",
      status: "pending",
      specialization: specialization || "",
      organization: organization || "",
      experienceYears: Number(experienceYears || 0),
      linkedin: linkedin || "",
      phone: phone || "",
    });
    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();
    await createNotification(invite.invitedByAdminId, "REVIEWER_APPLICATION", `New reviewer application: ${reviewer.name}`, { reviewerId: reviewer._id });
    return res.json({ success: true, msg: "Reviewer registered. Waiting admin approval.", reviewer: buildUserResponse(reviewer) });
  } catch (e) {
    console.error("reviewer register error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/admin/reviewers/pending", requireAuth, requireRole("admin"), async (req, res) => {
  const reviewers = await User.find({ role: "reviewer", status: "pending" }).sort({ createdAt: -1 });
  return res.json({ success: true, reviewers: reviewers.map(buildUserResponse) });
});
app.patch("/admin/reviewers/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "rejected", "blocked"].includes(status)) return res.status(400).json({ success: false, msg: "Invalid status" });
    const reviewer = await User.findOne({ _id: req.params.id, role: "reviewer" });
    if (!reviewer) return res.status(404).json({ success: false, msg: "Reviewer not found" });
    reviewer.status = status;
    await reviewer.save();
    await createNotification(reviewer._id, "ACCOUNT_STATUS", `Your reviewer account status is now: ${status}`, { status });
    return res.json({ success: true, msg: "Reviewer updated", reviewer: buildUserResponse(reviewer) });
  } catch (e) {
    console.error("update reviewer status error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/admin/funders/pending", requireAuth, requireRole("admin"), async (req, res) => {
  const funders = await User.find({ role: "funder", status: "pending" }).sort({ createdAt: -1 });
  return res.json({ success: true, funders: funders.map(buildUserResponse) });
});
app.patch("/admin/funders/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "rejected", "blocked"].includes(status)) return res.status(400).json({ success: false, msg: "Invalid status" });
    const funder = await User.findOne({ _id: req.params.id, role: "funder" });
    if (!funder) return res.status(404).json({ success: false, msg: "Funder not found" });
    funder.status = status;
    await funder.save();
    await createNotification(funder._id, "ACCOUNT_STATUS", `Your funder account status is now: ${status}`, { status });
    return res.json({ success: true, msg: "Funder updated", funder: buildUserResponse(funder) });
  } catch (e) {
    console.error("update funder status error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
  const { role, status } = req.query;
  const filter = {};
  if (role && role !== "all") filter.role = role;
  if (status && status !== "all") filter.status = status;
  const users = await User.find(filter).sort({ createdAt: -1 });
  return res.json({ success: true, users: users.map(buildUserResponse) });
});

// ---------- IDEAS ----------
app.post("/ideas", requireAuth, requireRole("innovator"), upload.single("ipForm"), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, msg: "title and description are required" });
    const idea = await Idea.create({
      innovatorId: req.auth.id,
      title,
      description,
      ipFormUrl: req.file ? `/uploads/${req.file.filename}` : "",
      status: "submitted",
    });
    await notifyAllAdmins("IDEA_SUBMITTED", `A new idea was submitted: ${idea.title}`, { ideaId: idea._id });
    await emitIdeaUpdate(idea._id);
    return res.status(201).json({ success: true, idea: buildIdeaResponse(idea) });
  } catch (e) {
    console.error("create idea error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/ideas/my", requireAuth, requireRole("innovator"), async (req, res) => {
  const ideas = await Idea.find({ innovatorId: req.auth.id }).sort({ createdAt: -1 }).populate("evaluationIds").populate("assignedReviewerIds", "name email specialization");
  return res.json({ success: true, ideas: ideas.map(buildIdeaResponse) });
});

app.get("/ideas", requireAuth, async (req, res) => {
  const q = req.query.q?.trim();
  const status = req.query.status?.trim();
  const filter = {};
  if (q) filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];
  if (status && status !== "all") filter.status = status;
  if (req.auth.role === "innovator") filter.innovatorId = req.auth.id;
  if (req.auth.role === "reviewer") filter.assignedReviewerIds = req.auth.id;
  if (req.auth.role === "funder") filter.status = { $in: ["presented_to_funders", "funding_pending", "in_progress", "resolved"] };
  const ideas = await Idea.find(filter)
    .sort({ createdAt: -1 })
    .populate("innovatorId", "name email phone imageUrl")
    .populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } })
    .populate("assignedReviewerIds", "name email specialization")
    .populate("contractId");
  return res.json({ success: true, ideas: ideas.map(buildIdeaResponse) });
});

app.get("/ideas/:id", requireAuth, async (req, res) => {
  const idea = await Idea.findById(req.params.id)
    .populate("innovatorId", "name email phone imageUrl")
    .populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } })
    .populate("assignedReviewerIds", "name email specialization")
    .populate("contractId");
  if (!idea) return res.status(404).json({ success: false, msg: "Idea not found" });
  return res.json({ success: true, idea: buildIdeaResponse(idea) });
});

app.patch("/ideas/:id/resubmit", requireAuth, requireRole("innovator"), upload.single("ipForm"), async (req, res) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.id, innovatorId: req.auth.id });
    if (!idea) return res.status(404).json({ success: false, msg: "Idea not found" });
    if (!["admin_changes_requested", "reviewer_changes_requested", "rejected"].includes(idea.status)) {
      return res.status(400).json({ success: false, msg: "This idea is not waiting for changes" });
    }
    if (typeof req.body.title !== "undefined") idea.title = req.body.title;
    if (typeof req.body.description !== "undefined") idea.description = req.body.description;
    if (req.file) idea.ipFormUrl = `/uploads/${req.file.filename}`;
    idea.status = "submitted";
    await idea.save();
    await notifyAllAdmins("IDEA_RESUBMITTED", `Idea resubmitted by innovator: ${idea.title}`, { ideaId: idea._id });
    const populated = await Idea.findById(idea._id).populate("innovatorId", "name email phone imageUrl").populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } }).populate("assignedReviewerIds", "name email specialization");
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error("idea resubmit error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.patch("/ideas/:id/admin-review", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { comment, status, sendBackToInnovator } = req.body;
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: "Idea not found" });

    const trimmedComment = (comment || "").trim();
    if (trimmedComment) {
      idea.adminComments.push({ adminId: req.auth.id, comment: trimmedComment });
    }

    const allowed = [
      "submitted",
      "admin_changes_requested",
      "with_reviewer",
      "reviewer_changes_requested",
      "reviewer_approved",
      "presented_to_funders",
      "funding_pending",
      "in_progress",
      "resolved",
      "rejected",
      "under_review",
      "approved",
    ];

    if (sendBackToInnovator || (trimmedComment && status === "admin_changes_requested")) {
      idea.status = "admin_changes_requested";
    } else if (status) {
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, msg: "Invalid admin status" });
      }
      idea.status = status;
    } else if (trimmedComment) {
      idea.status = "admin_changes_requested";
    }

    await idea.save();

    if (idea.status === "admin_changes_requested") {
      await createNotification(idea.innovatorId, "IDEA_CHANGES_REQUESTED", `Admin asked for updates on your idea: ${idea.title}`, { ideaId: idea._id, status: idea.status });
    } else {
      await createNotification(idea.innovatorId, "IDEA_STATUS", `Your idea "${idea.title}" is now ${idea.status}`, { ideaId: idea._id, status: idea.status });
    }

    const populated = await Idea.findById(idea._id).populate("innovatorId", "name email phone imageUrl").populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } }).populate("assignedReviewerIds", "name email specialization");
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error("admin review error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.patch("/ideas/:id/assign-reviewers", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { reviewerIds } = req.body;
    if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return res.status(400).json({ success: false, msg: "reviewerIds array is required" });
    }
    const validReviewers = await User.find({ _id: { $in: reviewerIds }, role: "reviewer", status: "active" });
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: "Idea not found" });
    idea.assignedReviewerIds = validReviewers.map((r) => r._id);
    idea.status = "with_reviewer";
    await idea.save();
    for (const r of validReviewers) {
      await createNotification(r._id, "IDEA_ASSIGNED", `A new idea was assigned to you: ${idea.title}`, { ideaId: idea._id });
    }
    const populated = await Idea.findById(idea._id).populate("assignedReviewerIds", "name email specialization").populate("innovatorId", "name email phone imageUrl");
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error("assign reviewers error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.patch("/ideas/:id/present", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id).populate("innovatorId", "name email phone imageUrl");
    if (!idea) return res.status(404).json({ success: false, msg: "Idea not found" });
    idea.status = "presented_to_funders";
    await idea.save();
    const funders = await User.find({ role: "funder", status: "active" }, "_id");
    await Promise.all(funders.map((f) => createNotification(f._id, "IDEA_PRESENTED", `A new idea is available for funding review: ${idea.title}`, { ideaId: idea._id })));
    const populated = await Idea.findById(idea._id).populate("innovatorId", "name email phone imageUrl").populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } }).populate("assignedReviewerIds", "name email specialization");
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error("present idea error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/reviewer/ideas", requireAuth, requireRole("reviewer"), async (req, res) => {
  const ideas = await Idea.find({ assignedReviewerIds: req.auth.id }).sort({ createdAt: -1 }).populate("innovatorId", "name email phone imageUrl").populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } });
  return res.json({ success: true, ideas: ideas.map(buildIdeaResponse) });
});

app.post("/reviewer/ideas/:id/evaluation", requireAuth, requireRole("reviewer"), async (req, res) => {
  try {
    const { score, comments, decision } = req.body;
    if (typeof score === "undefined") return res.status(400).json({ success: false, msg: "score is required" });
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: "Idea not found" });
    const assigned = idea.assignedReviewerIds.some((id) => String(id) === String(req.auth.id));
    if (!assigned) return res.status(403).json({ success: false, msg: "Idea not assigned to you" });

    const normalizedDecision = decision === "changes_requested" ? "changes_requested" : "accepted";
    let evaluation = await Evaluation.findOne({ ideaId: idea._id, reviewerId: req.auth.id });
    if (evaluation) {
      evaluation.score = Number(score);
      evaluation.decision = normalizedDecision;
      evaluation.comments = comments || "";
      await evaluation.save();
    } else {
      evaluation = await Evaluation.create({ ideaId: idea._id, reviewerId: req.auth.id, score: Number(score), decision: normalizedDecision, comments: comments || "" });
      if (!idea.evaluationIds.some((id) => String(id) === String(evaluation._id))) idea.evaluationIds.push(evaluation._id);
    }

    idea.status = normalizedDecision === "changes_requested" ? "reviewer_changes_requested" : "reviewer_approved";
    await idea.save();

    await notifyAllAdmins(
      normalizedDecision === "changes_requested" ? "REVIEWER_CHANGES_REQUESTED" : "REVIEWER_ACCEPTED",
      normalizedDecision === "changes_requested"
        ? `Reviewer requested changes for idea: ${idea.title}`
        : `Reviewer accepted idea: ${idea.title}`,
      { ideaId: idea._id, reviewerId: req.auth.id, decision: normalizedDecision }
    );

    const populated = await Idea.findById(idea._id).populate("innovatorId", "name email phone imageUrl").populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } }).populate("assignedReviewerIds", "name email specialization");
    return res.json({ success: true, idea: buildIdeaResponse(populated), evaluation });
  } catch (e) {
    console.error("submit evaluation error", e);
    return res.status(500).json({ success: false, msg: e.code === 11000 ? "You already reviewed this idea" : "Server error" });
  }
});

app.get("/funder/ideas", requireAuth, requireRole("funder"), async (req, res) => {
  const ideas = await Idea.find({ status: { $in: ["presented_to_funders", "funding_pending", "in_progress", "resolved"] } })
    .sort({ createdAt: -1 })
    .populate("innovatorId", "name email phone imageUrl")
    .populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } })
    .populate("assignedReviewerIds", "name email specialization")
    .populate("contractId");
  return res.json({ success: true, ideas: ideas.map(buildIdeaResponse) });
});

app.patch("/funder/ideas/:id/status", requireAuth, requireRole("funder"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["funding_pending", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid funder status" });
    }
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: "Idea not found" });
    idea.status = status;
    idea.lastUpdatedByFunderId = req.auth.id;
    await idea.save();
    await createNotification(idea.innovatorId, "FUNDING_STATUS", `Funding status updated for \"${idea.title}\": ${status}`, { ideaId: idea._id, status });
    if (status === "resolved") {
      const exists = await Certificate.findOne({ userId: idea.innovatorId, ideaId: idea._id, type: "IDEA_COMPLETION" });
      if (!exists) await Certificate.create({ userId: idea.innovatorId, ideaId: idea._id, type: "IDEA_COMPLETION" });
    }
    const populated = await Idea.findById(idea._id).populate("innovatorId", "name email phone imageUrl").populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } }).populate("assignedReviewerIds", "name email specialization").populate("contractId");
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error("funder update status error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

//event
app.post("/events", requireAuth, requireRole("admin"), upload.single("image"), async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, capacity } = req.body;
    if (!title || !startDate || !endDate) return res.status(400).json({ success: false, msg: "title, startDate, endDate are required" });
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const event = await Event.create({ title, description, startDate, endDate, location, imageUrl, capacity: Number(capacity || 0), createdByAdminId: req.auth.id });
    return res.status(201).json({ success: true, event: buildEventResponse(event) });
  } catch (e) {
    console.error("create event error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/events", async (req, res) => {
  try {
    const { q = "", year = "all", month = "all", sort = "date_asc" } = req.query;
    let events = await Event.find().sort({ startDate: 1 });
    if (q) {
      const regex = new RegExp(q, "i");
      events = events.filter((e) => regex.test(e.title) || regex.test(e.description) || regex.test(e.location));
    }
    if (year !== "all") events = events.filter((e) => new Date(e.startDate).getFullYear() === Number(year));
    if (month !== "all") events = events.filter((e) => new Date(e.startDate).getMonth() + 1 === Number(month));
    if (sort === "title_asc") events.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "title_desc") events.sort((a, b) => b.title.localeCompare(a.title));
    if (sort === "date_desc") events.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    return res.json({ success: true, events: events.map(buildEventResponse) });
  } catch (e) {
    console.error("get events error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.patch("/events/:id", requireAuth, requireRole("admin"), upload.single("image"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, msg: "Event not found" });
    ["title", "description", "startDate", "endDate", "location", "capacity"].forEach((field) => {
      if (typeof req.body[field] !== "undefined") event[field] = field === "capacity" ? Number(req.body[field] || 0) : req.body[field];
    });
    if (req.file) event.imageUrl = `/uploads/${req.file.filename}`;
    await event.save();
    return res.json({ success: true, event: buildEventResponse(event) });
  } catch (e) {
    console.error("update event error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.delete("/events/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  return res.json({ success: true, msg: "Event deleted" });
});

app.post("/events/:id/register", requireAuth, requireRole("innovator", "funder"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, msg: "Event not found" });
    const already = event.registrations.some((r) => String(r.userId) === String(req.auth.id));
    if (already) return res.status(400).json({ success: false, msg: "Already registered" });
    if (event.capacity > 0 && event.registrations.length >= event.capacity) {
      return res.status(400).json({ success: false, msg: "Event is full" });
    }
    event.registrations.push({ userId: req.auth.id });
    await event.save();
    const exists = await Certificate.findOne({ userId: req.auth.id, eventId: event._id, type: "EVENT_PARTICIPATION" });
    if (!exists) await Certificate.create({ userId: req.auth.id, eventId: event._id, type: "EVENT_PARTICIPATION" });
    await createNotification(req.auth.id, "EVENT_REGISTERED", `You registered for event: ${event.title}`, { eventId: event._id });
    return res.json({ success: true, event: buildEventResponse(event) });
  } catch (e) {
    console.error("register event error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

// feedback
app.post("/feedback", requireAuth, requireRole("innovator", "funder", "reviewer"), async (req, res) => {
  try {
    const { message, rating } = req.body;
    if (!message) return res.status(400).json({ success: false, msg: "message is required" });
    const feedback = await Feedback.create({ userId: req.auth.id, role: req.auth.role, message, rating: rating ? Number(rating) : null });
    return res.status(201).json({ success: true, feedback });
  } catch (e) {
    console.error("feedback error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/admin/feedback/summary", requireAuth, requireRole("admin"), async (req, res) => {
  const feedback = await Feedback.find().sort({ createdAt: -1 }).populate("userId", "name email role");
  const avg = feedback.length ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length : 0;
  return res.json({ success: true, averageRating: Number(avg.toFixed(2)), total: feedback.length, feedback });
});

// REPORT
app.get("/reports/admin", requireAuth, requireRole("admin"), async (req, res) => {
  const [users, ideas, events, feedback, contracts, programs] = await Promise.all([
    User.find(),
    Idea.find(),
    Event.find(),
    Feedback.find(),
    Contract.find(),
    FundingProgram.find(),
  ]);
  const ideaStatusBreakdown = IDEA_STATUSES.reduce((acc, s) => ({ ...acc, [s]: ideas.filter((i) => i.status === s).length }), {});
  const userRoleBreakdown = ["innovator", "funder", "reviewer"].reduce((acc, role) => ({ ...acc, [role]: users.filter((u) => u.role === role).length }), {});
  const monthlyEventCount = events.reduce((acc, e) => {
    const key = new Date(e.startDate).toISOString().slice(0, 7);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      activeFunders: users.filter((u) => u.role === "funder" && u.status === "active").length,
      totalIdeas: ideas.length,
      totalEvents: events.length,
      totalFeedback: feedback.length,
      totalContracts: contracts.length,
      totalFundingPrograms: programs.length,
      userRoleBreakdown,
      ideaStatusBreakdown,
      monthlyEventCount,
    },
  });
});

app.get("/reports/funder", requireAuth, requireRole("funder", "admin"), async (req, res) => {
  const ideas = await Idea.find({ status: { $in: ["presented_to_funders", "funding_pending", "in_progress", "resolved"] } }).populate("innovatorId", "name email phone imageUrl");
  return res.json({
    success: true,
    stats: {
      visibleIdeas: ideas.length,
      pendingIdeas: ideas.filter((i) => i.status === "funding_pending").length,
      inProgressIdeas: ideas.filter((i) => i.status === "in_progress").length,
      resolvedIdeas: ideas.filter((i) => i.status === "resolved").length,
      ideas: ideas.map(buildIdeaResponse),
    },
  });
});

// FUNDING PROGRAMS + CONTRACTS 
app.post("/funding-programs", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, budget, deadline, criteria, active } = req.body;
    if (!name) return res.status(400).json({ success: false, msg: "name is required" });
    const program = await FundingProgram.create({ name, budget: Number(budget || 0), deadline: deadline || null, criteria: criteria || "", active: typeof active === "boolean" ? active : true, createdByAdminId: req.auth.id });
    return res.status(201).json({ success: true, program });
  } catch (e) {
    console.error("create funding program error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});
app.get("/funding-programs", requireAuth, async (req, res) => {
  const programs = await FundingProgram.find().sort({ createdAt: -1 });
  return res.json({ success: true, programs });
});
app.patch("/funding-programs/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const program = await FundingProgram.findById(req.params.id);
  if (!program) return res.status(404).json({ success: false, msg: "Funding program not found" });
  ["name", "criteria", "deadline", "active"].forEach((field) => {
    if (typeof req.body[field] !== "undefined") program[field] = req.body[field];
  });
  if (typeof req.body.budget !== "undefined") program.budget = Number(req.body.budget || 0);
  await program.save();
  return res.json({ success: true, program });
});

app.post("/contracts", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { ideaId, funderId, programId, contractUrl, status } = req.body;
    if (!ideaId || !funderId) return res.status(400).json({ success: false, msg: "ideaId and funderId are required" });
    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).json({ success: false, msg: "Idea not found" });
    const contract = await Contract.create({ ideaId, funderId, programId: programId || null, issuedByAdminId: req.auth.id, contractUrl: contractUrl || "", status: CONTRACT_STATUSES.includes(status) ? status : "Drafted" });
    idea.contractId = contract._id;
    if (idea.status === "presented_to_funders") idea.status = "funding_pending";
    await idea.save();
    await createNotification(funderId, "CONTRACT_ISSUED", `A contract was issued for idea ${idea.title}`, { ideaId, contractId: contract._id });
    return res.status(201).json({ success: true, contract });
  } catch (e) {
    console.error("create contract error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/contracts", requireAuth, async (req, res) => {
  const filter = {};
  if (req.auth.role === "funder") filter.funderId = req.auth.id;
  const contracts = await Contract.find(filter).sort({ createdAt: -1 }).populate("ideaId").populate("funderId", "name email").populate("programId");
  return res.json({ success: true, contracts });
});

app.patch("/contracts/:id/status", requireAuth, requireRole("admin", "funder"), async (req, res) => {
  const { status } = req.body;
  if (!CONTRACT_STATUSES.includes(status)) return res.status(400).json({ success: false, msg: "Invalid contract status" });
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ success: false, msg: "Contract not found" });
  if (req.auth.role === "funder" && String(contract.funderId) !== String(req.auth.id)) {
    return res.status(403).json({ success: false, msg: "Forbidden" });
  }
  contract.status = status;
  await contract.save();
  return res.json({ success: true, contract });
});

// certificets
app.get("/certificates", requireAuth, async (req, res) => {
  const filter = req.auth.role === "admin" ? {} : { userId: req.auth.id };
  const certificates = await Certificate.find(filter).sort({ createdAt: -1 }).populate("eventId", "title").populate("ideaId", "title");
  return res.json({ success: true, certificates });
});

// notification 
app.get("/notifications", requireAuth, async (req, res) => {
  const notifications = await Notification.find({ userId: req.auth.id }).sort({ createdAt: -1 }).limit(200);
  return res.json({ success: true, notifications });
});
app.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const n = await Notification.findOne({ _id: req.params.id, userId: req.auth.id });
  if (!n) return res.status(404).json({ success: false, msg: "Not found" });
  n.read = true;
  await n.save();
  return res.json({ success: true });
});

// UPLOAD ERRORS 
app.use((err, req, res, next) => {
  if (err?.message?.includes("Only image and PDF files")) {
    return res.status(400).json({ success: false, msg: "Only image and PDF files are allowed" });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, msg: "File is too large (max 5MB)" });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
