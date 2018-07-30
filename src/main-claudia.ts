import * as main from './main'

export default async () => {
    const setup = await main.createSetup()
    const app = main.createExpressApp(setup)
    return app
}
