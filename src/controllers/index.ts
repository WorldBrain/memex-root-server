import { AppComponents } from '../components'
import * as authGoogle from './auth/google'
import * as authEmail from './auth/email'

export interface AppControllers {
    authGoogleRefresh : Function
    authEmailVerify : Function
}

export function createAppControllers(appComponents : AppComponents, settings) : AppControllers {
    return {
        authGoogleRefresh: authGoogle.refresh(settings.googleCredentials),
        authEmailVerify: authEmail.verify({userStorage: appComponents.storage.users})
    }
}
