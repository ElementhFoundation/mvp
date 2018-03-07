const elasticSearch = require('elasticsearch')
const config = require('config')

module.exports = new elasticSearch.Client(config.get('elastic'))
