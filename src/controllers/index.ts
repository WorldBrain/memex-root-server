import { AppComponents } from '../components'
import * as adminStorage from './admin/storage'
import * as authLocal from './auth/local'
import * as authGoogle from './auth/google'
import * as authEmail from './auth/email'
import { Settings } from '../options'

export interface AppControllers {
    adminStorageMigrate : Function
    authLocalRegister : Function
    authGoogleRefresh : Function
    authEmailVerify : Function
}

export function createAppControllers(appComponents : AppComponents, settings : Settings) : AppControllers {
    return {
        adminStorageMigrate: adminStorage.migrate({storage: appComponents.storage, accessCode: settings.migrationAccessCode}),
        authLocalRegister: authLocal.register({
            userStorage: appComponents.storage.users, passwordHasher: appComponents.passwordHasher,
            mailer: appComponents.mailer, verificationEmailGenerator: appComponents.verificationEmailGenerator,
            baseUrl: settings.baseUrl,
        }),
        authGoogleRefresh: authGoogle.refresh(settings.googleCredentials),
        authEmailVerify: authEmail.verify({userStorage: appComponents.storage.users})
    }
}
