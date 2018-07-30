import { DeploymentTier } from '../options'
import { Storage } from './storage'
import { StorageManager } from './storage/manager'
import { AwsStorageBackend, createLocalAwsStorageBackend } from './storage/backend/aws'

export interface AppComponents {
  storage : Storage
}

export interface AppComponentsConfig {
  baseUrl : string
  overrides? : object
  tier : DeploymentTier
}

export async function createAppComponents(config : AppComponentsConfig) : Promise<AppComponents> {
  function allowOverride<T>(name : string, _default : () => T) : T {
    const override = config.overrides && config.overrides[name]
    return override ? override : _default()
  }
  async function asyncAllowOverride<T>(name : string, _default : () => Promise<T>) : Promise<T> {
    const override = config.overrides && config.overrides[name]
    return override ? override : await _default()
  }

  return {
    storage: await asyncAllowOverride<Storage>('storage', async () : Promise<Storage> => {
      const backend =
        config.tier === 'development'
        ? await createLocalAwsStorageBackend({port: 3121})
        : new AwsStorageBackend()
      
      const storageManager = new StorageManager({backend})
      return new Storage({storageManager})
    }),
  }
}
