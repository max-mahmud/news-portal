const router = require("express").Router();
const newsControllers = require("../controllers/newsControllers");
const { auth, role } = require("../middleware/middleware");

// Dashboard Routes
router.post("/api/news/add", auth, newsControllers.add_news);
router.put("/api/news/update/:news_id", auth, newsControllers.update_news);
router.put('/api/news/status-update/:news_id', auth, newsControllers.update_news_status)

router.get("/api/images", auth, newsControllers.get_images);
router.post("/api/images/add", auth, newsControllers.add_images);

router.get("/api/news", auth, newsControllers.get_dashboard_news);
router.get("/api/news/:news_id", auth, newsControllers.get_news_by_id);
// router.delete("/api/news/delete/:id", newsControllers.delete_news_by_id);

// Web Routes
router.get('/api/all/news',newsControllers.get_all_news)
router.get('/api/category/all',newsControllers.get_categories)

router.get('/api/popular/news',newsControllers.get_popular_news)
router.get('/api/news/details/:slug',newsControllers.get_news)

router.get('/api/latest/news',newsControllers.get_latest_news)
router.get('/api/images/news',newsControllers.get_images)
router.get('/api/recent/news',newsControllers.get_recent_news)

router.get('/api/category/news/:category', newsControllers.get_category_news)
router.get('/api/search/news', newsControllers.news_search)

module.exports = router;
