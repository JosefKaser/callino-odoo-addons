odoo.define('pos_rksv.DebugWidget', function(require) {
    'use strict';

    const DebugWidget = require('point_of_sale.DebugWidget');
    const Registries = require('point_of_sale.Registries');
    const { Gui } = require('point_of_sale.Gui');
    const { useRef } = owl;

    const RKSVDebugWidget = (DebugWidget) =>
        class extends DebugWidget {
            async rksv_firstreport() {
                this.showPopup('RKSVFAPopupWidget');
            }
            async rksv_status() {
                this.showScreen('RKSVStatusScreen', {
                    stay_open: true
                });
            }
            async rksv_create_null_receipt() {
                var self = this;
                var order = this.env.pos.rksv.create_dummy_order(this.env.pos.config.null_product_id[0]);
                // Sign Order
                this.env.pos.push_single_order(order).then(
                    function done() {
                        self.showScreen('ReceiptScreen', {
                            forceClose: true
                        });
                    },
                    function failed() {
                        Gui.showPopup('RKSVFailureWidget', {
                            'title': "Fehler",
                            'body':  "Nullbeleg konnte nicht erstellt werden !"
                        });
                    }
                );

            }
            async rksv_write_dep_crypt_container() {
                var self = this;
                if (!this.env.pos.rksv.check_proxy_connection()) {
                    Gui.showPopup('RKSVFailureWidget', {
                        'title': "Fehler",
                        'body':  "PosBox Verbindung wird für diese Funktion benötigt !"
                    });
                    return;
                }
                Gui.showPopup('RKSVPopupWidget', {
                    'title': "DEP Export",
                    'body': "DEP Crypt Container schreiben",
                    'exec_button_title': 'Erzeugen',
                    'execute': function (popup) {
                        self.pos.env.proxy.connection.rpc(
                            '/hw_proxy/rksv_write_dep_crypt_container',
                            Object.assign(self.env.pos.rksv.get_rksv_info()),
                            {timeout: 7500}
                        ).then(
                            function done(response) {
                                if (response.success === false) {
                                    popup.state.failure = response.message;
                                } else {
                                    self.env.pos.rpc({
                                        model: 'pos.config',
                                        method: 'sync_jws',
                                        args: [self.env.pos.config.id, response.jws_sync]
                                    }).then(
                                        function done(result) {
                                            if (!result.success) {
                                                popup.state.failure = result.message;
                                            } else {
                                                popup.state.success = result.message;
                                            }
                                        },
                                        function failed(message) {
                                            popup.state.failure = message;
                                        }
                                    );
                                    popup.state.success = response.message;
                                }
                            },
                            function failed() {
                                popup.state.failure = "Fehler bei der Kommunikation mit der PosBox!";
                            }
                        );
                    }
                });
            }
            async bmf_register_start_receipt() {
                var self = this;
                Gui.showPopup('RKSVPopupWidget', {
                    'title': "Startbeleg",
                    'body':  "Startbeleg an BMF senden",
                    'exec_button_title': 'Senden',
                    'execute': function(popup) {
                        popup.state.loading = 'Startbeleg wurde übermittelt und wird gerade überprüft!!!';
                        self.env.pos.rksv.bmf_register_start_receipt_rpc().then(
                            function done(response) {
                                if (response.success == false) {
                                    popup.state.failure = response.message;
                                } else {
                                    popup.state.success = "Startbeleg wurde erfolgreich übermittelt !";
                                    popup.state.execute_available = false;
                                }
                            },
                            function failed(message) {
                                popup.state.failure = message;
                            }
                        );
                    },
                });
            }
            async bmf_status_rk() {
                if (!this.env.pos.rksv.bmf_auth_data()) {
                    Gui.showPopup('RKSVFailureWidget', {
                        'title': "Fehler",
                        'body':  "Daten für die Anmeldung bei Finanzonline fehlen."
                    });
                    return;
                }
                var self = this;
                Gui.showPopup('RKSVPopupWidget', {
                    'title': "BMF Kassenstatus",
                    'body':  "Status der Kasse abfragen",
                    'exec_button_title': 'Abfrage starten',
                    'execute': function(popup) {
                        if (self.env.pos.rksv.check_proxy_connection()){
                            self.env.pos.rksv.bmf_status_rpc_call().then(
                                function done(response) {
                                    self.env.proxy.set('bmf_status_rk', response);
                                    if (response.success === false) {
                                        popup.state.failure = response.message;
                                    } else {
                                        popup.state.success = response.message;
                                        self.env.pos.rksv.statuses.kasse = true;
                                        popup.state.execute_available = false;
                                    }
                                },
                                function failed() {
                                    self.env.proxy.set('bmf_status_rk', {
                                        'success': false,
                                        'message': "Fehler bei der Kommunikation mit der PosBox!"
                                    });
                                    popup.state.failure = "Fehler bei der Kommunikation mit der PosBox!";
                                }
                            );
                        } else {
                            self.env.proxy.set('bmf_status_rk', {
                                'success': false,
                                'message': "Fehler bei der Kommunikation mit der PosBox (Proxy nicht initialisiert)!"
                            });
                            popup.state.failure = "Fehler bei der Kommunikation mit der PosBox (Proxy nicht initialisiert)!";
                        }
                    },
                });
            }
            async rksv_reprint_start_receipt() {
                var self = this;
                if (!this.env.pos.rksv.check_proxy_connection()) {
                    Gui.showPopup('RKSVFailureWidget', {
                        'title': "Fehler",
                        'body':  "PosBox Verbindung wird für diese Funktion benötigt !"
                    });
                    return;
                }
                // Get minimal data needed for printing from the posbox
                this.env.proxy.connection.rpc(
                    '/hw_proxy/get_start_receipt',
                    Object.assign(this.env.pos.rksv.get_rksv_info()),
                    {timeout: 7500}
                ).then(
                    function done(response) {
                        if (response.success === false) {
                            Gui.showPopup('RKSVFailureWidget', {
                                'title': "Fehler",
                                'body':  response.message
                            });
                        } else {
                            // in response we should have the needed data to reprint - we assume to have a pos printer here
                            var receipt = response.receipt;
                            receipt.company = self.env.pos.company;
                            receipt.title = "Startbeleg";
                            self.showPopup('RKSVReceiptPopup', {
                                title: "Startbeleg",
                                receipt: receipt,
                            });
                        }
                    },
                    function failed() {
                        Gui.showPopup('RKSVFailureWidget', {
                            'title': "Fehler",
                            'body':  "Fehler bei der Kommunikation mit der PosBox!"
                        });
                    }
                );
            }
            async rksv_reprint_year_receipt() {
                var self = this;
                if (!this.env.pos.rksv.check_proxy_connection()) {
                    Gui.showPopup('RKSVFailureWidget', {
                        'title': "Fehler",
                        'body':  "PosBox Verbindung wird für diese Funktion benötigt !"
                    });
                    return;
                }
                // Get minimal data needed for printing from the posbox
                this.env.proxy.connection.rpc(
                    '/hw_proxy/get_year_receipt',
                    Object.assign(this.env.pos.rksv.get_rksv_info()),
                    {timeout: 7500}
                ).then(
                    function done(response) {
                        if (response.success === false) {
                            Gui.showPopup('RKSVFailureWidget', {
                                'title': "Fehler",
                                'body':  response.message
                            });
                        } else {
                            // in response we should have the needed data to reprint - we assume to have a pos printer here
                            var receipt = response.receipt;
                            receipt.company = self.env.pos.company;
                            receipt.title = "Jahresbeleg";
                            self.showPopup('RKSVReceiptPopup', {
                                title: "Jahresbeleg",
                                receipt: receipt,
                            });
                        }
                    },
                    function failed() {
                        Gui.showPopup('RKSVFailureWidget', {
                            'title': "Fehler",
                            'body':  "Fehler bei der Kommunikation mit der PosBox!"
                        });
                    }
                );
            }
            async rksv_reprint_month_receipt(type, title) {
                var self = this;
                if (!this.env.pos.rksv.check_proxy_connection()) {
                    Gui.showPopup('RKSVFailureWidget', {
                        'title': "Fehler",
                        'body':  "PosBox Verbindung wird für diese Funktion benötigt !"
                    });
                    return;
                }
                // Get minimal data needed for printing from the posbox
                this.env.proxy.connection.rpc(
                    '/hw_proxy/get_month_receipt',
                    Object.assign(this.env.pos.rksv.get_rksv_info()),
                    {timeout: 7500}
                ).then(
                    function done(response) {
                        if (response.success === false) {
                            Gui.showPopup('RKSVFailureWidget', {
                                'title': "Fehler",
                                'body':  response.message
                            });
                        } else {
                            // in response we should have the needed data to reprint - we assume to have a pos printer here
                            var receipt = response.receipt;
                            receipt.company = self.env.pos.company;
                            receipt.title = "Monatsbeleg";
                            self.showPopup('RKSVReceiptPopup', {
                                title: "Monatsbeleg",
                                receipt: receipt,
                            });
                        }
                    },
                    function failed() {
                        Gui.showPopup('RKSVFailureWidget', {
                            'title': "Fehler",
                            'body':  "Fehler bei der Kommunikation mit der PosBox!"
                        });
                    }
                );
            }
        };

    Registries.Component.extend(DebugWidget, RKSVDebugWidget);

    return DebugWidget;
});
