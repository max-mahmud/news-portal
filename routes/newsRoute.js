const router = require("express").Router();
const newsControllers = require("../controllers/newsControllers");
const { auth, role } = require("../middleware/middleware");

router.post("/api/news/add", auth, newsControllers.add_news);
router.put("/api/news/update/:news_id", auth, newsControllers.update_news);

router.get("/api/images", auth, newsControllers.get_images);
router.post("/api/images/add", auth, newsControllers.add_images);

router.get("/api/news", auth, newsControllers.get_dashboard_news);
router.get("/api/news/:news_id", auth, newsControllers.get_news_by_id);
// router.delete("/api/news/delete/:id", newsControllers.delete_news_by_id);

module.exports = router;
