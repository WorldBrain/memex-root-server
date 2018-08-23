import * as AWS from 'aws-sdk'
import { DeploymentTier, DatabaseCredentials, AwsSesSettings } from '../options'
import { Mailer, FilesystemMailer, AwsSesMailer, MemoryMailer, NodeMailer } from './mailer';
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
  awsSesSettings : AwsSesSettings
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
      return await createStorage({backend: config.storageBackend, databaseCredentials: config.databaseCredentials, tier: config.tier})
    }),
    mailer: allowOverride('mailer', () => {
      if (config.mailer === 'memory') {
        return new MemoryMailer()
      }

      const mailer =
        config.tier === 'development'
        ? new FilesystemMailer('/tmp/')
        : new NodeMailer({
          SES: new AWS.SES({
            region: config.awsSesSettings.region
          })
        })

      return mailer
    }),
    passwordHasher: allowOverride('passwordHasher', () => new PasswordHasher({saltWorkFactor: 10})),
    verificationEmailGenerator: allowOverride('verificationEmailGenerator', () => new StaticVerificationEmailGenerator())
  }
}

export async function createStorage(config : {backend : 'aws' | 'memory', databaseCredentials? : DatabaseCredentials, tier? : string}) {
  if (config.backend === 'memory') {
    const backend = new SequelizeStorageBackend({sequelizeConfig: 'sqlite://'})
    const storageManager = new StorageManager({backend})
    const storage = new Storage({storageManager})
    await backend.migrate()
    return storage
  }

  const databases = ['auth_production']
  if (config.tier === 'staging') {
    databases.unshift('auth_staging')
  }

  const backend = new SequelizeStorageBackend({
    sequelizeConfig: {
      ...config.databaseCredentials,
      database: `auth_${config.tier}`,
      logging: false,
      maxConcurrentQueries: 100,
      dialect: 'postgres',
      dialectOptions: {
          ssl: 'Amazon RDS'
      },
      pool: { maxConnections: 5, maxIdleTime: 30},
      language: 'en'
    },
    databases,
    defaultDatabase: `auth_${config.tier}`
  })
  
  const storageManager = new StorageManager({backend})
  return new Storage({storageManager})
}
