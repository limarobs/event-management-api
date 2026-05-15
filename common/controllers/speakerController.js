const Speaker = require("../models/Speaker");

const createSpeaker = async (req, res) => {

  try {

    const speaker = await Speaker.create(req.body);

    res.status(201).json(speaker);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

const getSpeakers = async (req, res) => {

  try {

    const speakers = await Speaker.findAll();

    res.json(speakers);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

const updateSpeaker = async (req, res) => {

  try {

    const speaker = await Speaker.findByPk(req.params.id);

    if (!speaker) {

      return res.status(404).json({
        error: "Palestrante não encontrado"
      });

    }

    await speaker.update(req.body);

    res.json(speaker);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

const deleteSpeaker = async (req, res) => {

  try {

    const speaker = await Speaker.findByPk(req.params.id);

    if (!speaker) {

      return res.status(404).json({
        error: "Palestrante não encontrado"
      });

    }

    await speaker.destroy();

    res.json({
      message: "Palestrante removido"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

module.exports = {
  createSpeaker,
  getSpeakers,
  updateSpeaker,
  deleteSpeaker
};