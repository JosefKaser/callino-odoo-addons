odoo.define('pos_rksv.RKSVStatusScreen', function(require) {
    'use strict';

    const { debounce } = owl.utils;
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');

    class RKSVStatusScreen extends PosComponent {
        constructor() {
            super(...arguments);
            this.sproviders = null;
            this.stay_open = false;
            this.active = false;
            if (this.env.pos.config.iface_rksv) {
                console.log('RKSV: do install proxy status change handler');
                this.posbox_status_handler();
                console.log('RKSV: do install rk status change handler');
                this.rk_status_handler();
                console.log('RKSV: do install change handler on current signature');
                this.se_status_handler();
            }
        }
        async willStart() {
            if (this.env.pos.config.iface_rksv) {
                return $.when();
            } else
                // We do provide a deferred which will never fire
                return $.Deferred();
        }
        show() {
            var order = this.env.pos.get_order();
            if (order) {
                var params = order.get_screen_data('params');
                if ((params) && (params['stay_open'] === true)) {
                    this.stay_open = true;
                } else {
                    this.stay_open = false;
                }
            }
            var self = this;
            self.active = true;
            self._super();
            // Try to hide Everything else
            console.log('RKSV Status show');
            this.env.pos.gui.chrome.widget.order_selector.$('.orders').hide();
            this.env.pos.gui.chrome.widget.order_selector.$('.neworder-button').hide();
            this.env.pos.gui.chrome.widget.order_selector.$('.deleteorder-button').hide();

            // Only request current status if there is an connection available
            if (self.env.pos.rksv.check_proxy_connection()) {
                // Do request the current RK Status
                self.env.pos.rksv.update_bmf_rk_status();
                // Do request new status from BMF on show
                var signature = self.env.pos.get('signature');
                // This will signal us the new status as soon as we get it
                if (signature)
                    signature.try_refresh_status(self.env.pos);
            }
            // Do render month product status
            self.render_month_product();
            // Do rerender signature providers
            self.render_sproviders();
        }
        hide() {
            // We avoid to hide here if not everything is ok - or emergency mode
            if (this.env.pos.rksv === undefined || (!this.env.pos.rksv.all_ok()) && (!this.emergency_mode()))
                return;
            var self = this;
            self._super();
            self.active = false;

            // Enable the hidden elements
            console.log('RKSV Status hide');
            this.env.pos.gui.chrome.widget.order_selector.$('.orders').show();
            this.env.pos.gui.chrome.widget.order_selector.$('.neworder-button').show();
            this.env.pos.gui.chrome.widget.order_selector.$('.deleteorder-button').show();
        }
        activate_cashbox() {
            this.env.pos.rksv.bmf_kasse_registrieren();
        }
        register_cashbox() {
            this.env.pos.rksv.register_cashbox();
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
            var mode = this.env.pos.get('cashbox_mode');
            return (mode=='signature_failed' || mode=='posbox_failed');
        }
        auto_open_close() {
            // Do not open when rksv is not enabled
            if (!this.env.pos.config.iface_rksv) return;
            // Do not open when rksv is not intitialized
            if (this.env.pos.rksv === undefined) return;
            // Open Status widget on:
            // - Not already active
            // - Not all is ok - or we need a automatic receipt
            // - Not in emergency mode
            // - Do not open on only WLAN lost
            if ((!this.active) && ((!this.env.pos.rksv.all_ok()) || (this.env.pos.rksv.auto_receipt_needed())) && (!this.emergency_mode()) && (!this.env.pos.rksv.lost_wlan())) {
                this.env.pos.gui.show_screen('rksv_status');
            } else if ((this.active) && (!this.env.pos.rksv.all_ok()) && (!this.emergency_mode())) {
                // Already active - ok - stay active
            } else if ((this.active) && ((this.env.pos.rksv.all_ok()) || (this.emergency_mode())) && (!this.env.pos.rksv.auto_receipt_needed())) {
                // Active and everything is ok - or emergency mode - man - do try to close here
                this.try_to_close();
            }
        }
        try_to_close() {
            if (!this.active)
                return;
            // Is our current signature available?
            if ((this.env.pos.rksv.all_ok() || this.emergency_mode()) && (!this.stay_open) && (!(this.env.pos.config.state === "setup" || this.env.pos.config.state === "failure" || this.env.pos.config.state === "inactive"))) {
                var order = this.env.pos.get_order();
                var previous = '';
                if (order) {
                    var previous = order.get_screen_data('previous-screen');
                    if ((!previous) || (previous == 'rksv_status')) {
                        this.env.pos.gui.show_screen(this.env.pos.gui.default_screen);
                    } else {
                        this.env.pos.gui.back();
                    }
                } else {
                    // if no selected order does exist - then there is no previous-screen - so activate startup screen
                    this.env.pos.gui.show_screen(this.env.pos.gui.startup_screen);
                }
            }
        }
        close_pos(){
            this.env.pos.gui.close();
        }
        get_rksv_product(ul, tuple, type){
            var self = this;
            var product = false;
            if (tuple && (self.env.pos.db.get_product_by_id(tuple[0]))){
                product = self.env.pos.db.get_product_by_id(tuple[0]);
                ul.append('<li>Produkt (' + type + '): ' + product.display_name + ' (' + product.id + ')</li>');
            }
            return ul;
        }
        render_month_product() {
            var self = this;
            var container = $('<div />');
            var ul = $('<ul style="font-size: 0.7em;margin: 10px 0;line-height: 1.5em;" />');
            ul = self.get_rksv_product(ul, self.env.pos.config.start_product_id, 'Startbeleg');
            ul = self.get_rksv_product(ul, self.env.pos.config.month_product_id, 'Monatsbeleg');
            ul = self.get_rksv_product(ul, self.env.pos.config.year_product_id, 'Jahresbeleg');
            ul = self.get_rksv_product(ul, self.env.pos.config.null_product_id, 'Nullbeleg');
            ul = self.get_rksv_product(ul, self.env.pos.config.invoice_product_id, 'Referenzbeleg');
            container.append(ul);
            if (this.env.pos.rksv.statuses['rksv_products_exists']) {
                self.$('.monthproduct-status-indicator .indicator').css('background', 'green');
                self.$('.monthproduct-status-indicator .indicator-message').html("RKSV Produkte vollständig! <br />" + container.html());
            } else {
                self.$('.monthproduct-status-indicator .indicator').css('background', 'red');
                self.$('.monthproduct-status-indicator .indicator-message').html("RKSV Produkte unvollständig! <br />" + container.html());
            }
        }
        se_status_handler() {
            var self = this;
            if (self.env.pos.signatures === undefined) return;
            // Listen on status update for signaturs - display the change here
            this.env.pos.signatures.bind('add remove', function(signature) {
                // Do rerender the sprovider view
                self.render_sproviders();
            });
            this.env.pos.signatures.bind('change:bmf_status change:bmf_message change:bmf_last_status', function(signature) {
                if (!signature.isActive(self.env.pos))
                    // Ignore this update if it does not belong to the active signature
                    return;
                var color = 'red';
                var message = 'Signatur registriert und inaktiv';
                var cashbox_mode = self.env.pos.get('cashbox_mode');
                if ((signature.get('bmf_status')) && signature.get('bmf_last_status') == 'IN_BETRIEB' && (cashbox_mode == 'active' || cashbox_mode == 'setup')) {
                    color = 'green';
                    message = 'Signatureinheit registriert und aktiv';
                    self.$('.sprovider-bmf-btn').hide();
                    self.$('.sprovider-bmf-ausfall-btn').hide();
                    self.$('.sprovider-bmf-wiederinbetriebnahme-btn').hide();
                } else if (signature.get('bmf_last_status') == 'AUSFALL') {
                    message = signature.get('bmf_last_status')+ ', ' + (signature.get('bmf_message')?signature.get('bmf_message'):'');
                    self.$('.sprovider-bmf-btn').hide();
                    self.$('.sprovider-bmf-ausfall-btn').hide();
                    self.$('.sprovider-bmf-wiederinbetriebnahme-btn').show();
                } else {
                    message = signature.get('bmf_last_status')+ ', ' + (signature.get('bmf_message')?signature.get('bmf_message'):'');
                    self.$('.sprovider-bmf-btn').show();
                    self.$('.sprovider-bmf-ausfall-btn').show();
                    self.$('.sprovider-bmf-wiederinbetriebnahme-show').show();
                }
                self.$('.signature-provider-status-indicator .indicator').css('background', color);
                self.$('.signature-provider-status-indicator .indicator-message').html(message);
                self.auto_open_close();
            });
        }
        rk_status_handler() {
            var self = this;
            // Listen on status update for kasse
            self.env.pos.bind('change:bmf_status_rk', function(pos, status) {
                self.$('.cashbox-message-box').html(status.message);
                //check rk  -needs to be registered with bmf
                if ((!self.env.pos.config.cashregisterid) || (self.env.pos.config.cashregisterid.trim() == "")) {
                    self.$('.cashbox-status-indicator .indicator').css('background', 'orange');
                    self.$('.cashbox-status-indicator .indicator-message').html("Keine gültige KassenID ist gesetzt !");
                    self.$('.cashbox-status-indicator .activate_cashbox').hide();
                } else if (status.success) {
                    self.$('.cashbox-status-indicator .indicator').css('background', 'green');
                    self.$('.cashbox-status-indicator .indicator-message').html(status.message);
                    self.$('.cashbox-status-indicator .activate_cashbox').hide();
                } else {
                    self.$('.cashbox-status-indicator .indicator').css('background', 'red');
                    self.$('.cashbox-status-indicator .indicator-message').html(status.message);
                    if ((self.env.pos.rksv.bmf_auth_data()==true) && (!(status.connection===false)))
                        self.$('.cashbox-status-indicator .activate_cashbox').show();
                    else
                        self.$('.cashbox-status-indicator .activate_cashbox').hide();
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
                    self.$('#rksv_posbox_datetime').html(status.newValue.drivers.rksv.posbox_vienna_datetime);
                }
                if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.posbox_rksv_lib_version) {
                    self.$('#rksv_rksv_version').html(status.newValue.drivers.rksv.posbox_rksv_lib_version.version);
                }
                if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.posbox_rksv_mod_version) {
                    self.$('#rksv_addon_version').html(status.newValue.drivers.rksv.posbox_rksv_mod_version.version);
                }
                if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.posbox_bmf_mod_version) {
                    self.$('#rksv_bmf_version').html(status.newValue.drivers.rksv.posbox_bmf_mod_version.version);
                }
                // Also check current bmf_status_rk
                if ((status.newValue.status == "connected") && (!this.env.pos.get('bmf_status_rk').success)) {
                    // BMF Status RK is false - so do recheck the status here
                    self.env.pos.rksv.update_bmf_rk_status();
                }
                //this.env.pos.posbox_status = status.newValue.status;
                if (status.newValue.status == "connected") {
                    self.$('.posbox-status-indicator .indicator').css('background', 'green');
                    self.$('.posbox-status-indicator .indicator-message').html('PosBox verbunden (' + status.newValue.status + ')');
                } else {
                    self.$('.posbox-status-indicator .indicator').css('background', 'red');
                    self.$('.posbox-status-indicator .indicator-message').html('PosBox getrennt (' + status.newValue.status + ')');
                }
                // Check if we have to activate ourself
                if (status.newValue.status === 'connected' && (!(self.env.pos.config.state === "failure" || self.env.pos.config.state === "inactive"))) {
                    var rksvstatus = status.newValue.drivers.rksv ? status.newValue.drivers.rksv.status : false;
                    var rksvmessage = status.newValue.drivers.rksv && status.newValue.drivers.rksv.message ? status.newValue.drivers.rksv.message : false;
                    if (!rksvstatus) {
                        self.$('.rksv-status-indicator .register_startreceipt').hide();
                        self.$('.rksv-status-indicator .register_cashbox').hide();
                        self.$('.rksv-status-indicator .indicator').css('background', 'red');
                        rksvmessage = "Status unbekannt";
                    } else if (rksvstatus == 'connected') {
                        self.$('.rksv-status-indicator .register_startreceipt').hide();
                        self.$('.rksv-status-indicator .register_cashbox').hide();
                        // Everything is correct
                        self.$('.rksv-status-indicator .indicator').css('background', 'green');
                        rksvmessage = "PosBox Modul verbunden";
                    } else if (rksvstatus == 'invalidstartreceipt') {
                        self.$('.rksv-status-indicator .register_startreceipt').show();
                        self.$('.rksv-status-indicator .register_cashbox').hide();
                        // Validation of start receipt failed - activate the try again button
                        self.$('.rksv-status-indicator .indicator').css('background', 'orange');
                        rksvmessage = "Validierungsfehler!";
                    } else if (rksvstatus == 'failure') {
                        self.$('.rksv-status-indicator .register_startreceipt').hide();
                        self.$('.rksv-status-indicator .register_cashbox').hide();
                        self.$('.rksv-status-indicator .indicator').css('background', 'red');
                        rksvmessage = "Fehler";
                    } else if (rksvstatus == 'doesnotexists') {
                        self.$('.rksv-status-indicator .register_startreceipt').hide();
                        self.$('.rksv-status-indicator .register_cashbox').show();
                        // Cashbox is not registered on this posbox !
                        self.$('.rksv-status-indicator .indicator').css('background', 'red');
                        rksvmessage = "Kassen ID nicht auf dieser PosBox registriert!";
                    } else {
                        self.$('.rksv-status-indicator .register_startreceipt').hide();
                        self.$('.rksv-status-indicator .register_cashbox').hide();
                        // Only show it if it is not already in state visible !
                        self.$('.rksv-status-indicator .indicator').css('background', 'red');
                        self.$('.rksv-status-indicator .register_cashbox').hide();
                    }
                    if (!rksvmessage) {
                        rksvmessage = "Status: " + status.newValue.drivers && status.newValue.drivers.rksv && status.newValue.drivers.rksv.status ? status.newValue.drivers.rksv.status : '?';
                    }
                    if (status.newValue.drivers.rksv && status.newValue.drivers.rksv.messages){
                        var container = $('<div />')
                        container.append(rksvmessage + ' (' + rksvstatus + ')');
                        var messages = $('<ul style="font-size: 0.7em;margin: 10px 0;line-height: 1.5em;" />');
                        status.newValue.drivers.rksv.messages.forEach(function(message) {
                            messages.append('<li>' + message + '</li>');
                        });
                        container.append(messages);
                        rksvmessage = container.html();
                    }
                    self.$('.rksv-status-indicator .indicator-message').html(rksvmessage);

                } else if (status.newValue.status === 'connected' && (self.env.pos.config.state === "setup")) {
                    self.$('.rksv-status-indicator .indicator').css('background', 'red');
                    self.$('.rksv-status-indicator .indicator-message').html("Kasse befindet sich im Status Setup !");
                    self.$('.rksv-status-indicator .register_cashbox').show();
                } else if (status.newValue.status === 'connected' && (self.env.pos.config.state === "failure")) {
                    self.$('.rksv-status-indicator .indicator').css('background', 'red');
                    self.$('.rksv-status-indicator .indicator-message').html("Kasse ist markiert als ausgefallen !");
                } else if (status.newValue.status === 'connected' && (self.env.pos.config.state === "inactive")) {
                    self.$('.rksv-status-indicator .indicator').css('background', 'red');
                    self.$('.rksv-status-indicator .indicator-message').html("Kasse ist deaktviert !");
                }
                /*
                It should always be possible to use an other signature provider

                if (self.env.pos.get('cashbox_mode') == 'active'){
                    self.$el.find('.sprovider-btn').hide()
                }
                */
                if (self.env.pos.get('cashbox_mode') == 'signature_failed'){
                    self.$el.find('.sprovider-btn').show()
                }
                if (self.env.pos.get('cashbox_mode') == 'posbox_failed'){
                    
                }
                self.auto_open_close();
            });
        }
        render_card (card) {
            var valid_vat = false;
            if (card.matchVAT(this.env.pos.company.bmf_vat_number)) {
                valid_vat = true;
            }
            if (!valid_vat) {
                // Try to match against Steuernummer
                if (card.matchTaxNumber(this.env.pos.company.bmf_tax_number)) {
                    valid_vat = true;
                }
            }
            var sprovider_html = QWeb.render('SignatureProvider', {
                widget: this,
                card: card,
                valid_vat: valid_vat,
                signature: this.env.pos.get('signature')
            });
            return sprovider_html;
        }
        render_signature () {
            var signature = this.env.pos.get('signature');
            if (signature === null) {
                return "<b>Keine Signatur gesetzt!</b>";
            }
            var card = this.env.pos.signatures.getActiveSignature(this.env.pos);
            var signature_html = QWeb.render('CurrentSignature', {
                widget: this,
                signature: signature,
                pos: this.env.pos,
                card: (card?card:null)
            });
            return signature_html;
        }
        render_sproviders () {
            var self = this;
            self.$('.provider-container').empty();
            self.$('.provider-container').append(self.render_signature());
            var signatures = this.env.pos.signatures;
            if (!signatures) {
                return;
            }
            signatures.forEach(function(card) {
                self.$('.provider-container').append(self.render_card(card));
            });
            self.$el.find('.sprovider-btn').click(self, function (event) {
                var password = self.$el.find('#pass_input_signature').val();
                if (password == self.env.pos.config.pos_admin_passwd) {
                    self.env.pos.rksv.set_signature(event.target.value).then(
                        function done() {
                            self.$('.provider-message-box').empty();
                            self.$('.provider-message-box').append('<p style="color:green;">Signatur Provider wurde gesetzt.</p>');
                        },
                        function failed(message) {
                            self.$('.provider-message-box').empty();
                            self.$('.provider-message-box').append('<p style="color:red;">' + message + '</p>');
                        }
                    );
                } else {
                    self.env.pos.gui.show_popup('error',{
                        'title': _t("Passwort falsch"),
                        'body': _t("Das richtige POS Admin Passwort wird benötigt.")
                    });
                }
            });
            self.$el.find('.rk-ausfall-se').click(self, function (event) {
                self.stay_open = false;
                self.env.pos.rksv.rk_ausfalls_modus();
            });
            self.$el.find('.sprovider-bmf-btn').click(self, function (event) {
                self.stay_open = false;
                self.env.pos.rksv.bmf_sprovider_registrieren(event.target.attributes['serial'].value);
            });
            self.$el.find('.sprovider-bmf-ausfall-btn').click(self, function (event) {
                self.stay_open = false;
                self.env.pos.rksv.bmf_sprovider_ausfall(event.target.attributes['serial'].value);
            });
            self.$el.find('.sprovider-bmf-wiederinbetriebnahme-btn').click(self, function (event) {
                self.stay_open = false;
                self.env.pos.rksv.bmf_sprovider_wiederinbetriebnahme(event.target.attributes['serial'].value);
            });
            self.$el.find('.sprovider-status-btn').click(self, function (event) {
                self.stay_open = false;
                self.env.pos.rksv.bmf_sprovider_status(event.target.attributes['serial'].value);
            });
            self.try_to_close();
        }
        
    }
    RKSVStatusScreen.template = 'RKSVStatusScreen';

    Registries.Component.add(RKSVStatusScreen);

    return RKSVStatusScreen;
});
