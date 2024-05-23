const router = require("express").Router();
const newsControllers = require("../controllers/newsControllers");
const { auth, role } = require("../middleware/middleware");

router.post('/api/news/add', auth, newsControllers.add_news)
router.get('/api/news/get', newsControllers.get_news)

router.delete('/api/news/delete/:id', newsControllers.delete_news_by_id)


module.exports = router