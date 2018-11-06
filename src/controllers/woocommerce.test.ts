import { expect } from 'chai'
import { _getSubscriptionInfo, WC_BACKUP_PRODUCT_ID } from './woocommerce';

describe('WooCommerce integration', () => {
    it('should return not active for users that have no orders at all', () => {
        expect(_getSubscriptionInfo([])).to.deep.equal({
            active: false,
            endDate: null
        })
    })

    it('should ignore cancelled payments', () => {
        expect(_getSubscriptionInfo([
            {
                status: 'pending',
                end_date: null,
                line_items: [{product_id: WC_BACKUP_PRODUCT_ID}],
            }
        ])).to.deep.equal({
            active: false,
            endDate: null
        })
    })

    it('should ignore irrelevant subscriptions', () => {
        expect(_getSubscriptionInfo([
            {
                status: 'pending',
                end_date: null,
                line_items: [{product_id: 6667332}],
            }
        ])).to.deep.equal({
            active: false,
            endDate: null
        })
    })

    it('should detect a subscription without an end date', () => {
        expect(_getSubscriptionInfo([
            {
                status: 'active',
                end_date: null,
                line_items: [{product_id: WC_BACKUP_PRODUCT_ID}],
            }
        ])).to.deep.equal({
            active: true,
            endDate: null
        })
    })

    it('should detect an subscription with an end date', () => {
        expect(_getSubscriptionInfo([
            {
                status: 'pending-cancel',
                end_date: '2019-10-30T10:55:52',
                line_items: [{product_id: WC_BACKUP_PRODUCT_ID}],
            }
        ])).to.deep.equal({
            active: true,
            endDate: new Date(2019, 9, 30, 10, 55, 52)
        })
    })
})