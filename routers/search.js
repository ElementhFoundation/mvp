const config = require('config')
const express = require('express')
const elastic = require('../elasticDAO')
const router = express.Router()

router.get('/', async function (req, res) {
  try {
    let q = req.query.q ? req.query.q : null

    let query = {
      index: config.get('index'),
      type: config.get('type'),
      body: {
        size: 20,
        'query': {
          'query_string': {
            'query': q
          }
        }
      }
    }

    let data = await elastic.search(query)

    if (data && data.hits && data.hits.hits) {
      data = data.hits.hits
    } else {
      data = []
    }
    res.json({
      response: {
        result: data
      }
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({response: {error: 500}})
  }
})

module.exports = router
