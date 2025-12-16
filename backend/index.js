import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Admin from "./models/Admin.js";
import { sendEmail } from "./utils/sendEmail.js";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

//connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err.message));

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

function buildUserResponse(u) {
  if (!u) return null;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone || "",
    birthday: u.birthday || "",
  };
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.get("/", (req, res) => {
  res.send("SparkUp Auth API running");
});

// register
app.post("/userRegister", async (req, res) => {
  try {
    const { name, email, password, role, phone, birthday } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (/^[0-9]/.test(email)) {
      return res.status(400).json({ msg: "Email cannot start with a number" });
    }

    if (!["innovator", "funder"].includes(role)) {
      return res.status(400).json({ msg: "Role must be innovator or funder" });
    }

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      phone,
      birthday,
    });

    return res.status(201).json({
      msg: "Registration Success",
      user: buildUserResponse(newUser),
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ msg: "Server Error" });
  }
});

app.post("/adminRegister", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const exist = await Admin.findOne({ email });
    if (exist) {
      return res.status(400).json({ msg: "Admin email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email,
      passwordHash,
    });

    return res.status(201).json({
      msg: "Admin created",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin register error:", err);
    return res.status(500).json({ msg: "Server Error" });
  }
});

app.post("/userLogin", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.json({
        serverMsg: "All fields are required",
        loginStatus: false,
      });
    }

    let account = null;

    //admin login
    if (role === "admin") {
      account = await Admin.findOne({ email });
      if (!account) {
        return res.json({
          serverMsg: "Admin not found",
          loginStatus: false,
        });
      }
    } else {
      //users login --(funder/innovater)
      account = await User.findOne({ email });
      if (!account) {
        return res.json({
          serverMsg: "User not found",
          loginStatus: false,
        });
      }
    }

    const isMatch = await bcrypt.compare(password, account.passwordHash);
    if (!isMatch) {
      return res.json({
        serverMsg: "Incorrect password",
        loginStatus: false,
      });
    }

    const token = jwt.sign(
      { id: account._id, role: account.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const responseUser =
      role === "admin"
        ? {
            _id: account._id,
            name: account.name,
            email: account.email,
            role: account.role,
          }
        : buildUserResponse(account);

    return res.json({
      serverMsg: "Login Success",
      loginStatus: true,
      token,
      user: responseUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.json({ serverMsg: "Server Error", loginStatus: false });
  }
});

//FORGET PASSWORD (UPDATED VALIDATION)
app.post("/auth/forgot-password", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res
        .status(400)
        .json({ success: false, msg: "Email is required" });
    }

    console.log("FORGOT-PASSWORD called with email:", email);

    //search admin then user
    let account = await Admin.findOne({ email });
    if (!account) {
      account = await User.findOne({ email });
    }

    // if email NOT found → return error + DO NOT send code
    if (!account) {
      return res
        .status(404)
        .json({ success: false, msg: "Email does not exist" });
    }

    //if exists → generate + store + send
    const code = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    account.resetCode = code;
    account.resetCodeExpiry = expiry;
    await account.save();

    console.log("Reset code for", email, "=", code);

    await sendEmail({
      to: email,
      subject: "SparkUp Password Reset Code",
      text: `Your SparkUp password reset code is: ${code}`,
      html: `<p>Your SparkUp password reset code is:</p><h2>${code}</h2><p>This code will expire in 10 minutes.</p>`,
    });

    return res.json({
      success: true,
      msg: "Confirmation code sent to your email.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res
      .status(500)
      .json({ success: false, msg: "Server error sending code" });
  }
});

// varivecation
app.post("/auth/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ success: false, msg: "Email and code are required" });
    }

    let account = await Admin.findOne({ email });
    if (!account) {
      account = await User.findOne({ email });
    }

    if (
      !account ||
      !account.resetCode ||
      !account.resetCodeExpiry ||
      account.resetCode !== code ||
      account.resetCodeExpiry < new Date()
    ) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid or expired code" });
    }

    return res.json({ success: true, msg: "Code verified" });
  } catch (err) {
    console.error("Verify code error:", err);
    return res
      .status(500)
      .json({ success: false, msg: "Server error verifying code" });
  }
});

//reset pass
app.post("/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        msg: "Email, code and new password are required",
      });
    }

    let account = await Admin.findOne({ email });
    let isAdmin = true;

    if (!account) {
      account = await User.findOne({ email });
      isAdmin = false;
    }

    if (
      !account ||
      !account.resetCode ||
      !account.resetCodeExpiry ||
      account.resetCode !== code ||
      account.resetCodeExpiry < new Date()
    ) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid or expired code" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    account.passwordHash = passwordHash;
    account.resetCode = undefined;
    account.resetCodeExpiry = undefined;
    await account.save();

    return res.json({
      success: true,
      msg: "Password has been updated successfully.",
      role: isAdmin ? "admin" : account.role,
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res
      .status(500)
      .json({ success: false, msg: "Server error resetting password" });
  }
});

//change pass
app.post("/auth/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        msg: "Email, current password and new password are required",
      });
    }

    let account = await Admin.findOne({ email });
    let accountType = "admin";

    if (!account) {
      account = await User.findOne({ email });
      accountType = "user";
    }

    if (!account) {
      return res
        .status(404)
        .json({ success: false, msg: "Account not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, msg: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    account.passwordHash = passwordHash;
    await account.save();

    return res.json({
      success: true,
      msg: "Password updated successfully",
      accountType,
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res
      .status(500)
      .json({ success: false, msg: "Server error changing password" });
  }
});

app.post("/resetPassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.json({ success: false, msg: "Email and new password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    return res.json({ success: true, msg: "Password updated" });
  } catch (err) {
    console.error("Simple resetPassword error:", err);
    return res.json({ success: false, msg: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
