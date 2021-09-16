odoo.define('pos_rksv.ReceiptScreenWidget', function(require) {
    'use strict';

    const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    const Registries = require('point_of_sale.Registries');

    const RKSVReceiptScreen = (ReceiptScreen) =>
        class extends ReceiptScreen {
            _shouldAutoPrint() {
                if (!this.env.pos.config.iface_rksv) {
                    return super._shouldAutoPrint();
                }
                return true && !this.env.pos.get_order()._printed;
            }
            _shouldCloseImmediately() {
                if (this.props.forceClose) {
                    return true;
                }
                return super._shouldCloseImmediately();
            }
        };

    Registries.Component.extend(ReceiptScreen, RKSVReceiptScreen);

    return ReceiptScreen;
});