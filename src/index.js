import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import adminRouter from "./routes/admin.routes.js";
import librarianRouter from "./routes/librarian.routes.js";
import studentRouter from "./routes/student.routes.js";
import Admin from "./models/admin.model.js"; 

dotenv.config({ path: "./src/.env" });

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let frontend = process.env.FRONTEND_URL;
console.log("Allowed Frontend:", frontend);

app.use(
  cors({
    origin: frontend,
    credentials: true,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// ✅ Handle Preflight Requests
app.options("*", cors());

// ✅ Routes
app.get("/", (req, res) => {
  res.json({ message: "Server Connected and working properly 🚀" });
});
app.use("/api/admin", adminRouter);
app.use("/api/librarian", librarianRouter);
app.use("/api/student", studentRouter);

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ✅ Create Dummy Admin (if needed)
const createDummyAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ email: "admin@example.com" });

    if (!existingAdmin) {
      const newAdmin = new Admin({
        fullName: "Super Admin",
        email: "admin@example.com",
        password: "admin123", 
      });

      await newAdmin.save();
      console.log("✅ Dummy Admin Created Successfully");
    } else {
      console.log("✅ Admin already exists, skipping dummy admin creation");
    }
  } catch (error) {
    console.error("❌ Error creating dummy admin:", error);
  }
};

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
  console.log(`🚀 Server Started on port ${PORT}`);
  await connectDB();
  await createDummyAdmin();
});
