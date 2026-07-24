import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Added missing jwt import for the refresh token endpoint
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";


export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // Destructured role to allow role assignment if provided
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();
    
    if (!trimmedName || !trimmedEmail || !trimmedPassword ||
        typeof trimmedName !== "string" || typeof trimmedEmail !== "string" || typeof trimmedPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }
    if (trimmedPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }
    
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with Email already exists.",
      });
    }
    
    // FIX 1: REMOVED manual bcrypt.hash here. 
    // Your User.js model handles hashing on .pre('save'). Passing text prevents double-hashing.
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword, 
      role: role || "user" // Sets default role if none passed in body
    });
    
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Login
// ==============================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    } 
    
    // FIX 2: Explicitly select("+password") because the User schema sets select: false on password field.
    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account exist with given mail"
      });
    }
    
    // FIX 3: Using the matchPassword method defined on your User.js schema for clean code consistency
    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }
    
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    
    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;
    
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: userData,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ============================== 
// Google Login
// ==============================
export const googleLoginSuccess = async (req, res) => {
  try {
    // Passport attaches the authenticated database user object straight to req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Google authentication failed."
      });
    }

    const user = req.user;

    // Generate standard system tokens using your existing utility functions
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save the new refresh token to the user document
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // If implementing a full-stack detached architecture (SPA Frontend + API Backend):
    // Option A: Redirect back to your frontend with tokens inside URL parameters
    // const frontendUrl = `http://localhost:5173/oauth-success?token=${accessToken}&refresh=${refreshToken}`;
    // return res.redirect(frontendUrl);

    // Option B: Standard JSON JSON response (Ideal if testing via backend API clients directly)
    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      accessToken,
      refreshToken,
      user: userData,
    });
  } catch (error) {
    console.error("Google Login Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==============================
// Logout
// ==============================
export const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// ==============================
// Refresh Token
// ==============================
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    console.log(refreshToken)
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token does not match.",
      });
    }
    
    // FIX 4: Ensure user.role is passed to generateAccessToken here too so refreshed sessions maintain roles
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
    
    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// Toggle Bookmark (Add or Remove news ID from User document)
export const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newsId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isSaved = user.savedNews.some((id) => id.toString() === newsId);

    if (isSaved) {
      user.savedNews.pull(newsId);
    } else {
      user.savedNews.push(newsId);
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: isSaved ? "Removed from bookmarks." : "Saved to bookmarks.",
      isSaved: !isSaved,
      savedNews: user.savedNews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch User's Saved News Articles
export const getSavedNews = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "savedNews",
      match: { isDeleted: false },
      populate: { path: "author", select: "name avatar" },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      articles: user.savedNews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// Password & Verification Stubs
// ==============================
export const forgotPassword = async (req, res) => {
  try { res.status(200).json({ success: true, message: "Forgot Password API" }); } 
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const resetPassword = async (req, res) => {
  try { res.status(200).json({ success: true, message: "Reset Password API" }); } 
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const verifyEmail = async (req, res) => {
  try { res.status(200).json({ success: true, message: "Email Verified" }); } 
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const resendVerification = async (req, res) => {
  try { res.status(200).json({ success: true, message: "Verification Email Sent" }); } 
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try { res.status(200).json({ success: true, message: "Profile Updated" }); } 
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const changePassword = async (req, res) => {
  try { res.status(200).json({ success: true, message: "Password Changed Successfully" }); } 
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteAccount = async (req, res) => {
  try { res.status(200).json({ success: true, message: "Account Deleted Successfully" }); } 
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
