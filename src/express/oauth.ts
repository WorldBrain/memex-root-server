import * as passport from 'passport'
import ClientPasswordStrategy = require('passport-oauth2-client-password')
import BearerStrategy = require('passport-http-bearer')
import * as oauth2orize from 'oauth2orize'
import transactionLoader = require('oauth2orize/lib/middleware/transactionLoader')
import { ensureLoggedIn } from 'connect-ensure-login'
import { OAuthStorage } from '../components/storage/modules/oauth'
import { UserStorage } from '../components/storage/modules/auth'

export function setupOAuthRoutes(
    { app, oauthStorage, userStorage }:
        { app, oauthStorage: OAuthStorage, userStorage : UserStorage }
) {
    var server = oauth2orize.createServer()

    // A client must obtain permission from a user before it is issued an access token.
    // This permission is known as a grant, the most common type of which is an authorization code.
    server.grant(oauth2orize.grant.code(async (client, redirectURI, user, ares, done) => {
        try {
            const grantCode = await oauthStorage.storeGrantCode({ clientId: client.clientId, redirectURI, userId: user.id, scope: ares.scope })
            done(null, grantCode.code)
        } catch (err) {
            done(err)
        }
    }))

    // After a client has obtained an authorization grant from the user, that grant can be exchanged for an access token.
    server.exchange(oauth2orize.exchange.code(async function (client, code, redirectURI, done) {
        try {
            const grantCode = await oauthStorage.findGrantCode({ code })
            if (client.id !== grantCode.clientId) { return done(null, false) }
            if (redirectURI !== grantCode.redirectURI) { return done(null, false) }

            const accessToken = await oauthStorage.storeAccessToken({
                userId: grantCode.user, clientId: grantCode.oauthClient, redirectURI, scope: grantCode.scope
            })
            done(null, accessToken.token)
        } catch (err) {
            done(err)
        }
    }))

    // When a client requests authorization, it will redirect the user to an authorization endpoint.
    // The server must authenticate the user and obtain their permission.
    app.get('/oauth/start',
        ensureLoggedIn(),
        server.authorize(async function (clientId, redirectURI, done) {
            try {
                const client = await oauthStorage.findClient({ id: clientId })

                if (!client) { return done(null, false) }
                // if (client.redirectURI !== redirectURI) { return done(null, false) }

                return done(null, client, redirectURI)
            } catch (err) {
                done(err)
            }
        }),
        function (req, res) {
            // req.oauth2.transactionID, req.oauth2.client, req.user
            if (req.oauth2.client.privileged) {
                res.redirect(`/oauth/decision?transaction_id=${encodeURIComponent(req.oauth2.transactionID)}`)
            } else {
                res.send("We kinda don't have a consent screen yet  :(")
            }
        }
    )

    // The application renders a dialog asking the user to grant access. The resulting form submission is processed using decision middleware.
    app.post('/oauth/decision',
        ensureLoggedIn(),
        server.decision()
    )
    app.get('/oauth/decision', ensureLoggedIn(), transactionLoader(server), (req, res, next) => {
        if (!req.oauth2 || !req.oauth2.client || !req.oauth2.client.privileged) {
            return res.status(403).send("You can't send the user here directly")
        }
        req.body = {}

        const [decision] = server.decision().slice(-1)
        decision(req, res, next)
    })

    // Client (deserialization)
    server.serializeClient(async (client, done) => {
        return done(null, client.clientId);
    });

    server.deserializeClient(async (id, done) => {
        try {
            done(null, await oauthStorage.findClient({ id }))
        } catch (err) {
            done(err)
        }
    })

    passport.use(new ClientPasswordStrategy(async (clientId, clientSecret, done) => {
        try {
            const client = await oauthStorage.findClient({ id: clientId })

            if (!client) { return done(null, false); }
            if (client.clientSecret != clientSecret) { return done(null, false); }
            return done(null, client);
        } catch (err) {
            done(err)
        }
    }))

    passport.use(new BearerStrategy(async (accessToken, done) => {
        try {
            const token = await oauthStorage.findAccessToken(accessToken)
            if (!token) {
                return done(null, false)
            }
            
            if (!token.oauthClient) {
                return done(null, false)
            }
            
            const client = await oauthStorage.findClient({id: token.oauthClient})
            client.userId = token.user
            done(null, client, { scope: '*' })
        } catch (err) {
            done(err)
        }
    }
    ))

    // Once a user has approved access, the authorization grant can be exchanged by the client for an access token.
    app.post('/oauth/token',
        passport.authenticate(['oauth2-client-password'], { session: false }),
        server.token(),
        server.errorHandler()
    )

    // Specific for WB WordPress, let it know the internal user ID
    app.get('/oauth/profile',
        passport.authenticate('bearer', { session: false }),
        async function (req, res) {
            const user = await userStorage.findById(req.user.userId)
            res.json({id: user['id']})
        }
    )
}