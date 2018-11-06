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

export function subscriptionsCancelAutomaticBackup() {
    
}

export const WC_BACKUP_PRODUCT_ID = 7542

export interface WooCommerceEntry {
    status : 'pending' | 'on-hold' | 'active' | 'cancelled' | 'pending-cancel' | 'expired'
    line_items : {product_id : number}[]
    end_date : string
}

export function _getActiveSubscription(wooCommerceData : WooCommerceEntry[]) : WooCommerceEntry {
    let activeSubscription : WooCommerceEntry = null, activeEndDate = null
    for (const entry of wooCommerceData) {
        if (entry.status !== 'active' && entry.status !== 'pending-cancel') {
            continue
        }

        if (!some(entry.line_items, item => item.product_id === WC_BACKUP_PRODUCT_ID)) {
            continue
        }

        if (!entry.end_date) {
            // We won't find anything better than a never-ending subscription
            return entry
        }

        const endDate = moment(entry.end_date).toDate()
        if (activeEndDate) {
            if (endDate.getTime() > activeEndDate.getTime()) {
                activeSubscription = entry
                activeEndDate = endDate
            }
        } else {
            activeSubscription = entry
            activeEndDate = endDate
        }
    }

    return activeSubscription
}

export function _getSubscriptionInfo(wooCommerceData : WooCommerceEntry[]) : {active : boolean, endDate : Date} {
    const activeSubscription = _getActiveSubscription(wooCommerceData)
    if (activeSubscription) {
        return {active: false, endDate: null}
    }
    
    return {active: true, endDate: moment(activeSubscription.end_date).toDate()}
}
