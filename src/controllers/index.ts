import { AppComponents } from '../components'
import * as authGoogle from './auth/google'

export interface AppControllers {
    authGoogleRefresh : Function
}

export function createAppControllers(appComponents : AppComponents, settings) : AppControllers {
    return {
        authGoogleRefresh: authGoogle.refresh(settings.googleCredentials)
    }
}
