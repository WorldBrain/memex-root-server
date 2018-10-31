import { AppControllers } from '../../controllers'
import * as adminRoutes from './admin'
import * as authLocalRoutes from './auth/local'
import * as authEmailRoutes from './auth/email'
import * as authGoogleRoutes from './auth/google'
import * as authPasswordlessRoutes from './auth/passwordless'
import * as woocommerceRoutes from './woocommerce'

export type RouteHandler = ({req, res}) => void

export interface AppRoutes {
  adminHooksPreDeploy : RouteHandler
  adminHooksPostDeploy : RouteHandler
  authLocalRegister : RouteHandler
  authLocalLogin : RouteHandler
  authLocalCheck : RouteHandler
  authEmailVerify : RouteHandler
  authGoogleEntry : RouteHandler
  authGoogleCallback : RouteHandler
  authGoogleRefresh : RouteHandler
  authPasswordlessLoginStart : RouteHandler
  authPasswordlessLoginFinish : RouteHandler
  subscriptionsCheckAutomaticBackup : RouteHandler
}

export function createAppRoutes(appControllers : AppControllers) : AppRoutes {
  return {
    adminHooksPreDeploy: adminRoutes.adminHook(appControllers, 'PreDeploy'),
    adminHooksPostDeploy: adminRoutes.adminHook(appControllers, 'PostDeploy'),
    authLocalRegister: authLocalRoutes.authLocalRegister(appControllers),
    authLocalLogin: authLocalRoutes.authLocalLogin(appControllers, 'local'),
    authLocalCheck: authLocalRoutes.authLocalCheck(appControllers),
    authEmailVerify: authEmailRoutes.authEmailVerifiy(appControllers),
    authGoogleEntry: authGoogleRoutes.authGoogleEntry(appControllers),
    authGoogleCallback: authGoogleRoutes.authGoogleCallback(appControllers),
    authGoogleRefresh: authGoogleRoutes.authGoogleRefresh(appControllers),
    authPasswordlessLoginStart: authPasswordlessRoutes.loginStart(appControllers),
    authPasswordlessLoginFinish: authLocalRoutes.authLocalLogin(appControllers, 'passwordless'),
    subscriptionsCheckAutomaticBackup: woocommerceRoutes.subscriptionsCheckAutomaticBackup(appControllers),
  }
}
