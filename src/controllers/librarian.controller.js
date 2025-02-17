import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import Student from "../models/student.models.js";
import Librarian from "../models/librarian.model.js";
import Book from "../models/book.models.js";
import mongoose from "mongoose";

/**
 * @desc Librarian Login
 * @route POST /librarian/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Find librarian by email
    const librarian = await Librarian.findOne({ email });
    if (!librarian) {
      return res.status(404).json({ success: false, message: "Invalid username or password" });
    }

    // Check password
    const isMatch = bcrypt.compare(password, librarian.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: librarian._id, type: "librarian" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true, // Prevent XSS attack
      sameSite: "none", // Prevent CSRF attack
      secure: process.env.NODE_MODE !== "development", // Use secure cookies in production
    });

    res.status(200).json({ success: true, message: "Login successful" ,type:"librarian" ,token});

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const profile = async (req, res) => {
  try {
    const librarian = await Librarian.findById( req.librarian._id).select("-password");
    if (!librarian) {
      return res.status(404).json({ success: false, message: "Librarian not found" });
    }
    res.status(200).json({ success: true, librarian });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


export const dashboardData = async (req, res) => {
  try {
    // Count total students
    const totalStudents = await Student.countDocuments();

    // Fetch all books to compute total, issued, and available
    const books = await Book.find();
    let totalBooks = 0;
    let issuedBooks = 0;
    let availableBooks = 0;

    books.forEach((book) => {
      totalBooks += book.books.length;
      book.books.forEach((b) => {
        if (b.issued) {
          issuedBooks++;
        } else {
          availableBooks++;
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalBooks,
        issuedBooks,
        availableBooks,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc Register a new student
 * @route POST /librarian/register-student
 */
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password, fileNo, parentName, mobile, department, branch } = req.body;

    if (!name || !email || !password || !fileNo || !parentName || !mobile || !department || !branch) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    if (!/^\d{5}$/.test(fileNo)) {
      return res.status(400).json({ success: false, message: "File No must be a 5-digit number" });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: "Mobile number must be a valid 10-digit number" });
    }

    const allowedBranches = ["CSE", "ECE", "EE", "Cyber", "Mining", "ME", "Automobile", "Civil"];
    if (!allowedBranches.includes(branch)) {
      return res.status(400).json({ success: false, message: `Branch must be one of: ${allowedBranches.join(", ")}` });
    }

    const existingStudent = await Student.findOne({ fileNo });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: "Student with this File No already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({ name, email, password: hashedPassword, fileNo, parentName, mobile, department, branch });
    await student.save();

    res.status(201).json({ success: true, message: "Student registered successfully", student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * @desc Register a new book
 * @route POST /librarian/register-book
 */
export const registerBook = async (req, res) => {
    try {
      const { title, details, stock, price, course, branch } = req.body;
  
      if (!title || !details || !stock || !price || !course || !branch) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }
  
      if (isNaN(stock) || stock <= 0) {
        return res.status(400).json({ success: false, message: "Stock must be a positive number" });
      }
  
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ success: false, message: "Price must be a positive number" });
      }
  
      const books = [];
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
      for (let i = 0; i < stock; i++) {
        let newBookId;
        let isUnique = false;
  
        while (!isUnique) {
          const randomLetter1 = letters[Math.floor(Math.random() * letters.length)];
          const randomLetter2 = letters[Math.floor(Math.random() * letters.length)];
          const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
          newBookId = `${randomLetter1}${randomLetter2}${randomNumber}`; // Format: AA1234
  
          const existingBook = await Book.findOne({ "books.bookId": newBookId }); // Check uniqueness in DB
          if (!existingBook) isUnique = true;
        }
  
        books.push({
          bookId: newBookId,
          title,
          details,
          price,
          course,
          branch,
          available: true,
        });
      }
  
      const book = new Book({ title, details, stock, price, course, branch, books });
      await book.save();
  
      res.status(201).json({ success: true, message: "Book registered successfully", book });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  };
  export const issueBook = async (req, res) => {
    try {
      const { fileNo, bookIds } = req.body;
  
      if (!fileNo || !Array.isArray(bookIds) || bookIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "InvalidInput",
          message: "File number and an array of book IDs are required." 
        });
      }
  
      // Check if student exists
      const student = await Student.findOne({ fileNo });
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          error: "StudentNotFound", 
          message: "No student found with the given file number." 
        });
      }
  
      let issuedBooks = [];
      let failedBooks = [];
  
      // Fetch books matching any bookId in the array
      const books = await Book.find({ "books.bookId": { $in: bookIds } });
  
      if (!books || books.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: "BooksNotFound",
          message: "No books found matching the provided IDs."
        });
      }
  
      // Create a Set of found book IDs
      const foundBookIds = new Set();
      books.forEach((book) => {
        book.books.forEach((b) => foundBookIds.add(b.bookId));
      });
  
      // Identify missing books
      bookIds.forEach((bookId) => {
        if (!foundBookIds.has(bookId)) {
          failedBooks.push({ bookId, reason: "Book not found" });
        }
      });
  
      // Create a map for quick lookup of available books
      const bookMap = new Map();
      books.forEach((book) => {
        book.books.forEach((b) => {
          if (bookIds.includes(b.bookId) && !b.issued) {
            bookMap.set(b.bookId, { book, bookInstance: b });
          }
        });
      });
  
      for (const bookId of bookIds) {
        if (failedBooks.some((b) => b.bookId === bookId)) continue;
  
        if (bookMap.has(bookId)) {
          const { book, bookInstance } = bookMap.get(bookId);
          bookInstance.issued = true;
          issuedBooks.push(bookId);
          student.issuedBooks.push({ bookId, issuedDate: new Date(), returned: false });
        } else {
          failedBooks.push({ bookId, reason: "Book already issued" });
        }
      }
  
      if (issuedBooks.length === 0) {
        return res.status(400).json({
          success: false,
          error: "NoBooksIssued",
          message: "No books could be issued. All requested books are either unavailable or already issued.",
          failedBooks
        });
      }
  
      // Save changes to student and books
      await Promise.all([student.save(), ...books.map((book) => book.save())]);
  
      res.status(200).json({
        success: true,
        message: "Books processed successfully.",
        issuedBooks,
        failedBooks,
      });
  
    } catch (error) {
      console.error("Error issuing books:", error);
  
      res.status(500).json({ 
        success: false, 
        error: "ServerError", 
        message: "An unexpected error occurred. Please try again later.", 
        details: error.message 
      });
    }
  };
  
  export const returnBook = async (req, res) => {
    try {
      const { fileNo, bookIds } = req.body;
  
      if (!fileNo || !Array.isArray(bookIds) || bookIds.length === 0) {
        return res.status(400).json({ success: false, message: "File Number and at least one Book ID are required." });
      }
  
      // Check if student exists
      const student = await Student.findOne({ fileNo });
      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found." });
      }
  
      let returnedBooks = [];
      let notFoundBooks = [];
  
      for (const bookId of bookIds) {
        const bookIndex = student.issuedBooks.findIndex((b) => b.bookId == bookId && !b.returned);
        if (bookIndex === -1) {
          notFoundBooks.push(bookId);
          continue;
        }
  
        student.issuedBooks[bookIndex].returned = true;
        student.issuedBooks[bookIndex].returnDate = new Date();
        returnedBooks.push(bookId);
      }
  
      await student.save();
  
      if (returnedBooks.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No books found in issued list or already returned.",
          notFoundBooks,
        });
      }
  
      // Update book records
      const books = await Book.find({ "books.bookId": { $in: returnedBooks } });
  
      books.forEach((book) => {
        book.books.forEach((b) => {
          if (returnedBooks.includes(b.bookId.toString())) {
            b.issued = false;
          }
        });
      });
  
      for (const book of books) {
        await book.save();
      }
  
      res.status(200).json({
        success: true,
        message: "Books returned successfully.",
        returnedBooks,
        notFoundBooks,
      });
  
    } catch (error) {
      console.error("Error returning books:", error);
      res.status(500).json({ success: false, message: "Server error. Please try again.", error: error.message });
    }
  };
  
  

export const searchStudents = async (req, res) => {
    try {
      const { fileNo, name, page = 1, limit = 10 } = req.query;
  
      if (!fileNo && !name) {
        return res.status(400).json({ success: false, message: "Provide fileNo or name for search" });
      }
  
      let query = {};
  
      if (fileNo) {
        query.fileNo = fileNo;
      }
      if (name) {
        query.name = new RegExp(name, "i"); // Case-insensitive search
      }
  
      const students = await Student.find(query)
        .select("-password") // Exclude password for security
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
  
      if (!students.length) {
        return res.status(404).json({ success: false, message: "No students found" });
      }
  
      const totalStudents = await Student.countDocuments(query);
  
      res.status(200).json({
        success: true,
        students,
        pagination: {
          totalStudents,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalStudents / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  };
  export const searchBooks = async (req, res) => {
    try {
      const { bookId, title, page = 1, limit = 10 } = req.query;
  
      if (!bookId && !title) {
        return res.status(400).json({ success: false, message: "Provide bookId or title for search" });
      }
  
      let query = {};
  
      if (bookId) {
        query["bookId"] = bookId; // Fixed incorrect query field
      }
      if (title) {
        query["title"] = new RegExp(title, "i"); // Case-insensitive search
      }
  
      const books = await Book.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
  
      if (!books.length) {
        return res.status(404).json({ success: false, message: "No books found" });
      }
  
      const totalBooks = await Book.countDocuments(query);
  
      res.status(200).json({
        success: true,
        books,
        pagination: {
          totalBooks,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBooks / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  };
  