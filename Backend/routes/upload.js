const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const Media = require('../models/Media');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/', upload.fields([{ name: 'thumbnail' }, { name: 'video' }]), async (req, res) => {
  const { title, description } = req.body;

  try {
    const thumbnailPath = req.files.thumbnail[0].path;
    const videoPath = req.files.video[0].path;

    const thumbnailResult = await cloudinary.uploader.upload(thumbnailPath, {
      resource_type: 'image',
    });

    const videoResult = await cloudinary.uploader.upload(videoPath, {
      resource_type: 'video',
    });

    const newMedia = new Media({
      title,
      description,
      thumbnailUrl: thumbnailResult.secure_url,
      videoUrl: videoResult.secure_url,
    });

    await newMedia.save();

    fs.unlinkSync(thumbnailPath);
    fs.unlinkSync(videoPath);

    res.json(newMedia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const media = await Media.find();
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
