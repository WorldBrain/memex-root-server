const some = require('lodash/some')
const moment = require('moment')
import * as request from 'request-promise-native'

export function subscriptionsCheckAutomaticBackup({wooCommerceCredentials}) {
    return async function({userId}) {
        const response = await request('https://worldbrain.io/wp-json/wc/v1/subscriptions', {
            auth: { user: wooCommerceCredentials.id, pass: wooCommerceCredentials.secret  },
            qs: { customer: userId },
            json: true,
        })
        
        return response && _getSubscriptionInfo(response)
    }
}

export const WC_BACKUP_PRODUCT_ID = 7542

export interface WooCommerceEntry {
    status : 'pending' | 'on-hold' | 'active' | 'cancelled' | 'pending-cancel' | 'expired'
    line_items : {product_id : number}[]
    end_date : string
}

export function _getSubscriptionInfo(wooCommerceData : WooCommerceEntry[]) : {active : boolean, endDate : Date} {
    let info = {active: false, endDate: null}
    for (const entry of wooCommerceData) {
        if (entry.status !== 'active' && entry.status !== 'pending-cancel') {
            continue
        }

        if (!some(entry.line_items, item => item.product_id === WC_BACKUP_PRODUCT_ID)) {
            continue
        }

        if (!entry.end_date) {
            // We won't find anything better than a never-ending subscription
            return {active: true, endDate: null}
        }

        const endDate = moment(entry.end_date).toDate()
        if (info.endDate) {
            if (endDate.getTime() > info.endDate.getTime()) {
                info.endDate = endDate
            }
        } else {
            info = {active: true, endDate}
        }
    }
    return info
}
