import { AppComponents } from '../../components'
import { AppControllers } from '../../controllers'
import * as authLocalRoutes from './auth/local'
import * as authGoogleRoutes from './auth/google'

export type RouteHandler = ({req, res}) => void

export interface AppRoutes {
  authLocalRegister : RouteHandler
  authLocalLogin : RouteHandler
  authLocalCheck : RouteHandler
  authGoogleEntry : RouteHandler
  authGoogleCallback : RouteHandler
  authGoogleRefresh : RouteHandler
}

export function createAppRoutes(appControllers : AppControllers) : AppRoutes {
  return {
    authLocalRegister: authLocalRoutes.authLocalRegister(appControllers),
    authLocalLogin: authLocalRoutes.authLocalLogin(appControllers),
    authLocalCheck: authLocalRoutes.authLocalCheck(appControllers),
    authGoogleEntry: authGoogleRoutes.authGoogleEntry(appControllers),
    authGoogleCallback: authGoogleRoutes.authGoogleCallback(appControllers),
    authGoogleRefresh: authGoogleRoutes.authGoogleRefresh(appControllers),
  }
}
