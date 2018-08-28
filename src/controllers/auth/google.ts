import * as request from 'request-promise-native'
import { UserDataEncrypter } from '../../components/user-data-encryptor'

export function refresh({id, secret, userDataEncrypter} : {id : string, secret : string, userDataEncrypter : UserDataEncrypter}) {
    return async ({encryptedRefreshToken}) => {
        const refreshToken = await userDataEncrypter.decrypt(encryptedRefreshToken)
        const response = JSON.parse(await request.post('https://www.googleapis.com/oauth2/v4/token', {form: {
            client_id: id,
            client_secret: secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        }}))
        return {
            accessToken: response.access_token,
            expiresInSeconds: response.expires_in,
        }
    }
}

export function callback({userDataEncrypter} : {userDataEncrypter : UserDataEncrypter}) {
    return async ({receivedRefreshToken}) => {
        if (!receivedRefreshToken) {
            return {encryptedRefreshToken: null}
        }

        return {encryptedRefreshToken: await userDataEncrypter.encrypt(receivedRefreshToken)}
    }
}
