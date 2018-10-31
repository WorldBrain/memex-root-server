import { Settings } from '../options'
import { AppComponents } from '../components'
import * as adminHooks from './admin/hooks'
import * as authLocal from './auth/local'
import * as authGoogle from './auth/google'
import * as authEmail from './auth/email'
import * as authPasswordless from './auth/passwordless'
import * as woocommerce from './woocommerce'

export interface AppControllers {
    adminHooksPreDeploy : Function
    adminHooksPostDeploy : Function
    authLocalRegister : Function
    authGoogleCallback : Function
    authGoogleRefresh : Function
    authEmailVerify : Function
    authPasswordlessGenerateToken : Function
    subscriptionsCheckAutomaticBackup : Function
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
        authGoogleCallback: authGoogle.callback({userDataEncrypter: appComponents.userDataEncrypter}),
        authGoogleRefresh: authGoogle.refresh({userDataEncrypter: appComponents.userDataEncrypter, ...settings.googleCredentials}),
        authEmailVerify: authEmail.verify({userStorage: appComponents.storage.users}),
        authPasswordlessGenerateToken: authPasswordless.authPasswordlessGenerateToken({
            userStorage: appComponents.storage.users, passwordlessTokenStorage: appComponents.storage.passwordless,
            mailer: appComponents.mailer, emailGenerator: appComponents.verificationEmailGenerator,
            baseUrl: settings.baseUrl,
        }),
        subscriptionsCheckAutomaticBackup: woocommerce.subscriptionsCheckAutomaticBackup({
            wooCommerceCredentials: settings.wooCommerceCredentials
        })
    }
}
