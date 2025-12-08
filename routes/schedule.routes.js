const express = require("express");
const router = express.Router();
const controller = require("../controllers/schedule.controller");
const auth = require("../middleware/authJwt");

router.get("/", auth.verifyToken, controller.getAll);
router.get("/my", auth.verifyToken, controller.getMySchedules);
router.get("/student/my", auth.verifyToken, controller.getStudentSchedules); 
router.get("/:id", auth.verifyToken, controller.getOne);
router.post("/", auth.verifyToken, controller.create);
router.put("/:id", auth.verifyToken, controller.update);
router.delete("/:id", auth.verifyToken, controller.delete);

module.exports = router;
