export async function securelyValidateAdminAccessCode({accessCode, suppliedAccessCode} : {accessCode : string, suppliedAccessCode : string}) {
    const youShallNotPass = () => new Promise(resolve => setTimeout(() => resolve(false), 10 * 1000))

    if (!accessCode || !accessCode.trim()) {
        return await youShallNotPass()
    }
    if (suppliedAccessCode !== accessCode) {
        return await youShallNotPass()
    }

    return true
}
