import * as aws from 'aws-sdk'
import { DeploymentTier } from '../options'
import { Mailer, FilesystemMailer, NodeMailer, MemoryMailer } from './mailer';
import { Storage } from './storage'
import StorageManager from './storage/manager'
import { PasswordHasher } from './password-hasher'
import { VerificationEmailGenerator, StaticVerificationEmailGenerator } from './verification-email-generator'
import { SequelizeStorageBackend } from './storage/backend/sequelize';

export interface AppComponents {
  storage : Storage
  mailer : Mailer
  passwordHasher : PasswordHasher
  verificationEmailGenerator : VerificationEmailGenerator
}

export interface AppComponentsConfig {
  baseUrl : string
  awsSesRegion : string
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

      const backend =
        config.tier === 'development'
        ? new SequelizeStorageBackend({sequelizeConfig: 'sqlite://'})
        : new SequelizeStorageBackend({sequelizeConfig: {
          // host: '****.****.us-west-1.rds.amazonaws.com',
          // port: 5432,
          logging: console.log,
          maxConcurrentQueries: 100,
          dialect: 'postgres',
          dialectOptions: {
              ssl: 'Amazon RDS'
          },
          pool: { maxConnections: 5, maxIdleTime: 30},
          language: 'en'
        }})
      
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
        : new NodeMailer({
          SES: new aws.SES({
              apiVersion: '2010-12-01',
              region: config.awsSesRegion
          })
      })

      return mailer
    }),
    passwordHasher: allowOverride('passwordHasher', () => new PasswordHasher({saltWorkFactor: 10})),
    verificationEmailGenerator: allowOverride('verificationEmailGenerator', () => new StaticVerificationEmailGenerator())
  }
}
