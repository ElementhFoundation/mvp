const config = require('config')
const rp = require('request-promise')
const elastic = require('./elasticDAO')
const jsonfile = require('jsonfile')

let products = {}
let mapping = jsonfile.readFileSync('settings.json')

async function loadData (page, limit) {
  try {
    let options = {
      uri: config.get('miiix.apiUrl') + config.get('miiix.endPointSku'),
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
    options.qs.page = 1
    options.uri = config.get('miiix.apiUrl') + config.get('miiix.endPointStock')
    let stocks = await rp(options)
    if (json.data) {
      for (let i = 0; i < json.data.length; i++) {
        if (!products.hasOwnProperty(json.data[i].product_id)) {
          products[json.data[i].product_id] = json.data[i].product
          products[json.data[i].product_id].sku = []
          products[json.data[i].product_id].attributes = products[json.data[i].product_id].attributes.concat(products[json.data[i].product_id].model.attributes)
          delete products[json.data[i].product_id].model.attributes

          products[json.data[i].product_id].attributes.forEach(function (element) {
            if (element.alias === 'season') {
              switch (element.value) {
                case 'Лето':
                  element.value = 'summer'
                  break
                case 'Зима':
                  element.value = 'winter'
                  break
                default:
                  element.value = 'all'
                  break
              }
            }
            if (element.value === 'Нет') element.value = 'No'
            if (element.value === 'Да') element.value = 'Yes'
          })
        }

        json.data[i].stock = stocks.data.find(s => s.id === json.data[i].stock_id)
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
    await elastic.indices.create({index: config.get('index'), body: mapping})

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

        let doc = Object.assign(products[key])
        doc.eesn = generateAll(doc)
        doc.eepc = generateEEPC()

        delete products[key].id
        delete products[key].product_id

        bulk.push({
          doc: doc,
          'doc_as_upsert': true
        })

        if (bulk.length > 998 || (key === lastKey && bulk.length)) {
          let results = await elastic.bulk({body: bulk})
          if (results.errors) {
            console.error(results)
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

function generateAll (product) {
  // generateEESN
  let result = []
  let countEESN = Math.floor(Math.random() * 10)
  for (let i = 0; i <= countEESN; i++) {
    let trs = []
    let countTrs = Math.floor(Math.random() * 10)
    let startDate = new Date(2012 + (Math.random() * 5), Math.random() * 11, Math.random() * 30)
    let lastOwner = {}
    for (let j = 0; j <= countTrs; j++) {
      let tr = {}
      // add up to 30 days to startDate
      startDate = new Date(startDate.getTime() + (Math.random() * 60 * 60 * 24 * 30 * 1000))
      tr.date = startDate
      if (Object.keys(lastOwner).length === 0) {
        tr.from = {name: product.model.brand.title, address: generateWallet()}
        lastOwner = {name: null, address: generateWallet()}
        tr.to = lastOwner
      } else {
        tr.from = lastOwner
        lastOwner = {name: null, address: generateWallet()}
        tr.to = lastOwner
      }
      if (trs.length === countTrs) {
        tr.to.name = product.sku[0].stock.company.alias
      }
      trs.push(tr)
    }
    result.push({
      eesn: generateEESN(),
      transactions: trs
    })
  }
  return result
}

function randomString (length) {
  let chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789'
  let pass = ''
  for (let x = 0; x < length; x++) {
    let i = Math.floor(Math.random() * chars.length)
    pass += chars.charAt(i)
  }
  return pass
}

function generateWallet () {
  return 'E' + randomString(30)
}

function generateEEPC () {
  return 'EEPC-' + randomString(10)
}

function generateEESN () {
  return 'EESN-' + randomString(12)
}

main()
