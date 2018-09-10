import AuthBackend, { getRootOrigin } from './backend';
import Storage from './storage';
import setupUi from './react'
// import registerServiceWorker from './registerServiceWorker';

const backend = new AuthBackend(getRootOrigin())
const storage = new Storage()
const services = {
    postAuthRedirect: async () => {
        const url = await storage.getReturnTo()
        if (url) {
            window.location.href = url
        }
    }
}
setupUi({backend, storage, services})

// registerServiceWorker();
