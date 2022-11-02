odoo.define('pos_rksv.RKSVPaymentScreen', function(require) {
    'use strict';

    const { useState } = owl;
    const { useListener } = require("@web/core/utils/hooks");
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const Registries = require('point_of_sale.Registries');

    const RKSVPaymentScreen = (PaymentScreen) =>
        class extends PaymentScreen {
            setup() {
                super.setup();
                this.rksvstate = useState({
                    'validate': true,
                });
            }
            mounted() {
                if (!this.env.pos.config.iface_rksv) { return; }
                this.env.proxy.on('change:status', this, this._onChangeStatus);
            }
            willUnmount() {
                if (!this.env.pos.config.iface_rksv) { return; }
                this.env.proxy.off('change:status', this, this._onChangeStatus);
            }
            _onChangeStatus(posProxy, statusChange) {
                // Do disable validate button
                if (!this.env.pos.rksv.all_ok()) {
                    this.rksvstate.validate = false;
                } else {
                    this.rksvstate.validate = true;
                }
            }

        };

    Registries.Component.extend(PaymentScreen, RKSVPaymentScreen);

    return PaymentScreen;
});