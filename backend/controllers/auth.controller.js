import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";

// Shared cookie options — works for localhost (cross-port) without HTTPS
// sameSite "Lax" allows cross-port on same hostname, no secure flag needed in dev
const cookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: "Lax",
  secure: false,
};

export const signUp = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (await User.findOne({ userName }))
      return res.status(400).json({ message: "Username already exists" });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already exists" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ userName, email, password: hashPassword });

    const token = await genToken(user._id);
    res.cookie("token", token, cookieOptions);

    const { password: _, ...safeUser } = user.toObject();
    return res.status(201).json(safeUser);
  } catch (error) {
    return res.status(500).json({ message: `signUp error: ${error}` });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect password" });

    const token = await genToken(user._id);
    res.cookie("token", token, cookieOptions);

    const { password: _, ...safeUser } = user.toObject();
    return res.status(200).json(safeUser);
  } catch (error) {
    return res.status(500).json({ message: `login error: ${error}` });
  }
};

export const logOut = async (req, res) => {
  try {
    // Must match the same options used when setting the cookie
    res.clearCookie("token", { httpOnly: true, sameSite: "Lax", secure: false });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: `logout error: ${error}` });
  }
};
