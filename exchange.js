const config = require('config')
const rp = require('request-promise')
const elastic = require('./elasticDAO')

let products = {}

async function loadData (page, limit) {
  try {
    let options = {
      uri: config.get('miiix.apiUrl') + config.get('miiix.endPoint'),
      qs: {
        token: config.get('miiix.token'),
        page: page,
        limit: 1000,
        detail: true
      },
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    }

    let json = await rp(options)
    if (json.data) {
      for (let i = 0; i < json.data.length; i++) {
        if (!products.hasOwnProperty(json.data[i].product_id)) {
          products[json.data[i].product_id] = json.data[i].product
          products[json.data[i].product_id].sku = []
        }

        delete json.data[i].product
        products[json.data[i].product_id].sku.push(json.data[i])
      }
    }
    // next page
    if (json.current_page < json.total_pages) {
      console.log(`loadData ${json.current_page}/${json.total_pages}`)
      await loadData(json.current_page + 1, limit)
    } else {
      return true
    }
  } catch (e) {
    console.error(e)
  }
}

async function main () {
  let bulk = []
  let amount = 0
  try {
    await elastic.indices.delete({index: config.get('index'), allowNoIndices: true, ignoreUnavailable: true})

    await loadData(1, 100)
    console.log('data download completed')

    let keys = Object.keys(products)
    let lastKey = keys[keys.length - 1]

    for (let key in products) {
      if (products.hasOwnProperty(key)) {
        bulk.push({
          update: {
            _index: config.get('index'),
            _type: config.get('type'),
            _id: key
          }
        })
        delete products[key].id
        delete products[key].product_id

        bulk.push({
          doc: products[key],
          'doc_as_upsert': true
        })

        if (bulk.length > 998 || (key === lastKey && bulk.length)) {
          let results = await elastic.bulk({body: bulk})
          if (results.errors) {
            console.error(results.errors)
            process.exit(1)
          }
          amount = amount + (bulk.length / 2)
          console.log(`bulk write ${amount}/${keys.length}`)
          bulk = []
        }
      }
    }
  } catch (e) {
    console.error(e)
    process.exit(2)
  }

  process.exit(0)
}

main()
