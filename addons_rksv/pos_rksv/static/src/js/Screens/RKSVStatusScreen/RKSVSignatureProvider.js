odoo.define('pos_rksv.RKSVSignatureProvider', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { Gui } = require('point_of_sale.Gui');
    const { useState } = owl;

    class RKSVSignatureProvider extends PosComponent {
        constructor() {
            super(...arguments);
            var self = this;
            this.state = useState({
                color: 'red',
                message: 'Unbekannter Status',
                cashbox_mode: 'setup',
                bmf_last_status: 'UNKNOWN',
                signature: arguments[1].signature,
                serial: arguments[1].signature.get('serial'),
            });
            this.env.pos.signatures.bind('change:bmf_status change:bmf_message change:bmf_last_status', function(signature) {
                if (!signature.isActive(self.env.pos)) {
                    // Ignore this update if it does not belong to the active signature
                    return;
                }
                var color = 'red';
                var cashbox_mode = self.env.pos.get('cashbox_mode');
                self.state.cashbox_mode = self.env.pos.get('cashbox_mode');
                var message = signature.get('bmf_last_status')+ ', ' + (signature.get('bmf_message')?signature.get('bmf_message'):'');
                if ((signature.get('bmf_status')) && signature.get('bmf_last_status') === 'IN_BETRIEB' && (cashbox_mode === 'active' || cashbox_mode === 'setup')) {
                    color = 'green';
                    message = 'Signatureinheit registriert und aktiv';
                } else if (signature.get('bmf_last_status') === 'AUSFALL') {
                    message = signature.get('bmf_last_status')+ ', ' + (signature.get('bmf_message')?signature.get('bmf_message'):'');
                }
                self.state.message = message;
                self.state.color = color;
                //self.auto_open_close();
            });
        }
        get valid_vat() {
            var signature = this.props.signature;
            if (signature.matchVAT(this.env.pos.company.bmf_vat_number)) {
                return true;
            }
            // Try to match against Steuernummer
            if (signature.matchTaxNumber(this.env.pos.company.bmf_tax_number)) {
                return true;
            }
            return false;
        }
        mounted() {
            this.state.signature.try_refresh_status(this.env.pos);
        }
        async bmf_register_signature() {
            var self = this;
            Gui.showPopup('RKSVPopupWidget', {
                'title': "Signatureinheit registrieren",
                'body':  "Die Signatureinheit wird gegenüber dem BMF registriert",
                'kundeninfo_title': 'Bezeichnung',
                'exec_button_title': 'Registrieren',
                'execute': function(popup) {
                    if (!self.env.pos.rksv.check_proxy_connection()) {
                        popup.state.failure = 'Kommunikation mit der PosBox ist nicht möglich !';
                        return;
                    }
                    popup.state.body = 'Signatureinheit wird registiert...';
                    var local_params = {
                        'kundeninfo': $(popup.kundeninfo.el).val(),
                        'serial': self.state.serial,
                    };
                    self.env.pos.rksv.proxy_rpc_call(
                        '/hw_proxy/rksv_signatureinheit_registrieren',
                        Object.assign(local_params, self.env.pos.rksv.get_rksv_info(), self.env.pos.rksv.get_bmf_credentials()),
                        self.timeout
                    ).then(
                        function done(response) {
                            if (response.success === false) {
                                popup.state.failure = response.message;
                            } else {
                                popup.state.success = "Signatureinheit wurde beim BMF registriert !";
                            }
                        },
                        function failed() {
                            popup.state.failure = "Fehler bei der Kommunikation mit der PosBox!";
                        }
                    );
                },
            });
        }
        reload_status() {
            var self = this;
            var signature = this.env.pos.signatures.get(this.props.signature.get('serial'));
            if (!signature) {
                Gui.showPopup('RKSVFailureWidget', {
                    'title': "Fehler",
                    'body':  "Unbekannte Signatureinheit!"
                });
                return;
            }
            Gui.showPopup('RKSVPopupWidget', {
                'title': 'Status der Signatureinheit',
                'body': 'Es wird der aktuelle Status der Signatureinheit über den Webservice der Finanzonline ermittelt.',
                'exec_button_title': 'Status abfragen',
                'kundeninfo': '',
                'execute': function(popup) {
                    popup.state.loading = 'Status wird beim BMF abgefragt...';
                    signature.try_refresh_status(self.env.pos).then(
                        function done(response) {
                            if (response.success == false) {
                                popup.state.failure = response.message;
                            } else {
                                popup.state.success = "Status: " + response.status.status;
                            }
                        },
                        function failed(message) {
                            popup.state.failure = message;
                        }
                    );
                }
            });
        }

        async use_signature() {
            this.trigger('set-signature', this.props.signature.get('serial').toString());
        }

    }
    RKSVSignatureProvider.template = 'RKSVSignatureProvider';

    Registries.Component.add(RKSVSignatureProvider);

    return RKSVSignatureProvider;
});
