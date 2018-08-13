require('source-map-support').install()
import { setupDebugGlobal } from './debug'
import createApp from './express/app'
import { createAppComponents, AppComponents } from './components'
import { createAppRoutes } from './express/routes'
import { createAppControllers } from './controllers'
import { getSettings, Settings } from './options'
import { executeDevShortcuts } from './dev-shortcuts'
import { createHttpServer } from './server'
import { createPassportStrategies } from './express/passport'

export async function createSetup(settings? : Settings) {
  settings = settings || getSettings()

  const components = await createAppComponents({
    baseUrl: settings.baseUrl,
    tier: settings.tier,
    awsSesRegion: settings.awsSesRegion,
    mailer: settings.mailer,
    storageBackend: settings.storageBackend,
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

  if (settings.worldbrainOAuthCredentials) {
    await components.storage.oauth.createClient({
      name: 'worldbrain.io',
      clientId: settings.worldbrainOAuthCredentials.id,
      clientSecret: settings.worldbrainOAuthCredentials.secret,
      ifExists: 'retrieve'
    })
  }

  return {settings, components, controllers, routes, passportStrategies}
}


export function createExpressApp(
  { routes, passportStrategies, settings, components } :
  { routes, passportStrategies, settings, components : AppComponents }
) {
  return createApp({
    routes, passportStrategies, cookieSecret: settings.cookieSecret, domain: settings.domain,
    oauthStorage: components.storage.oauth
  })
}


export async function main(settings? : Settings) : Promise<any> {
    const setup = await createSetup(settings)
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
