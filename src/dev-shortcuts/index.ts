const _ = require('lodash')
import { AppComponents } from '../components'
import { AppControllers } from '../controllers'
import { DevShortcutsConfig, DevShortcutList, DevShortCutMap, DevShortcut } from './types'
import shortcuts from './shortcuts'

export async function executeDevShortcuts(
    {components, controllers, config} :
    {components : AppComponents, controllers : AppControllers, config : DevShortcutsConfig}
) {
    const shortcutMap = _createDevShortcutMap(shortcuts)
    for (const shortcutConfig of config) {
        await shortcutMap[shortcutConfig.name].handler({components, controllers, ...shortcutConfig.options})
    }
}

export function _createDevShortcutMap(list : DevShortcutList) : DevShortCutMap {
    return _.fromPairs(list.map((shortcut : DevShortcut) => [_.kebabCase(shortcut.handler.name), shortcut]))
}
