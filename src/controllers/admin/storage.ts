import { Storage } from '../../components/storage'
import { securelyValidateAdminAccessCode } from '../../utils/admin';
import { OAuthStorage } from '../../components/storage/modules/oauth';

export function migrate(
    {storage, accessCode, worldbrainOAuthCredentials, oauthStorage} :
    {storage : Storage, accessCode : string, worldbrainOAuthCredentials, oauthStorage : OAuthStorage}
) {
    return async ({suppliedAccessCode} : {suppliedAccessCode : string}) => {
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
