'use strict'
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const Schema = mongoose.Schema

const schema = new Schema({
  name: {type: String},
  email: {type: String},
  fileName: {type: String}
}, {
  timestamps: true
})

module.exports = mongoose.model('Price', schema)
