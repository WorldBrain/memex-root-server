import { AppComponents } from '../components'
import * as adminStorage from './admin/storage'
import * as authLocal from './auth/local'
import * as authGoogle from './auth/google'
import * as authEmail from './auth/email'
import * as authPasswordless from './auth/passwordless'
import { Settings } from '../options'

export interface AppControllers {
    adminStorageMigrate : Function
    authLocalRegister : Function
    authGoogleRefresh : Function
    authEmailVerify : Function
    authPasswordlessGenerateToken : Function
}

export function createAppControllers(appComponents : AppComponents, settings : Settings) : AppControllers {
    return {
        adminStorageMigrate: adminStorage.migrate({storage: appComponents.storage, accessCode: settings.adminAccessCode}),
        authLocalRegister: authLocal.register({
            userStorage: appComponents.storage.users, passwordHasher: appComponents.passwordHasher,
            mailer: appComponents.mailer, emailGenerator: appComponents.verificationEmailGenerator,
            baseUrl: settings.baseUrl,
        }),
        authGoogleRefresh: authGoogle.refresh(settings.googleCredentials),
        authEmailVerify: authEmail.verify({userStorage: appComponents.storage.users}),
        authPasswordlessGenerateToken: authPasswordless.authPasswordlessGenerateToken({
            userStorage: appComponents.storage.users, passwordlessTokenStorage: appComponents.storage.passwordless,
            mailer: appComponents.mailer, emailGenerator: appComponents.verificationEmailGenerator,
            baseUrl: settings.baseUrl,
        }),
    }
}
