import { AppComponents } from '../components'
import * as adminHooks from './admin/hooks'
import * as authLocal from './auth/local'
import * as authGoogle from './auth/google'
import * as authEmail from './auth/email'
import * as authPasswordless from './auth/passwordless'
import { Settings } from '../options'

export interface AppControllers {
    adminHooksPreDeploy : Function
    adminHooksPostDeploy : Function
    authLocalRegister : Function
    authGoogleRefresh : Function
    authEmailVerify : Function
    authPasswordlessGenerateToken : Function
}

export function createAppControllers(appComponents : AppComponents, settings : Settings) : AppControllers {
    return {
        adminHooksPreDeploy: adminHooks.preDeploy({
            storage: appComponents.storage, accessCode: settings.adminAccessCode,
            worldbrainOAuthCredentials: settings.worldbrainOAuthCredentials,
            oauthStorage: appComponents.storage.oauth,
        }),
        adminHooksPostDeploy: adminHooks.postDeploy({
            storage: appComponents.storage, accessCode: settings.adminAccessCode,
            worldbrainOAuthCredentials: settings.worldbrainOAuthCredentials,
            oauthStorage: appComponents.storage.oauth,
        }),
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
