const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')
// Routers
const search = require('./routers/search')

const app = express()
app.use(logger('combined'))

// parse application/json
app.use(bodyParser.json({limit: '1mb'}))
app.use('/search', search)

// Error handling middleware
// Handle error in development mode.
if (app.get('env') === 'development' || app.get('env') === 'test') {
  console.log('running in dev mode')
  app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
  })
// Handle error in production mode.
} else {
  console.log('running in production mode')
  app.use(function (err, req, res, next) {
    console.error(err.message)
    res.status(500).send('Something broke')
  })
}

app.get('*', function (req, res) {
  res.status(404).json({response: {error: 'Page not found'}})
})

app.listen(9980, function () {
  console.log('listening at http://localhost:9980')
  if (process.send) {
    process.send('ready')
  }
})

process.on('SIGINT', async function () {
  try {
    console.log('stop process')
    process.exit(0)
  } catch (e) {
    console.error('stop process error')
    console.error(e)
    process.exit(1)
  }
})
