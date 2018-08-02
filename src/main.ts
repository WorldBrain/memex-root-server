require('source-map-support').install()
require('require-context/register')
// import { setupDebugGlobal } from './debug'
import createApp from './express/app'
import { createAppComponents } from './components'
import { createAppRoutes } from './express/routes'
import { createAppControllers } from './controllers'
import { getSettings } from './options'
import { executeDevShortcuts } from './dev-shortcuts'
import { createHttpServer } from './server'
import { createPassportStrategies } from './express/passport'


export async function createSetup() {
  const settings = getSettings()

  const components = await createAppComponents({
    baseUrl: settings.baseUrl,
    tier: settings.tier,
    awsSesRegion: settings.awsSesRegion
  })
  const controllers = createAppControllers(components, settings)
  const routes = createAppRoutes(controllers)
  const passportStrategies = createPassportStrategies({
    userStorage: components.storage.users,
    passwordHasher: components.passwordHasher,
    providerConfigurations: {
      google: {...settings.googleCredentials, callbackUrl: settings.baseUrl + '/auth/google/callback'},
    },
  })

  return {settings, components, controllers, routes, passportStrategies}
}


export function createExpressApp({ routes, passportStrategies, settings }) {
  return createApp({ routes, passportStrategies, cookieSecret: settings.cookieSecret })
}


export async function main() : Promise<any> {
    const setup = await createSetup()
    const app = createExpressApp(setup)

    process.once('SIGUSR2', async () => {
      await setup.components.storage.cleanup()
      process.kill(process.pid, 'SIGUSR2')
    })
    
    const server = await createHttpServer(app)
    if (setup.settings.tier === 'development') {
      await executeDevShortcuts({
        components: setup.components,
        controllers: setup.controllers,
        config: setup.settings.devOptions
      })
    }
    return server
}

if(require.main === module) {
  main().then(() => console.log('Server started  :)'))
}
