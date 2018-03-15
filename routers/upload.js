const config = require('config')
const express = require('express')
const router = express.Router()
const multer = require('multer')
const limits = { fileSize: 1024 * 1024 * 10 }
const upload = multer({dest: 'uploads/', limits: limits})

router.post('/', upload.single('document'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  res.json({response: {result: true}})
})

module.exports = router
