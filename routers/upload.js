const config = require('config')
const express = require('express')
const PriceModel = require('../models/priceModel')
const router = express.Router()
const multer = require('multer')
const limits = {fileSize: 1024 * 1024 * 10}

const storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, './uploads/')
  },
  filename: function (request, file, callback) {
    callback(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({storage: storage, limits: limits})

router.post('/', upload.single('doc'), async function (req, res, next) {
  try {
    if (req.file) {
      let priceModel = new PriceModel({
        email: req.body.email,
        name: req.body.name,
        fileName: req.file.filename
      })
      await priceModel.save()
      res.json({response: {result: true}})
    } else {
      res.json({response: {result: false}})
    }
  } catch (e) {
    res.json({response: {error: e.message}})
  }
})

module.exports = router
