import express from "express";
import {
  registerLibrarian,
  getAllLibrarians,
  getAllStudents,
  getAllBooks,
  checkServerHealth,
  login
} from "../controllers/admin.controller.js";
import adminAuthMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

router.post('/login',login);
router.post("/register-librarian", adminAuthMiddleware, registerLibrarian);
router.get("/librarians", adminAuthMiddleware, getAllLibrarians);
router.get("/students", adminAuthMiddleware, getAllStudents);
router.get("/books", adminAuthMiddleware, getAllBooks);
router.get("/health",adminAuthMiddleware, checkServerHealth);

export default router;
