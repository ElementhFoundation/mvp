const config = require('config')
const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer({dest: 'uploads/'})

router.post('/', upload.single('document'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  res.json({response: {result: true}})
})

module.exports = router
