import express from "express";
import multer from "multer";
import { getCurrentUser, editProfile } from "../controllers/user.controller.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import { getOtherUsers } from "../controllers/user.controller.js";

const userRouter = express.Router();
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.get("/others", isAuth, getOtherUsers);

// Wrap upload in error handler so multer fileFilter rejections return 400 not 500
userRouter.put("/profile", isAuth, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, editProfile);

export default userRouter;
