import { DeploymentTier, DatabaseCredentials } from '../options'
import { Mailer, FilesystemMailer, AwsSesMailer, MemoryMailer } from './mailer';
import { Storage } from './storage'
import StorageManager from './storage/manager/ts'
import { PasswordHasher } from './password-hasher'
import { EmailGenerator, StaticVerificationEmailGenerator } from './email-generator'
import { SequelizeStorageBackend } from './storage/backend/sequelize';

export interface AppComponents {
  storage : Storage
  mailer : Mailer
  passwordHasher : PasswordHasher
  verificationEmailGenerator : EmailGenerator
}

export interface AppComponentsConfig {
  baseUrl : string
  awsSesRegion : string
  databaseCredentials : DatabaseCredentials
  mailer? : string
  storageBackend? : 'aws' | 'memory'
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
      if (config.storageBackend === 'memory') {
        const backend = new SequelizeStorageBackend({sequelizeConfig: 'sqlite://'})
        const storageManager = new StorageManager({backend})
        const storage = new Storage({storageManager})
        await backend.migrate()
        return storage
      }

      const backend = new SequelizeStorageBackend({
        sequelizeConfig: {
          ...config.databaseCredentials,
          database: `auth-${config.tier}`,
          logging: console.log,
          maxConcurrentQueries: 100,
          dialect: 'postgres',
          dialectOptions: {
              ssl: 'Amazon RDS'
          },
          pool: { maxConnections: 5, maxIdleTime: 30},
          language: 'en'
        }
      })
      
      const storageManager = new StorageManager({backend})
      return new Storage({storageManager})
    }),
    mailer: allowOverride('mailer', () => {
      if (config.mailer === 'memory') {
        return new MemoryMailer()
      }

      const mailer =
        config.tier === 'development'
        ? new FilesystemMailer('/tmp/')
        : new AwsSesMailer()

      return mailer
    }),
    passwordHasher: allowOverride('passwordHasher', () => new PasswordHasher({saltWorkFactor: 10})),
    verificationEmailGenerator: allowOverride('verificationEmailGenerator', () => new StaticVerificationEmailGenerator())
  }
}
