import * as main from './main'

const setup = main.createSetup()
const app = main.createExpressApp(setup)
module.exports = app
