import * as aws from 'aws-sdk'
import { DeploymentTier } from '../options'
import { Mailer, FilesystemMailer, NodeMailer } from './mailer';
import { Storage } from './storage'
import StorageManager from './storage/manager'
import { AwsStorageBackend, createLocalAwsStorageBackend } from './storage/backend/aws'
import { PasswordHasher } from './password-hasher'
import { VerificationEmailGenerator, StaticVerificationEmailGenerator } from './verification-email-generator'

export interface AppComponents {
  storage : Storage
  mailer : Mailer
  passwordHasher : PasswordHasher
  verificationEmailGenerator : VerificationEmailGenerator
}

export interface AppComponentsConfig {
  baseUrl : string
  awsSesRegion : string
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
    mailer: allowOverride('mailer', () => {
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
