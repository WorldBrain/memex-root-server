import * as passport from 'passport'
import * as oauth2orize from 'oauth2orize'
import { ensureLoggedIn } from 'connect-ensure-login'
import { OAuthStorage } from '../components/storage/modules/oauth'

export function setupOAuthRoutes(
    {app, oauthStorage} :
    {app, oauthStorage : OAuthStorage}
) {
    var server = oauth2orize.createServer()

    // A client must obtain permission from a user before it is issued an access token.
    // This permission is known as a grant, the most common type of which is an authorization code.
    server.grant(oauth2orize.grant.code(async (client, redirectUri, user, ares, done) => {
        try {
            const grantCode = await oauthStorage.storeGrantCode({clientId: client.id, redirectUri, userId: user.id, scope: ares.scope})
            done(null, grantCode.code)
        } catch(err) {
            done(err)
        }
    }))

    // After a client has obtained an authorization grant from the user, that grant can be exchanged for an access token.
    server.exchange(oauth2orize.exchange.code(async function (client, code, redirectUri, done) {
        try {
            const grantCode = await oauthStorage.findGrantCode({code})
            if (client.id !== grantCode.clientId) { return done(null, false) }
            if (redirectUri !== grantCode.redirectUri) { return done(null, false) }

            const accessToken = await oauthStorage.storeAccessToken({
                userId: grantCode.userId, clientId: grantCode.clientId, redirectUri, scope: grantCode.scope
            })
            done(null, accessToken.token)
        } catch (err) {
            done(err)
        }
    }))

    // When a client requests authorization, it will redirect the user to an authorization endpoint.
    // The server must authenticate the user and obtain their permission.
    app.get('/dialog/authorize',
        ensureLoggedIn(),
        server.authorize(async function (clientId, redirectURI, done) {
            try {
                const client = await oauthStorage.findClient({id: clientId})

                if (!client) { return done(null, false) }
                if (client.redirectUri != redirectURI) { return done(null, false) }
                return done(null, client, client.redirectURI)
            } catch (err) {
                done(err)
            }
        }),
        function (req, res) {
            // req.oauth2.transactionID, req.oauth2.client, req.user
            if (req.oauth2.client.privileged) {
                res.redirect('/dialog/authorize/decision')
            } else {
                res.send("We kinda don't have a consent screen yet  :(")
            }
        }
    )

    // The application renders a dialog asking the user to grant access. The resulting form submission is processed using decision middleware.
    app.post('/dialog/authorize/decision',
        ensureLoggedIn(),
        server.decision()
    )
    app.get('/dialog/authorize/decision', ensureLoggedIn(), (req, res) => {
        if (!req.oauth2 || !req.oauth2.client || req.oauth2.client.privileged) {
            return res.status(403).send("You can't send the user here directly")
        }
        req.body = {}
        server.decision()(req, res)
    })

    // Client (deserialization)
    server.serializeClient(async (client, done) => {
        return done(null, client.id);
    });

    server.deserializeClient(async (id, done) => {
        try {
            done(null, await oauthStorage.findClient({id}))
        } catch (err) {
            done(err)
        }
    })

    // Once a user has approved access, the authorization grant can be exchanged by the client for an access token.
    app.post('/token',
        passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
        server.token(),
        server.errorHandler()
    )

    // Once an access token has been issued, a client will use it to make API requests on behalf of the user.
    // app.get('/api/userinfo',
    //     passport.authenticate('bearer', { session: false }),
    //     function (req, res) {
    //         res.json(req.user);
    //     }
    // )
}