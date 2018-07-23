import { AppComponents } from '../../components'
import { AppControllers } from '../../controllers'
import * as annotationRoutes from './annotation'

export type RouteHandler = ({req, res}) => void

export interface AppRoutes {
  putAnnotation : RouteHandler
}

export function createAppRoutes(appControllers : AppControllers) : AppRoutes {
  return {
    putAnnotation: annotationRoutes.putAnnotation(appControllers)
  }
}
