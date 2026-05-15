const express = require("express");

const router = express.Router();

const {
  createSpeaker,
  getSpeakers,
  updateSpeaker,
  deleteSpeaker,
} = require("../controllers/speakerController");

router.post("/", createSpeaker);

router.get("/", getSpeakers);

router.put("/:id", updateSpeaker);

router.delete("/:id", deleteSpeaker);

module.exports = router;