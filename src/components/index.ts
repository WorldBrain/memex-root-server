import * as path from 'path'
import { Storage } from './storage/types'

export interface AppComponents {
  storage : Storage
}

export interface AppComponentsConfig {
  baseUrl : string
  overrides? : object
}

export function createAppComponents(config : AppComponentsConfig) : AppComponents {
  function allowOverride<T>(name : string, _default : () => T) : T {
    const override = config.overrides && config.overrides[name]
    return override ? override : _default()
  }

  return {
    storage: allowOverride('storage', () => {
      return <any>null
    //   if (config.awsBucket) {
    //     return new AwsStorage({bucketName: config.awsBucket})
    //   } else {
    //     return new DiskStorage({
    //       basePath: path.join(__dirname, '../../public')
    //     })
    //   }
    }),
  }
}
