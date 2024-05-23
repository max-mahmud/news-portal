const router = require("express").Router();
const authController = require("../controllers/authControllers");
const { auth, role } = require("../middleware/middleware");

router.post("/api/login", authController.login);
router.post("/api/news/writer/add", auth, role, authController.add_writer);
router.get("/api/news/writers", auth, role, authController.get_writers);


module.exports = router;
