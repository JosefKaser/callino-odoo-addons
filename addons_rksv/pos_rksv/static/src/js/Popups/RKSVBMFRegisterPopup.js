odoo.define('pos_rksv.RKSVBMFRegisterPopup', function (require) {
    "use strict";

    const RKSVPopupWidget = require('pos_rksv.RKSVPopupWidget');
    const Registries = require('point_of_sale.Registries');

    class RKSVBMFRegisterPopup extends RKSVPopupWidget {
        execute() {
            var self = this;
            this.state.loading = 'Registrierung läuft...';
            if (this.env.pos.rksv.check_proxy_connection()){
                var local_params = {
                    'name': this.env.pos.config.name
                };
                this.env.pos.rksv.proxy_rpc_call(
                    '/hw_proxy/rksv_kasse_registrieren',
                    Object.assign(local_params, this.env.pos.rksv.get_rksv_info(), this.env.pos.rksv.get_bmf_credentials()),
                    this.env.pos.rksv.timeout
                ).then(
                    function done(response) {
                        if (response.success === false) {
                            self.state.failure = response.message;
                            // Request a status update here
                            self.env.pos.rksv.update_bmf_rk_status();
                        } else {
                            self.state.success = response.message;
                            // Request a status update here
                            self.env.pos.rksv.update_bmf_rk_status();
                        }
                    },
                    function failed() {
                        self.state.failure = "Fehler bei der Kommunikation mit der PosBox!";
                    }
                );
            } else {
                self.state.failure = "Fehler bei der Kommunikation mit der PosBox (Proxy nicht initialisiert)!";
            }
            this.state.execute_available = false;
        }
    }
    /*RKSVBMFRegisterPopup.defaultProps = {
        title: 'Kasse beim BMF registrieren',
        body: 'Registrierkasse wird über Finanzonline registriert.',
        exec_button_title: 'Registrieren',
        kundeninfo: '',
    };*/
    Registries.Component.add(RKSVBMFRegisterPopup);

    return RKSVBMFRegisterPopup;
});