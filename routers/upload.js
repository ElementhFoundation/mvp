const config = require('config')
const express = require('express')
const router = express.Router()
const multer = require('multer')
const limits = {fileSize: 1024 * 1024 * 10}
const upload = multer({dest: 'uploads/', limits: limits})

router.post('/', upload.single('doc'), function (req, res, next) {
  if (req.file) {
    res.json({response: {result: true}})
  } else {
    res.json({response: {result: false}})
  }
})

module.exports = router
