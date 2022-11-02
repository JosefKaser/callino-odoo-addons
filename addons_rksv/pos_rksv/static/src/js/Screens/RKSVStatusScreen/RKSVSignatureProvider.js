odoo.define('pos_rksv.RKSVSignatureProvider', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { Gui } = require('point_of_sale.Gui');
    const { useListener, useBus } = require("@web/core/utils/hooks");
    const { onMounted, onWillUnmount, useState } = owl;

    class RKSVSignatureProvider extends PosComponent {
        setup() {
            super.setup();
            var self = this;
            this.state = useState({
                color: 'red',
                message: 'Unbekannter Status',
                cashbox_mode: 'setup',
                bmf_last_status: 'UNKNOWN',
                signature: this.props.signature,
                serial: this.props.signature.serial,
            });
            useListener('change:bmf_status change:bmf_message change:bmf_last_status', function(signature) {
                self.set_signature_state(signature);
            });
            onMounted(() => {
                this.set_signature_state(this.state.signature);
                var sig = this.state.signature;
                var signature = null;
                $(this.env.pos.signatures).each(function(id, sprov) {
                    if (sprov.serial == sig.serial) {
                        signature = sprov;
                    }
                });
                if (typeof signature.try_refresh_status === 'function'){
                    signature.try_refresh_status(this.env.pos);
                }
            });
        }
        set_signature_state(signature) {
            var self = this;
            var sig = this.props.signature;

            if (signature && (typeof signature.isActive === 'function') && !signature.isActive(self.env.pos)) {
                // Ignore this update if it does not belong to the active signature
                return;
            }
            var color = 'red';
            var cashbox_mode = self.env.proxy.get('cashbox_mode');
            self.state.cashbox_mode = self.env.proxy.get('cashbox_mode');
            var message = self.env.proxy.get('bmf_last_status')+ ', ' + (self.env.proxy.get('bmf_message')?self.env.proxy.get('bmf_message'):'');
            if ((signature.bmf_status) && signature.bmf_last_status === 'IN_BETRIEB' && (cashbox_mode === 'active' || cashbox_mode === 'setup')) {
                color = 'green';
                message = 'Signatureinheit registriert und aktiv';
            } else if (signature.bmf_last_status === 'AUSFALL') {
                message = signature.bmf_last_status + ', ' + (signature.bmf_message?ssignature.bmf_message:'');
            }
            self.state.message = message;
            self.state.color = color;
        }
        get valid_vat() {
            var sig = this.props.signature;
            var signature = null;
            $(this.env.pos.signatures).each(function(id, sprov) {
                if (sprov.serial == sig.serial) {
                    signature = sprov;
                }
            });
            if (signature && (typeof signature.matchVAT === 'function') && signature.matchVAT(this.env.pos.company.bmf_vat_number)) {
                return true;
            }
            // Try to match against Steuernummer
            if (signature && (typeof signature.matchTaxNumber === 'function') && signature.matchTaxNumber(this.env.pos.company.bmf_tax_number)) {
                return true;
            }
            return false;
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
        async bmf_register_dead() {
            var self = this;
            Gui.showPopup('RKSVPopupWidget', {
                'title': "Ausfallmodus",
                'body':  "Ausfallmodus der Signatureinheit aktivieren",
                'exec_button_title': 'Ausfall melden',
                'execute': function(popup) {
                    if (!self.env.pos.rksv.check_proxy_connection()) {
                        popup.state.failure = 'Kommunikation mit der PosBox ist nicht möglich !';
                        return;
                    }
                    popup.state.body = 'Signatureinheit Ausfall melden...';
                    var local_params = {
                        'kundeninfo': $(popup.kundeninfo.el).val(),
                        'serial': self.state.serial,
                    };
                    self.env.pos.rksv.proxy_rpc_call(
                        '/hw_proxy/ausfall_signatureinheit',
                        Object.assign(local_params, self.env.pos.rksv.get_rksv_info(), self.env.pos.rksv.get_bmf_credentials()),
                        self.timeout
                    ).then(
                        function done(response) {
                            if (response.success === false) {
                                popup.state.failure = response.message;
                            } else {
                                popup.state.success = response.message;
                            }
                        },
                        function failed() {
                            popup.state.failure = "Fehler bei der Kommunikation mit der PosBox!";
                        }
                    );
                },
            });
        }
        async bmf_register_working() {
            var self = this;
            Gui.showPopup('RKSVPopupWidget', {
                'title': "Ausfallmodus",
                'body':  "Ausfallmodus der Signatureinheit beenden",
                'exec_button_title': 'Ausfall beenden',
                'execute': function(popup) {
                    if (!self.env.pos.rksv.check_proxy_connection()) {
                        popup.state.failure = 'Kommunikation mit der PosBox ist nicht möglich !';
                        return;
                    }
                    popup.state.body = 'Signatureinheit Ausfall beenden...';
                    var local_params = {
                        'kundeninfo': $(popup.kundeninfo.el).val(),
                        'serial': self.state.serial,
                    };
                    self.env.pos.rksv.proxy_rpc_call(
                        '/hw_proxy/wiederinbetriebnahme_signatureinheit',
                        Object.assign(local_params, self.env.pos.rksv.get_rksv_info(), self.env.pos.rksv.get_bmf_credentials()),
                        self.timeout
                    ).then(
                        function done(response) {
                            if (response.success === false) {
                                popup.state.failure = response.message;
                            } else {
                                popup.state.success = response.message;
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
            var signature = null;
            var sig = self.props.signature;
            $(this.env.pos.signatures).each(function(id, sprov) {
                if (sprov.serial == sig.serial) {
                    signature = sprov;
                }
            });
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
                                self.state.message = response.status.status;
                                self.state.color = 'green';
                                self.pos.rksv.statuses.signatureinheit = true;
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
            var self = this;
            Gui.showPopup('RKSVPopupWidget', {
                'title': 'Signatureinheit aktiviern',
                'body': 'Die gewählte Signatureinheit wird als aktive Signatureinheit ausgewählt',
                'exec_button_title': 'Aktivieren',
                'execute': function(popup) {
                    self.env.posbus.trigger('set-signature', self.props.signature.serial.toString());
                    popup.state.success = "Neue Signatureinheit wurde aktiv gesetzt.";
                }
            });

        }

    }
    RKSVSignatureProvider.template = 'RKSVSignatureProvider';

    Registries.Component.add(RKSVSignatureProvider);

    return RKSVSignatureProvider;
});
