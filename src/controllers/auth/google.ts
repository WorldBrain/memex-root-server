import * as request from 'request-promise-native'

export function refresh({id, secret}) {
    return async ({refreshToken}) => {
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