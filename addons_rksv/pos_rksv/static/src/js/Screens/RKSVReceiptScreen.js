odoo.define('pos_rksv.ReceiptScreenWidget', function(require) {
    'use strict';

    const ReceiptScreenWidget = require('point_of_sale.ReceiptScreen');
    const Registries = require('point_of_sale.Registries');

    const RKSVReceiptScreen = (ReceiptScreen) =>
        class extends ReceiptScreen {
            _shouldAutoPrint() {
                if (!this.pos.config.iface_rksv)
                    return super(...arguments);
                console.log("We always must print the receipt");
                return true && !this.pos.get_order()._printed;
            }
        };

    Registries.Component.extend(ReceiptScreen, RKSVReceiptScreen);

    return ReceiptScreen;
});