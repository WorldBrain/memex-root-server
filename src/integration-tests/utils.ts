export function fixSessionCookie(response, agent) {
    // See this bug https://github.com/facebook/jest/issues/3547
    for (const setCookieHeader of response.headers['set-cookie'] || []) {
        agent.jar.setCookie(setCookieHeader.split(';')[0]);
    }
}
