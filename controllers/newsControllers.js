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
        await cloudinary.uploader.destroy(imageFileName, function (result) {
          console.log(result);
        });

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

  update_news_status = async (req, res) => {
    const { role } = req.userInfo;
    const { news_id } = req.params;
    const { status } = req.body;

    if (role === "admin") {
      const news = await newsModel.findByIdAndUpdate(
        news_id,
        { status },
        { new: true }
      );
      return res
        .status(200)
        .json({ message: "news status update success", news });
    } else {
      return res.status(401).json({ message: "You cannot access this api" });
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

  // This function fetches all active news, groups them by category,
  get_all_news = async (req, res) => {
    try {
      // The aggregate function is used to perform a series of data processing
      const category_news = await newsModel.aggregate([
        { $match: { status: "active" } },
        { $sort: { createdAt: -1 } },
        // Group the documents by the category field.
        {
          $group: {
            _id: "$category",
            news: {
              // Push each document into the news array.
              $push: {
                _id: "$_id",
                title: "$title",
                slug: "$slug",
                writerName: "$writerName",
                image: "$image",
                description: "$description",
                date: "$date",
                category: "$category",
              },
            },
          },
        },
        // Project the resulting documents to exclude the _id field and rename
        // the category field to _id, and limit the news array to 5 items.
        {
          $project: {
            _id: 0,
            category: "$_id",
            news: { $slice: ["$news", 5] },
          },
        },
      ]);

      // keys are the categories and the values are the arrays of news.
      const news = category_news.reduce((acc, item) => {
        acc[item.category] = item.news;
        return acc;
      }, {});

      return res.status(200).json({ news });
    } catch (error) {
      console.error("Error fetching news:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_categories = async (req, res) => {
    try {
      const categories = await newsModel.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
          },
        },
      ]);
      return res.status(200).json({ categories });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_news = async (req, res) => {
    const { slug } = req.params;

    try {
      const news = await newsModel.findOneAndUpdate(
        { slug },
        {
          $inc: { count: 1 },
        },
        { new: true }
      );

      const relateNews = await newsModel
        .find({
          $and: [
            {
              slug: {
                $ne: slug,
              },
            },
            {
              category: {
                $eq: news.category,
              },
            },
          ],
        })
        .limit(4)
        .sort({ createdAt: -1 });

      return res.status(200).json({ news: news ? news : {}, relateNews });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_popular_news = async (req, res) => {
    try {
      const popularNews = await newsModel
        .find({ status: "active" })
        .sort({ count: -1 })
        .limit(4);
      return res.status(200).json({ popularNews });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  get_latest_news = async (req, res) => {
    try {
      const news = await newsModel
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(6);

      return res.status(200).json({ news });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_images = async (req, res) => {
    try {
      const images = await newsModel
        .aggregate([
          { $match: { status: "active" } },
          { $sample: { size: 9 } },
          { $project: { image: 1 } },
        ])
        .exec();
      return res.status(200).json({ images });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_recent_news = async (req, res) => {
    try {
      const recentNews = await newsModel
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .skip(6)
        .limit(6);
      // console.log(recentNews.length)
      return res.status(200).json({ recentNews });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_category_news = async (req, res) => {
    const { category } = req.params;
    try {
      // * First Method
      // const news = await newsModel.find({ category: category, status: "active" }).limit(5).select({ title: 1, image: 1, _id: 0 });

      // * Second Method
      // const news = await newsModel.aggregate([
      //   { $match: { category: category, status: "active" } },
      //   { $sample: { size: 5 } },
      //   { $project: { _id: 0, title: 1, image: 1 } },
      // ]);

      // * Third Method
      const news = await newsModel
        .find({ $and: [{ category: category }, { status: "active" }] })
        .limit(5)
        .select({ title: 1, image: 1, _id: 0 });

      return res.status(200).json({ news });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  news_search = async (req, res) => {
    const { value } = req.query;
    try {
      const news = await newsModel.find({
        status: "active",
        $text: { $search: value },
      });
      // console.log(news);
      return res.status(200).json({ news });
    } catch (error) {
      console.log(error.message);
    }
  };
}

module.exports = new NewsController();
