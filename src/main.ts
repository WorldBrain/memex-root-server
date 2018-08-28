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

export async function createSetup({settings, overwrites, suppliedAdminAccessCode} : {settings? : Settings, overwrites?, suppliedAdminAccessCode? : string}) {
  settings = settings || getSettings({overwrites, suppliedAdminAccessCode})

  const components = await createAppComponents({
    baseUrl: settings.baseUrl,
    secretKey: settings.cookieSecret,
    tier: settings.tier,
    awsSesSettings: settings.awsSesSettings,
    mailer: settings.mailer,
    storageBackend: settings.storageBackend,
    databaseCredentials: settings.databaseCredentials,
  })
  const controllers = createAppControllers(components, settings)
  const routes = createAppRoutes(controllers)
  const passportStrategies = createPassportStrategies({
    userStorage: components.storage.users,
    passwordlessTokenStorage: components.storage.passwordless,
    passwordHasher: components.passwordHasher,
    providerConfigurations: {
      google: {...settings.googleCredentials, callbackUrl: settings.baseUrl + '/auth/google/callback'},
    },
  })

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
    const setup = await createSetup({settings})
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

    process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: ', p, 'reason:', reason);
    });
    

    return server
}

if(require.main === module) {
  main().then(() => console.log('Server started  :)'))
}
