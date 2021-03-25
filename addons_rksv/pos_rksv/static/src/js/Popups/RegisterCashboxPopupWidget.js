odoo.define('pos_rksv.RegisterCashboxPopupWidget', function (require) {
    "use strict";

    const { useState, useRef } = owl.hooks;
    const RKSVPopupWidget = require('pos_rksv.RKSVPopupWidget');
    const Registries = require('point_of_sale.Registries');

    class RegisterCashboxPopupWidget extends RKSVPopupWidget {
        constructor() {
            super(...arguments);
            this.cashbox_start_receipt_nr = useRef('cashbox_start_receipt_nr');
        }
        mounted() {
            this.passwordRef.el.focus();
        }
        execute() {
            var self = this;
            this.state.loading = 'Mit PosBox verknüpfen';
            var start_nr = $(this.cashbox_start_receipt_nr.el).val();
            if ((!start_nr) || (!$.isNumeric( start_nr ))) {
                start_nr = 1;
            }
            var pos = this.env.pos;
            if (!pos.rksv.check_proxy_connection()) {
                this.state.loading = false;
            }
            var local_params = {
                'name': pos.config.name,
                'start_nr': parseInt(start_nr),
            };
            pos.rksv.proxy_rpc_call(
                '/hw_proxy/register_cashbox',
                Object.assign(local_params, pos.rksv.get_rksv_info()),
                pos.rksv.timeout
            ).then(
                function done(response) {
                    if (response.success === false) {
                        self.state.failure = response.message;
                        // Request a status update here
                        pos.rksv.update_bmf_rk_status();
                    } else {
                        self.state.success = response.message;
                        pos.set('cashbox_mode', 'active');
                        // Request a status update here
                        pos.rksv.update_bmf_rk_status();
                    }
                },
                function failed() {
                    self.state.failure = "Fehler bei der Kommunikation mit der PosBox!";
                }
            );
            this.state.execute_available = false;

        }
    }
    RegisterCashboxPopupWidget.template = 'RegisterCashboxPopupWidget';
    RegisterCashboxPopupWidget.defaultProps = {
        title: 'Kasse mit PosBox verknüpfen',
        exec_button_title: 'Verknüpfen',
        kundeninfo: '',
    };
    Registries.Component.add(RegisterCashboxPopupWidget);

    return RegisterCashboxPopupWidget;
});