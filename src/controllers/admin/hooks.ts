import { Storage } from '../../components/storage'
import { securelyValidateAdminAccessCode } from '../../utils/admin';
import { OAuthStorage } from '../../components/storage/modules/oauth';
import { DeploymentTier } from '../../options';

export type MigrationParams = {storage : Storage, accessCode : string, worldbrainOAuthCredentials, oauthStorage : OAuthStorage}

export function preDeploy(params : MigrationParams) {
    const migrate = _migrate(params)
    return async ({suppliedAccessCode, tier} : {suppliedAccessCode : string, tier : DeploymentTier}) => {
        if (tier === 'production') {
            return await migrate({suppliedAccessCode, tier})
        }
        return true
    }
}

export function postDeploy(params : MigrationParams) {
    const migrate = _migrate(params)
    return async ({suppliedAccessCode, tier} : {suppliedAccessCode : string, tier : string}) => {
        if (tier === 'staging') {
            return await migrate({suppliedAccessCode, tier})
        }
        return true
    }
}

export function _migrate(
    {storage, accessCode, worldbrainOAuthCredentials, oauthStorage} : MigrationParams
    
) {
    return async ({suppliedAccessCode, tier} : {suppliedAccessCode : string, tier : DeploymentTier}) => {
        if (!await securelyValidateAdminAccessCode({accessCode, suppliedAccessCode})) {
            return false
        }
        await storage._mananger.backend.migrate()
        if (worldbrainOAuthCredentials) {
            await oauthStorage.createClient({
                name: 'worldbrain.io',
                clientId: worldbrainOAuthCredentials.id,
                clientSecret: worldbrainOAuthCredentials.secret,
                ifExists: 'retrieve'
            })
        }
        return true
    }
}
