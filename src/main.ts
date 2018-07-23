require('source-map-support').install()
// import { setupDebugGlobal } from './debug'
import createApp from './express/app'
import { createAppComponents } from './components'
import { createAppRoutes } from './express/routes'
import { createAppControllers } from './controllers'
import { getSettings } from './options'
import { executeDevShortcuts } from './dev-shortcuts'
import { createHttpServer } from './server'


export async function main(config = null) : Promise<any> {
    // setupDebugGlobal()
    const settings = getSettings()

    const components = createAppComponents({
      baseUrl: settings.baseUrl,
      // awsBucket: settings.awsBucket
    })
    const controllers = createAppControllers(components)
    const routes = createAppRoutes(controllers)
    const app = createApp({ routes })
    const server = await createHttpServer(app)
    if (settings.tier === 'development') {
      await executeDevShortcuts({components, controllers, config: settings.devOptions})
    }
    console.log('Server started  :)')
    return server
}

if(require.main === module) {
  main()
}
