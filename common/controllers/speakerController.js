const Speaker = require("../models/Speaker");

exports.createSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.create(req.body);

    res.status(201).json(speaker);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.getSpeakers = async (req, res) => {
  try {
    const speakers = await Speaker.find();

    res.json(speakers);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.updateSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.json(speaker);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.deleteSpeaker = async (req, res) => {
  try {
    await Speaker.findByIdAndDelete(req.params.id);

    res.json({
      message: "Palestrante removido",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};