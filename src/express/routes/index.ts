import { AppComponents } from '../../components'
import { AppControllers } from '../../controllers'
import * as authGoogleRoutes from './auth/google'

export type RouteHandler = ({req, res}) => void

export interface AppRoutes {
  authGoogleEntry : RouteHandler
  authGoogleCallback : RouteHandler
  authGoogleRefresh : RouteHandler
}

export function createAppRoutes(appControllers : AppControllers) : AppRoutes {
  return {
    authGoogleEntry: authGoogleRoutes.authGoogleEntry(appControllers),
    authGoogleCallback: authGoogleRoutes.authGoogleCallback(appControllers),
    authGoogleRefresh: authGoogleRoutes.authGoogleRefresh(appControllers),
  }
}
