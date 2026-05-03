import User from "../models/user.model.js";
import { broadcastProfileUpdate } from "./message.controller.js";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `getCurrentUser error: ${error}` });
  }
};

export const editProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Build a publicly accessible URL for the saved file
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { image: imageUrl },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Notify all connected clients so their otherUsers list updates in real-time
    broadcastProfileUpdate(req.userId, imageUrl);

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `editProfile error: ${error}` });
  }
};

export const getOtherUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select(
      "-password",
    );
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: `getOtherUsers error: ${error}` });
  }
};

// export const editProfile = async (req, res) => {
//   try {
//     const updateData = {};

//     // Handle optional text fields
//     if (req.body.userName) updateData.userName = req.body.userName;
//     if (req.body.bio) updateData.bio = req.body.bio;

//     // Handle optional image upload
//     if (req.file) {
//       updateData.image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
//     }

//     // Nothing to update?
//     if (Object.keys(updateData).length === 0) {
//       return res.status(400).json({ message: "No data provided to update" });
//     }

//     // Check userName uniqueness if being changed
//     if (updateData.userName) {
//       const existing = await User.findOne({
//         userName: updateData.userName,
//         _id: { $ne: req.userId }, // exclude current user
//       });
//       if (existing) {
//         return res.status(400).json({ message: "Username already taken" });
//       }
//     }

//     const user = await User.findByIdAndUpdate(req.userId, updateData, {
//       new: true,
//       runValidators: true,
//     }).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });

//     return res.status(200).json(user);
//   } catch (error) {
//     console.error("editProfile error:", error); // ← check terminal for exact cause
//     return res
//       .status(500)
//       .json({ message: `editProfile error: ${error.message}` });
//   }
// };
