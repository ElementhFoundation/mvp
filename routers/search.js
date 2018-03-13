const config = require('config')
const express = require('express')
const elastic = require('../elasticDAO')
const router = express.Router()

router.get('/', async function (req, res) {
  try {
    let q = req.query.q ? req.query.q : null
    let width = req.query.width ? req.query.width : null
    let height = req.query.height ? req.query.height : null
    let radius = req.query.radius ? req.query.radius : null
    let season = req.query.season ? req.query.season : null

    let filter = {bool: {must: []}}

    if (width) {
      filter.bool.must.push({
        'terms': {
          'model.attributes': {alias: 'width', value: width}
        }
      })
    }

    if (height) {
      filter.bool.must.push({
        'terms': {
          'model.attributes.height': height
        }
      })
    }

    if (radius) {
      filter.bool.must.push({
        'terms': {
          'model.attributes.radius': radius
        }
      })
    }

    if (season) {
      filter.bool.must.push({
        'terms': {
          'model.attributes.season': season
        }
      })
    }

    let query = {
      index: config.get('index'),
      type: config.get('type'),
      body: {
        size: 20,
        'query': {
          'bool': {
            'filter': filter,
            'must': {
              'query_string': {
                'query': q
              }
            }
          }
        }
      }
    }
    //res.json(query)
    //return null

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
