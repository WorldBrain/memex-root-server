export default class AuthBackend {
    constructor(baseUrl) {
        this.baseUrl = baseUrl
    }

    async startLogin(email) {
        try {
            // await new Promise(resolve => setTimeout(resolve, 500))
            return await (await fetch(`${this.baseUrl}/auth/passwordless/login/start?responseType=json`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },        
                body: JSON.stringify({email})
            })).json()
        } catch (e) {
            return {error: 'internal'}
        }
        // return {error: 'internal'}
        // return {error: 'unknown-email'}
    }

    async finishLogin(email, token) {
        try {
            // await new Promise(resolve => setTimeout(resolve, 500))
            return await (await fetch(`${this.baseUrl}/auth/passwordless/login/finish`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },        
                body: JSON.stringify({
                    email,
                    token
                })
            })).json()
        } catch (e) {
            return {error: 'internal'}
        }
    }

    async startRegistration(email) {
        try {
            // await new Promise(resolve => setTimeout(resolve, 500))
            return await (await fetch(`${this.baseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },        
                body: JSON.stringify({email, password: Math.random().toString()})
            })).json()
        } catch (e) {
            return {error: 'internal'}
        }
    }

    async finishRegistration(code) {
        try {
            // await new Promise(resolve => setTimeout(resolve, 1000))
            // return { success: true }
            // return { error: 'nifewf' }

            return await (await fetch(`${this.baseUrl}/email/verify?code=${code}`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                }
            })).json()
        } catch (e) {
            return {error: 'internal'}
        }
    }
}

export function getRootOrigin() {
    // return 'https://memex.cloud'
    return 'http://localhost:3002'
}
