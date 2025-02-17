import express from "express";
import { studentLogin, getStudentProfile, getIssuedBooks, getStudentHistory } from "../controllers/student.controller.js";
import studentAuthMiddleware from "../middleware/student.middleware.js";

const router = express.Router();

router.post("/login", studentLogin);
router.get("/profile", studentAuthMiddleware, getStudentProfile);
router.get("/issued-books", studentAuthMiddleware, getIssuedBooks);
router.get("/history", studentAuthMiddleware, getStudentHistory);

export default router;
