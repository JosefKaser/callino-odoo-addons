odoo.define('pos_rksv.RKSVStatusScreen', function(require) {
    'use strict';

    const { useState } = owl;
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { Gui } = require('point_of_sale.Gui');

    class RKSVStatusScreen extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('set-signature', this.__setSignature);
            this.sproviders = null;
            this.stay_open = false;
            this.active = true;

            this.state = useState({
                rksv_posbox_datetime: 'Unbekannt',
                rksv_bmf_version: 'Unbekannt',
                rksv_rksv_version: 'Unbekannt',
                rksv_addon_version: 'Unbekannt',
                posbox_status: 'connecting',
                posbox_message: 'Verbindung herstellen...',
                cashbox_message: 'Status wird ermittelt',
                cashbox_mode: 'active',
                cashbox_color: 'red',
                configuration_color: (this.env.pos.rksv.statuses['rksv_products_exists']?'green':'red'),
                cashbox_activate_display: 'none',
                rksv_status_color: 'red',
                rksv_status_message: 'Status wird abgefragt',
                button_register_cashbox: false,
                button_register_startreceipt: false,
                button_revalidate_startreceipt: false,
                button_delete_startreceipt: false,
                button_export_crypt: false,
                button_start_receipt_set_valid: false,
                signatures: [],
                valid_vat: false,
            });
            if (this.env.pos.config.iface_rksv) {
                this.posbox_status_handler();
                this.rk_status_handler();
                this.se_status_handler();
            }
        }
        mounted() {
            this.active = true;
            if (this.props.stay_open) {
                this.stay_open = this.props.stay_open;
            }else {
                this.stay_open = false;
            }
            this.env.pos.rksv.update_bmf_rk_status();
            // Do rerender signature providers
            this.render_sproviders();
            // This will signal us the new status as soon as we get it
            var signature = this.env.pos.get('signature');
            if (signature) {
                signature.try_refresh_status(this.env.pos);
            }
        }
        willUnmount() {
            this.active = false;
        }
        async close_rksv() {
            this.stay_open = false;
            this.try_to_close();
        }
        async willStart() {
            if (this.env.pos.config.iface_rksv) {
                return $.when();
            } else
                // We do provide a deferred which will never fire
                return $.Deferred();
        }
        async __setSignature(event) {
            var self = this;
            var serial = event.detail;
            var pos = this.env.pos;
            // We also do provide a deferred here for the caller
            var deferred = $.Deferred();
            var message = pos.rksv.dummy_order_checks();
            if (message !== true) {
                deferred.reject(message);
                return deferred;
            }
            this.inform_running = true;
            // We do generate a dummy order, to signal the cashbox the new signature
            var order = pos.rksv.create_dummy_order(pos.config.null_product_id[0], pos.config.cashregisterid);
            // Mark it as null receipt order type
            order.null_receipt = true;
            // Serial must be a string
            order.set_serial = serial;
            // Sign Order
            try {
                let result = await pos.push_single_order(order);
                self.proxy_informed = true;
                self.inform_running = false;
                var mode = pos.get('cashbox_mode');
                if (mode == "signature_failed") {
                    // Set and signal active mode
                    pos.set('cashbox_mode', 'active');
                }
                this.rpc({
                    model: 'pos.config',
                    method: 'set_provider',
                    args: [
                        serial,
                        pos.config.id,
                    ]
                }).then(
                    function done(result) {
                        if (!result['success']) {
                            Gui.showPopup('RKSVFailureWidget', {
                                'title': "RKSV Fehler",
                                'body':  result.message,
                            });
                            deferred.reject(result.message);
                        } else {
                            // To be correct - we do resolve the deferred here - even if we do reload
                            deferred.resolve();
                            location.reload();
                        }
                    },
                    function failed(message) {
                        Gui.showPopup('RKSVFailureWidget', {
                            'title': "Fehler",
                            'body': "Fehler bei der Kommunikation mit Odoo, keine Internet Verbindung vorhhanden ?",
                        });
                        deferred.reject("Fehler bei der Kommunikation mit Odoo, keine Internet Verbindung vorhhanden ?");
                    }
                );
            } catch(err) {
                self.inform_running = false;
                Gui.showPopup('RKSVFailureWidget', {
                    'title': "RKSV Fehler",
                    'body':  message,
                });
                deferred.reject(message);
            }
            return deferred;
        }
        register_cashbox() {
            Gui.showPopup('RegisterCashboxPopupWidget');
        }
        activate_cashbox() {
            Gui.showPopup('RKSVBMFRegisterPopup');
        }
        revalidate_startreceipt() {
            this.env.pos.rksv.bmf_register_start_receipt();
        }
        export_crypt() {
            this.env.pos.rksv.rksv_write_dep_crypt_container();
        }
        delete_startreceipt() {
            this.env.pos.rksv.delete_start_receipt();
        }
        start_receipt_set_valid() {
            this.env.pos.rksv.start_receipt_set_valid();
        }
        manual_close() {
            // Clear the stay open flag
            this.stay_open = false;
            this.try_to_close();
        }
        emergency_mode() {
            return (this.state.cashbox_mode==='signature_failed' || this.state.cashbox_mode==='posbox_failed');
        }
        async activate_signature_failed() {
            var self = this;
            Gui.showPopup('RKSVPopupWidget', {
                'title': "Ausfallmodus",
                'body':  "Ausfallmodus Signatureinheit aktivieren",
                'exec_button_title': 'Ausfallsmodus aktivieren',
                'execute': function(popup) {
                    if (!self.env.pos.rksv.check_proxy_connection()) {
                        popup.state.failure = 'Kommunikation mit der PosBox ist nicht möglich !';
                        return;
                    }
                    popup.state.body = 'Signatureinheit Ausfall aktivieren...';
                    var local_params = {
                        'kundeninfo': $(popup.kundeninfo.el).val(),
                        'serial': self.state.serial,
                    };
                    self.env.pos.rksv.proxy_rpc_call(
                        '/hw_proxy/cashbox_se_failed',
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
        auto_open_close() {
            // Do not open when rksv is not enabled
            if (!this.env.pos.config.iface_rksv) { return; }
            // Do not open when rksv is not intitialized
            if (this.env.pos.rksv === undefined) { return; }
            // Open Status widget on:
            // - Not already active
            // - Not all is ok - or we need a automatic receipt
            // - Not in emergency mode
            // - Do not open on only WLAN lost
            if ((!this.active) && ((!this.env.pos.rksv.all_ok()) || (this.env.pos.rksv.auto_receipt_needed())) && (!this.emergency_mode()) && (!this.env.pos.rksv.lost_wlan())) {
                this.showScreen('RKSVStatusScreen');
            } else if ((this.active) && (!this.env.pos.rksv.all_ok()) && (!this.emergency_mode())) {
                // Already active - ok - stay active
            } else if ((this.active) && ((this.env.pos.rksv.all_ok()) || (this.emergency_mode())) && (!this.env.pos.rksv.auto_receipt_needed())) {
                // Active and everything is ok - or emergency mode - man - do try to close here
                this.try_to_close();
            }
        }
        try_to_close() {
            if (!this.active) {
                return;
            }
            // Is our current signature available?
            if ((this.env.pos.rksv.all_ok() || this.emergency_mode()) && (!this.stay_open) && (!(this.env.pos.config.state === "setup" || this.env.pos.config.state === "failure" || this.env.pos.config.state === "inactive"))) {
                var order = this.env.pos.get_order();
                if (order) {
                    var previous = order.get_screen_data('previous-screen');
                    if ((!previous) || (previous === 'rksv_status')) {
                        this.trigger('show-start-screen');
                    } else {
                        this.showScreen(previous.name);
                    }
                } else {
                    // if no selected order does exist - then there is no previous-screen - so activate startup screen
                    this.trigger('show-start-screen');
                }
            }
        }
        close_pos(){
            this.trigger('close-pos');
        }
        se_status_handler() {
            var self = this;
            if (self.env.pos.signatures === undefined) {
                return;
            }
            // Listen on status update for signaturs - display the change here
            this.env.pos.signatures.bind('add remove', function(signature) {
                // Do rerender the sprovider view
                self.render_sproviders();
            });
        }
        rk_status_handler() {
            var self = this;
            // Listen on status update for kasse
            self.env.pos.bind('change:bmf_status_rk', function(pos, status) {
                //check rk  -needs to be registered with bmf
                if ((!self.env.pos.config.cashregisterid) || (self.env.pos.config.cashregisterid.trim() === "")) {
                    self.state.cashbox_color = 'orange';
                    self.state.cashbox_message = "Keine gültige KassenID ist gesetzt !";
                    self.state.cashbox_activate_display = 'none';
                } else if (status.success) {
                    self.state.cashbox_color = 'green';
                    self.state.cashbox_message = status.message;
                    self.state.cashbox_activate_display = 'none';
                } else {
                    self.state.cashbox_color = 'red';
                    self.state.cashbox_message = status.message;
                    if ((self.env.pos.rksv.bmf_auth_data()===true) && (!(status.connection===false))) {
                        self.state.cashbox_activate_display = 'visible';
                    } else {
                        self.state.cashbox_activate_display = 'none';
                    }
                }
                // Button für Außerbetriebnahme einbauen !
                self.auto_open_close();
            });
            // Listen on state changes for the mode flag
            self.env.pos.bind('change:cashbox_mode', function (pos, state) {
                // Do rerender the sprovider view
                self.render_sproviders();
                self.auto_open_close();
            });
        }
        posbox_status_handler () {
            var self = this;
            this.env.pos.proxy.on('change:status', this, function (eh, status) {
                // Do update the datetime and status here
                if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.posbox_vienna_datetime) {
                    self.state.rksv_posbox_datetime = status.newValue.drivers.rksv.posbox_vienna_datetime;
                }
                if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.posbox_rksv_lib_version) {
                    self.state.rksv_rksv_version = status.newValue.drivers.rksv.posbox_rksv_lib_version.version;
                }
                if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.posbox_rksv_mod_version) {
                    self.state.rksv_addon_version = status.newValue.drivers.rksv.posbox_rksv_mod_version.version;
                }
                if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.posbox_bmf_mod_version) {
                    self.state.rksv_bmf_version = status.newValue.drivers.rksv.posbox_bmf_mod_version.version;
                }
                // Also check current bmf_status_rk
                if ((status.newValue.status == "connected") && (!this.env.pos.get('bmf_status_rk').success)) {
                    // BMF Status RK is false - so do recheck the status here
                    self.env.pos.rksv.update_bmf_rk_status();
                }
                //this.env.pos.posbox_status = status.newValue.status;
                if (status.newValue.status == "connected") {
                    self.state.posbox_status = 'connected';
                    self.state.posbox_message = 'PosBox verbunden (' + status.newValue.status + ')';
                } else {
                    self.state.posbox_status = 'failure';
                    self.state.posbox_message = 'PosBox getrennt (' + status.newValue.status + ')';
                }
                // Check if we have to activate ourself
                if (status.newValue.status === 'connected' && (!(self.env.pos.config.state === "failure" || self.env.pos.config.state === "inactive"))) {
                    var rksvstatus = status.newValue.drivers.rksv ? status.newValue.drivers.rksv.status : false;
                    self.state.cashbox_mode = status.newValue.drivers.rksv.cashbox_mode;
                    self.env.pos.set('cashbox_mode', rksvstatus.cashbox_mode);
                    var rksvmessage = status.newValue.drivers.rksv && status.newValue.drivers.rksv.message ? status.newValue.drivers.rksv.message : false;
                    if (!rksvstatus) {
                        self.state.rksv_status_color = 'red';
                        self.state.button_register_startreceipt = false;
                        self.state.button_register_cashbox = false;
                        rksvmessage = "Status unbekannt";
                    } else if (rksvstatus == 'connected') {
                        // Everything is correct
                        self.state.rksv_status_color = 'green';
                        self.state.button_register_startreceipt = false;
                        self.state.button_register_cashbox = false;
                        rksvmessage = "PosBox Modul verbunden";
                    } else if (rksvstatus == 'invalidstartreceipt') {
                        // Validation of start receipt failed - activate the try again button
                        self.state.rksv_status_color = 'orange';
                        self.state.button_register_startreceipt = true;
                        self.state.button_register_cashbox = false;
                        rksvmessage = "Validierungsfehler!";
                    } else if (rksvstatus == 'failure') {
                        self.state.rksv_status_color = 'red';
                        self.state.button_register_startreceipt = false;
                        self.state.button_register_cashbox = false;
                        rksvmessage = "Fehler";
                    } else if (rksvstatus == 'doesnotexists') {
                        // Cashbox is not registered on this posbox !
                        self.state.rksv_status_color = 'red';
                        self.state.button_register_startreceipt = false;
                        self.state.button_register_cashbox = true;
                        rksvmessage = "Kassen ID nicht auf dieser PosBox registriert!";
                    } else {
                        self.state.rksv_status_color = 'red';
                        self.state.button_register_startreceipt = false;
                        self.state.button_register_cashbox = false;
                    }
                    if (!rksvmessage) {
                        rksvmessage = "Status: " + status.newValue.drivers && status.newValue.drivers.rksv && status.newValue.drivers.rksv.status ? status.newValue.drivers.rksv.status : '?';
                    }
                    if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.messages){
                        var container = $('<div />');
                        container.append(rksvmessage + ' (' + rksvstatus + ')');
                        var messages = $('<ul style="font-size: 0.7em;margin: 10px 0;line-height: 1.5em;" />');
                        status.newValue.drivers.rksv.messages.forEach(function(message) {
                            messages.append('<li>' + message + '</li>');
                        });
                        // Check for cashbox mode - append state here
                        messages.append('<li>Aktueller Kassenmodus: ' + status.newValue.drivers.rksv.cashbox_mode + '</li>');
                        container.append(messages);
                        rksvmessage = container.html();
                    }
                    self.state.rksv_status_message = rksvmessage;

                } else if (status.newValue.status === 'connected' && (self.env.pos.config.state === "setup")) {
                    self.state.rksv_status_color = 'red';
                    self.state.rksv_status_message = "Kasse befindet sich im Status Setup !";
                    self.state.button_register_cashbox = true;
                } else if (status.newValue.status === 'connected' && (self.env.pos.config.state === "failure")) {
                    self.state.rksv_status_color = 'red';
                    self.state.rksv_status_message = "Kasse ist markiert als ausgefallen !";
                } else if (status.newValue.status === 'connected' && (self.env.pos.config.state === "inactive")) {
                    self.state.rksv_status_color = 'red';
                    self.state.rksv_status_message = "Kasse ist deaktviert !";
                }
                if (self.env.pos.get('cashbox_mode') == 'signature_failed'){
                    // TODO
                    //self.$el.find('.sprovider-btn').show()
                }
                if (self.env.pos.get('cashbox_mode') == 'posbox_failed'){
                    // TODO
                }
                self.auto_open_close();
            });
        }
        render_sproviders () {
            /* Render list of available signatures */
            this.state.signatures = this.env.pos.signatures.models;
        }
        
    }
    RKSVStatusScreen.template = 'RKSVStatusScreen';

    Registries.Component.add(RKSVStatusScreen);

    return RKSVStatusScreen;
});
