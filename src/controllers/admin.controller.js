import Admin from "../models/admin.model.js";
import Librarian from "../models/librarian.model.js";
import Student from "../models/student.models.js";
import Book from "../models/book.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * @desc Register a new librarian
 * @route POST /admin/register-librarian
 */

export const login = async (req,res) => {
    try {
        const {email ,password } = req.body;
        if(!email||!password)
        {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
         // Find student by fileNo
            const admin = await Admin.findOne({ email });
            if (!admin) {
              return res.status(404).json({ success: false, message: "Invailed username or password" });
            }
            console.log(admin);
            // Check password (assuming password is hashed in DB)
            const isMatch = await bcrypt.compare(password, admin.password);
            console.log(isMatch)
            if (!isMatch) {
              return res.status(400).json({ success: false, message: "Invailed username or password" });
            }
        
            // Generate JWT token
            const token =  await jwt.sign({ id: admin._id, type: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
            res.cookie("jwt", token, {
                maxAge: 3 * 24 * 60 * 60 * 1000,
                httpOnly: true, //prevent XSS attack (Cross Site Scripting)
                sameSite: "none", // CSRF attack Cross Site request Forgery attack
                secure: process.env.NODE_MODE !== "development",
              });
        
            res.status(200).json({ success: true, message: "Login successful" ,type:"admin",token});
    } catch (error) {
        
    }
    
}
export const registerLibrarian = async (req, res) => {
  try {
    const { name, email, password , mobile,libraryName} = req.body;


    console.log(req)
    console.log(name,email,password,mobile,libraryName)
    // Validate input
    if (!name || !email || !password||!mobile||!libraryName) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if librarian already exists
    const existingLibrarian = await Librarian.findOne({ email });
    if (existingLibrarian) {
      return res.status(400).json({ success: false, message: "Librarian with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create librarian
    const librarian = new Librarian({ name, email, password: hashedPassword ,mobile,libraryName,isApproved:true});
    await librarian.save();

    res.status(201).json({ success: true, message: "Librarian registered successfully", librarian });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * @desc Get all librarians
 * @route GET /admin/librarians
 */
export const getAllLibrarians = async (req, res) => {
  try {
    const librarians = await Librarian.find().select("-password"); // Exclude password

    res.status(200).json({ success: true, librarians });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * @desc Get all students
 * @route GET /admin/students
 */
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select("-password"); // Exclude password

    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * @desc Get all books
 * @route GET /admin/books
 */
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();

    res.status(200).json({ success: true, books });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * @desc Check server health
 * @route GET /admin/health
 */
export const checkServerHealth = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Server is running smoothly",
      uptime: process.uptime(),
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
