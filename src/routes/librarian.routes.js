import express from "express";
import { 
  registerStudent, 
  registerBook, 
  issueBook, 
  returnBook, 
  searchStudents, 
  searchBooks ,
  login,
  profile,
  dashboardData
} from "../controllers/librarian.controller.js";
import authMiddleware from "../middleware/librarian.middleware.js";

const router = express.Router();

router.post('/login',login)
router.post("/register-student",authMiddleware, registerStudent);
router.post("/register-book",authMiddleware, registerBook);
router.post("/issue-book",authMiddleware, issueBook);
router.post("/return-book",authMiddleware, returnBook);
router.get("/search-student",authMiddleware, searchStudents);
router.get("/search-book",authMiddleware, searchBooks);
router.get('/profile',authMiddleware, profile);
router.get('/dashboardData',authMiddleware,dashboardData)

export default router;
