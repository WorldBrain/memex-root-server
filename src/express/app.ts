const express = require('express')
const bodyParser = require('body-parser')
import { AppRoutes } from './routes'

export default function createApp(
  {routes, preConfigure, allowUndefinedRoutes = false} :
  {routes : AppRoutes, preConfigure? : Function, allowUndefinedRoutes? : boolean}
) {
  function route(f?) {
    if (!f && allowUndefinedRoutes) {
      f = () => {}
    }
    return (req, res) => f({req, res})
  }

  const app = express()
  app.use(bodyParser.json())
  app.use((req, res, next) => {
    const origin = req.get('Origin')
    if (origin === 'http://memex.link' || origin === 'http://staging.memex.link') {
      res.header("Access-Control-Allow-Origin", origin)
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.header("Access-Control-Allow-Credentials", "true")
    res.header("Access-Control-Allow-Methods", "POST")
    next()
  })
  preConfigure && preConfigure(app)
  // app.post('/', route(routes.putAnnotation))
  return app
}
