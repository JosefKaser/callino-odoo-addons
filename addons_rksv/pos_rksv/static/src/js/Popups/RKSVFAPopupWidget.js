odoo.define('pos_rksv.RKSVFAPopupWidget', function (require) {
    "use strict";

    const { useState } = owl;
    const { useListener } = require("@web/core/utils/hooks");
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');

    class RKSVFAPopupWidget extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.state = useState({
                message: false,
                serial: '',
                cashregisterid: '',
                uid: '',
                startbeleg: false,
                rksvfa_image: false,
            });
        }
        mounted(){
            var self = this;
            var signature = this.env.pos.get('signature');
            // Not sure if we need a signature for the starting record, but I guess we do
            if (signature === null){
                this.state.message = "Keine Signatureinheit !";
                return;
            }
            this.state.serial = signature.get('serial');
            this.state.cashregisterid = this.env.pos.config.cashregisterid;
            this.state.uid = this.env.pos.company.vat;
            this.state.message = "Bitte warten...";
            this.pos.env.proxy.connection.rpc(
                    '/hw_proxy/rksv_get_fa_data',
                    Object.assign(this.env.pos.rksv.get_rksv_info()),
                    {timeout: 7500}
                ).then(
                function done(response) {
                    self.state.message = false;
                    self.state.aes_key = "..." + response.aes_key.substring(response.aes_key.length - 10, 8);
                    if (response.start_receipt && response.start_receipt.qrcodeImage){
                        self.state.rksvfa_image = response.start_receipt.qrcodeImage;
                        self.state.startbeleg = true;
                    } else {
                        self.state.startbeleg = false;
                    }
                },
                function failed() {
                    self.state.message = 'Konnte Daten nicht von PosBox laden.'
                }
            );
        }
    }

    RKSVFAPopupWidget.template = 'RKSVFAPopupWidget';
    /*RKSVFAPopupWidget.defaultProps = {
        title: 'Finanzamt Daten',
    };*/

    Registries.Component.add(RKSVFAPopupWidget);

    return RKSVFAPopupWidget;
});