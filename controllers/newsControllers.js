const { formidable } = require("formidable");
const cloudinary = require("cloudinary").v2;
const newsModel = require("../models/newsModel");
const authModel = require("../models/authModel");
const galleryModel = require("../models/galleryModel");
const {
  mongo: { ObjectId },
} = require("mongoose");
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
        return res
          .status(400)
          .json({ message: "Please provide all required fields" });
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

  // update a news
  update_news = async (req, res) => {
    const { news_id } = req.params;
    const form = formidable({});

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
      secure: true,
    });

    try {
      // Parse the form data
      const [fields, files] = await form.parse(req);
      const { title, description, old_image } = fields;
      let imageUrl = old_image[0];

      // If a new image is uploaded
      if (files.new_image) {
        // Extract the old image filename and delete it from Cloudinary
        const splitImageUrl = imageUrl.split("/");
        const imageFileName =
          splitImageUrl[splitImageUrl.length - 1].split(".")[0];
        await cloudinary.uploader.destroy(imageFileName, function(result) { console.log(result) });

        // Upload the new image to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(
          files.new_image[0].filepath,
          { folder: "news_images" }
        );
        imageUrl = uploadResult.url;
      }

      // Update the news document in the database
      const updatedNews = await newsModel.findByIdAndUpdate(
        news_id,
        {
          title: title[0].trim(),
          slug: title[0].trim().split(" ").join("-"),
          description: description[0],
          image: imageUrl,
        },
        { new: true }
      );

      return res
        .status(200)
        .json({ message: "News updated successfully", news: updatedNews });
    } catch (error) {
      console.error("Error updating news:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Get all news
  get_dashboard_news = async (req, res) => {
    const { id, role } = req.userInfo;
    try {
      let news =
        role === "admin"
          ? await newsModel.find().sort({ createdAt: -1 })
          : await newsModel
              .find({ writerId: new ObjectId(id) })
              .sort({ createdAt: -1 });
      return res.status(200).json({ news });
    } catch (error) {
      // console.log(error)
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Get a news by id
  get_news_by_id = async (req, res) => {
    const { news_id } = req.params;
    try {
      const news = await newsModel.findById(news_id);
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

  get_images = async (req, res) => {
    const { id, role } = req.userInfo;

    try {
      const images = await galleryModel
        .find({ writerId: new ObjectId(id) })
        .sort({ createdAt: -1 });
      return res.status(201).json({ images });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Add images to gallery
  add_images = async (req, res) => {
    const form = formidable({});
    const { id } = req.userInfo;

    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
      secure: true,
    });

    try {
      const [_, files] = await form.parse(req);
      let allImages = [];
      const { images } = files;

      for (let i = 0; i < images.length; i++) {
        const { url } = await cloudinary.uploader.upload(images[i].filepath, {
          folder: "news_images",
        });
        allImages.push({ writerId: id, url });
      }

      const image = await galleryModel.insertMany(allImages);
      return res
        .status(201)
        .json({ images: image, message: "images uplaod success" });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

module.exports = new NewsController();
