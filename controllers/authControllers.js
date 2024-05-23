const authModel = require("../models/authModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class AuthController {
  login = async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide your email" });
    }
    if (!password) {
      return res.status(400).json({ message: "Please provide your password" });
    }

    try {
      const user = await authModel.findOne({ email }).select("+password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const tokenPayload = {
        id: user.id,
        name: user.name,
        category: user.category,
        role: user.role,
      };
      const token = jwt.sign(tokenPayload, process.env.SECRET, {
        expiresIn: process.env.EXP_TIME,
      });

      return res.status(200).json({ message: "Login success", token });
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
  
  add_writer = async (req, res) => {
    const { email, name, password, category } = req.body;

    // Basic input validation
    if (!name || !password || !category || !email) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // Email format validation
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!email.match(emailRegex)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address." });
    }

    try {
      // Check if user with the provided email already exists
      const writer = await authModel.findOne({ email: email.trim() });
      if (writer) {
        return res.status(409).json({ message: "User already exists." });
      } else {
        // Create new writer
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        const new_writer = await authModel.create({
          name: name.trim(),
          email: email.trim(),
          password: hashedPassword,
          category: category.trim(),
          role: "writer",
        });
        return res
          .status(201)
          .json({ message: "Writer added successfully.", writer: new_writer });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  get_writers = async (req, res) => {
    try {
      const writers = await authModel
        .find({ role: "writer" })
        .sort({ createdAt: -1 });
      return res.status(200).json({ writers });
    } catch (error) {
      return res.status(500).json({ message: "internal server error" });
    }
  };
}

module.exports = new AuthController();
