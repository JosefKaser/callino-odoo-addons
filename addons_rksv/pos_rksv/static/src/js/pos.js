/*
 Do extend the main pos Model here !
 */
odoo.define('pos_rksv.pos', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    // We do require the signature model and collection
    require('pos_rksv.models');
    // Get reference to my RKSV Popup Widgets - you get the reference by using the gui popup handler functions !
    var rpc = require('web.rpc');
    var rksv = require('pos_rksv.rksv');
    const { useListener, useBus } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    const PosGlobalState = models.PosGlobalState;
    var core = require('web.core');
    var _t = core._t;

    /*
    PosModel ist the main pos Model - which does get referenced everywhere with pos
     */
    var PosModelSuper = models.PosGlobalState;
    const RKSVPos = (PosGlobalState) =>
        class extends PosGlobalState {
        constructor(obj) {
            super(obj);
            // Init empty signatures collection
            /*this.signatures = new models.Signatures(null, {
                pos: this
            });*/
            this.signature_update = false;
            // pos backbone attributes
            this.env.proxy.set({
                'bmf_status_rk': 'unknown',
                // This is for the current signature which is in use - it is of type module.Signature
                'signature': null,
                // This is the cashbox_mode flag
                // cashbox_mode = active - everything is ok
                // cashbox_mode = signature_failed - we can store the receipts - but cannot sign
                // cashbox_mode = posbox_failed - we lost PosBox - so not possible to store receipts !
                'cashbox_mode': 'active'
            });
            // Supercall
            // PosModelSuper.prototype.initialize.call(this, attributes);
            var self = this;
            // Do initialize the main RKSV Handler Object !
            this.rksv = new rksv.RKSV({'pos': this, proxy: this.proxy});

            // The PosModel does handle the communication back to odoo
            useBus(this.env.posbus, 'create-new-signature', this._writeSignatureToOdoo);
            this.env.proxy.on('change:bmf_status_rk', this, function (pos, status) {
                // Save current state
                self.config.bmf_gemeldet = status.success;
                // Write back new status to odoo
                rpc.query({
                    model: 'pos.config',
                    method: 'write',
                    args: [self.config.id, {
                        'bmf_gemeldet': status.success,
                    }]
                });
            });
            useBus(this.env.posbus, 'change:bmf_status change:bmf_message', function (signature) {
                console.log('Try to fire an update for status in backend');
                if (!this.env.pos.signature_update){
                    this.env.pos.signature_update = true;
                    rpc.query({
                        model: 'signature.provider',
                        method: 'update_status',
                        args: [signature.attributes]
                    }).then(
                        function finish(result) {
                            this.env.pos.signature_update = false;
                        }
                    );
                }
            });
            // Bind on cashbox_mode flag
            useBus(this.env.posbus, 'change:cashbox_mode', function (pos, state) {
                // Write back new status to odoo
                rpc.query({
                    model: 'pos.config',
                    method: 'write',
                    args: [pos.config.id, {
                    'state': state
                }]
                });
                // And store it locally
                self.config.state = state;
            });
            // Things to do when all models are loaded
            /*this.ready.then(function () {
                console.log('All data is loaded - so do my work...');
                // Check state from config - set it as my own state
                if (self.config.iface_rksv) {
                    self.set('cashbox_mode', self.config.state);
                    // Request a new status from bmf for the system
                    self.rksv.update_bmf_rk_status();
                }
            });*/
        }
        _writeSignatureToOdoo(ev) {
            var self = this;
            console.log('do write back signature cards info to odoo');
            // Inform odoo about the current cards
            var cardinfos = new Array();
            var signatures = ev.detail.signatures;
            // var signature = ev.detail['signature']
            $(signatures).each(function (nr, signature) {
                cardinfos.push(signature);
            });
            this.env.pos.signature_update = true;
            rpc.query({
                model: 'signature.provider',
                method: 'set_providers',
                args: [cardinfos, {
                    'pos_config_id': self.env.pos.config.id,
                }]
            }).then(
                function finish(result) {
                    self.env.pos.signature_update = false;
                }
            );
        }
        push_single_order(order, opts) {
            opts = opts || {};
            const self = this;
            // Handle the dummy case - this can happen
            // Handle no rksv case
            if ((!order) || (!self.config.iface_rksv)) {
                return PosModelSuper.prototype.push_single_order.call(this, order, opts);
            }
            // We do return a new Promise - as they original function does
            return new Promise(function (resolve, reject) {
                self.env.proxy.message('rksv_order', order.export_for_printing()).then(
                    function done(result) {
                        if (!result['success']) {
                            order.set_sign_failed();
                            reject(result['message']);
                        } else {
                            // Set result
                            order.set_sign_result(result);
                            // make super call which will create the order within odoo
                            PosModelSuper.prototype.push_single_order.call(self, order, opts).then(resolve, reject);
                        }
                    },
                    function failed() {
                        order.set_sign_failed();
                        reject(_t("Es ist ein Fehler beim Erstellen der Signatur aufgetreten."));
                    }
                );
            });
        }
        push_and_invoice_order(order) {
            var self = this;
            // Handle the dummy case - this can happen
            // Handle no rksv case
            if ((!order) || (!self.config.iface_rksv)) {
                return PosModelSuper.prototype.push_and_invoice_order.call(this, order);
            }
            // No client selected - call original funciton
            if(!order.get_client()){
                return PosModelSuper.prototype.push_and_invoice_order.call(self, order);
            }


            // We do return a new Promise - as they original function does
            return new Promise(function (resolve, reject) {
                self.proxy.message('rksv_order', order.export_for_printing()).then(
                    function done(result) {
                        if (!result['success']) {
                            order.set_sign_failed();
                            reject(result['message']);
                        } else {
                            // Set result
                            order.set_sign_result(result);
                            // make super call which will create the order within odoo
                            PosModelSuper.prototype.push_and_invoice_order.call(self, order).then(resolve, reject);
                        }
                    },
                    function failed() {
                        order.set_sign_failed();
                        reject(_t("Es ist ein Fehler beim Erstellen der Signatur aufgetreten."));
                    }
                );
            });
        }
    };

    Registries.Model.extend(PosGlobalState, RKSVPos);

    return {
        RKSVPos: RKSVPos,
    };
});
