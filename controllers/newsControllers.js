const { formidable } = require("formidable");
const cloudinary = require("cloudinary").v2;
const newsModel = require("../models/newsModel");
const authModel = require("../models/authModel");
const moment = require("moment");

class NewsController {
  // Add a new news
  add_news = async (req, res) => {
    // Extract user info from request body
    const { id, category, name } = req.userInfo;
    // Set formidable configuration
    const form = formidable({});
    // Set cloudinary configuration
    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
      secure: true,
    });

    try {
      // Parse form data
      const [fields, files] = await form.parse(req);

      // Extract form fields
      const { title, description } = fields;

      // Check if required fields are present
      if (!title || !description || !files.image[0].filepath) {
        return res.status(400).json({ message: "Please provide all required fields" });
      }

      // Upload image to cloudinary and get the URL
      const { url } = await cloudinary.uploader.upload(
        files.image[0].filepath,
        { folder: "news_images" }
      );

      // Create a new news object
      const news = await newsModel.create({
        writerId: id,
        title: title[0].trim(),
        slug: title[0].trim().split(" ").join("-"),
        category,
        description: description[0],
        date: moment().format("LL"),
        writerName: name,
        image: url,
      });

      return res.status(201).json({ message: "news add success", news });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Get all news
  get_news = async (req, res) => {
    try {
      const news = await newsModel.find();
      return res.status(200).json({ news });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Get a news by id
  get_news_by_id = async (req, res) => {
    const { id } = req.params;
    try {
      const news = await newsModel.findById(id);
      return res.status(200).json({ news });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Delete a news by id
  delete_news_by_id = async (req, res) => {
    const { id } = req.params;
    try {
      const news = await newsModel.findByIdAndDelete(id);
      return res.status(200).json({ message: "deleted success", news });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

module.exports = new NewsController();
