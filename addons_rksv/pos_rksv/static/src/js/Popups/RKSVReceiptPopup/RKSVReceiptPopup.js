odoo.define('pos_rksv.RKSVReceiptPopup', function (require) {
    "use strict";

    const { useState, useRef } = owl.hooks;
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');
    const AbstractReceiptScreen = require('point_of_sale.AbstractReceiptScreen');

    /*
    RKSV Receipt Popup Widget
    - does print given special receipt
     */
    class RKSVReceiptPopup extends AbstractReceiptScreen {
        constructor() {
            super(...arguments);
            this.state = useState({
                'title': arguments[1].title,
            });
            this.currentReceipt = arguments[1].receipt;
            this.orderReceipt = useRef('order-receipt');
        }
        mounted() {
            setTimeout(async () => await this.handleAutoPrint(), 0);
        }
        cancel() {
            this.trigger('close-popup');
        }
        async handleAutoPrint() {
            this._printReceipt();
        }

    }

    RKSVReceiptPopup.template = 'RKSVReceiptPopup';
    RKSVReceiptPopup.defaultProps = {
        'title': 'Spezial Beleg',
    };

    Registries.Component.add(RKSVReceiptPopup);

    return RKSVReceiptPopup;
});