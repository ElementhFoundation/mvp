const config = require('config')
const express = require('express')
const elastic = require('../elasticDAO')
const router = express.Router()

router.get('/', async function (req, res) {
  try {
    let q = req.query.q ? req.query.q : ''
    let searchType = req.query['search-type']

    if (req.query[searchType + '-brand'] && searchType !== 'none') q += ' ' + req.query[searchType + '-brand']
    if (req.query[searchType + '-model'] && searchType !== 'none') q += ' ' + req.query[searchType + '-model']
    let filter = {bool: {must: []}}

    switch (searchType) {
      case 'none':
        break
      case 'wheels':
        let wheelsWidth = req.query['wheels-width'] ? req.query['wheels-width'] : null
        let wheelsRadius = req.query['wheels-radius'] ? req.query['wheels-radius'] : null
        let wheelsDia = req.query['wheels-dia'] ? req.query['wheels-dia'] : null

        if (wheelsWidth) {
          filter.bool.must.push({
            'term': {
              'attributes.alias': 'width'
            }
          })
          filter.bool.must.push({
            'term': {
              'attributes.value': wheelsWidth
            }
          })
        }

        if (wheelsRadius) {
          filter.bool.must.push({
            'term': {
              'attributes.alias': 'radius'
            }
          })
          filter.bool.must.push({
            'term': {
              'attributes.value': wheelsRadius
            }
          })
        }

        if (wheelsDia) {
          filter.bool.must.push({
            'term': {
              'attributes.alias': 'dia'
            }
          })
          filter.bool.must.push({
            'term': {
              'attributes.value': wheelsDia
            }
          })
        }
        filter.bool.must.push({
          'term': {
            'model.category.alias': 'wheels'
          }
        })
        break
      case 'tires':
        let tiresWidth = req.query['tires-width'] ? req.query['tires-width'] : null
        let tiresHeight = req.query['tires-height'] ? req.query['tires-height'] : null
        let tiresRadius = req.query['tires-radius'] ? req.query['tires-radius'] : null
        let tiresSeason = req.query['tires-season'] ? req.query['tires-season'] : null

        if (tiresWidth) {
          filter.bool.must.push({
            'term': {
              'attributes.alias': 'width'
            }
          })
          filter.bool.must.push({
            'term': {
              'attributes.value': tiresWidth
            }
          })
        }

        if (tiresHeight) {
          filter.bool.must.push({
            'term': {
              'attributes.alias': 'height'
            }
          })
          filter.bool.must.push({
            'term': {
              'attributes.value': tiresHeight
            }
          })
        }

        if (tiresRadius) {
          filter.bool.must.push({
            'term': {
              'attributes.alias': 'radius'
            }
          })
          filter.bool.must.push({
            'term': {
              'attributes.value': tiresRadius
            }
          })
        }

        if (tiresSeason) {
          filter.bool.must.push({
            'term': {
              'attributes.alias': 'season'
            }
          })
          filter.bool.must.push({
            'term': {
              'attributes.value': tiresSeason
            }
          })
        }

        filter.bool.must.push({
          'term': {
            'model.category.alias': 'tyres'
          }
        })
        break
    }

    let query = {
      index: config.get('index'),
      type: config.get('type'),
      body: {
        size: 5,
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
