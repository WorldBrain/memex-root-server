import { AppComponents, createAppComponents } from '../components'
import * as authLocal from './auth/local'
import * as authGoogle from './auth/google'
import * as authEmail from './auth/email'

export interface AppControllers {
    authLocalRegister : Function
    authGoogleRefresh : Function
    authEmailVerify : Function
}

export function createAppControllers(appComponents : AppComponents, settings) : AppControllers {
    return {
        authLocalRegister: authLocal.register({
            userStorage: appComponents.storage.users, passwordHasher: appComponents.passwordHasher,
            mailer: appComponents.mailer, verificationEmailGenerator: appComponents.verificationEmailGenerator,
            baseUrl: settings.baseUrl,
        }),
        authGoogleRefresh: authGoogle.refresh(settings.googleCredentials),
        authEmailVerify: authEmail.verify({userStorage: appComponents.storage.users})
    }
}
