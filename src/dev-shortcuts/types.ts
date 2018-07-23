export interface DevShortcutCommand {
    name : string
    options : {[key : string] : string}
}

export interface DevShortcutsConfig extends Array<DevShortcutCommand> {
}

export type DevShortcutHandler = (options : {[key : string] : any}) => Promise<void>

export interface DevShortcut {
    handler : DevShortcutHandler
}

export interface DevShortcutList extends Array<DevShortcut> {
}

export interface DevShortCutMap {
    [name : string] : DevShortcut
}
