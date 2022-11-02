/*
 Do inject our own needed models and fields
 */
odoo.define('pos_rksv.models', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var { Order, Orderline } = require('point_of_sale.models');
    const PosGlobalState = models.PosGlobalState;
    const Registries = require('point_of_sale.Registries');

    class PosCollection extends Array {
        getByCID(cid) {
            return this.find(item => item.cid == cid);
        }
        add(item) {
            this.push(item);
        }
        remove(item) {
            const index = this.findIndex(_item => item.cid == _item.cid);
            if (index < 0) return index;
            this.splice(index, 1);
            return index;
        }
        reset() {
            this.length = 0;
        }
        at(index) {
            return this[index];
        }
    }

    let nextId = 0;
    class PosModel {
        /**
         * Create an object with cid. If no cid is in the defaultObj,
         * cid is computed based on its id. Override _getCID if you
         * don't want this default calculation of cid.
         * @param {Object?} defaultObj its props copied to this instance.
         */
        constructor(defaultObj) {
            defaultObj = defaultObj || {};
            if (!defaultObj.cid) {
                defaultObj.cid = this._getCID(defaultObj);
            }
            Object.assign(this, defaultObj);
        }
        /**
         * Default cid getter. Used as local identity of this object.
         * @param {Object} obj
         */
        _getCID(obj) {
            if (obj.id) {
                if (typeof obj.id == 'string') {
                    return obj.id;
                } else if (typeof obj.id == 'number') {
                    return `c${obj.id}`;
                }
            }
            return `c${nextId++}`;
        }
    }

    models.append_domain = function(modelname, domain) {
        var pmodels = models.PosModel.prototype.models;
        for (var i = 0; i < pmodels.length; i++) {
            if (pmodels[i].model === modelname) {
                // We do merge the content of the second array in the first one
                // Domain is or could be a function
                if (typeof(pmodels[i].domain) === 'function') {
                    pmodels[i].orig_domain = pmodels[i].domain;
                    pmodels[i].append_domain = domain;
                    pmodels[i].domain = function(self) {
                        var domain = this.orig_domain(self);
                        Array.prototype.push.apply(domain, this.append_domain);
                        return domain;
                    };
                } else {
                    Array.prototype.push.apply(pmodels[i]['domain'], domain);
                }
            }
        }
    };
    models.overwrite_loaded_callback = function(modelname, callback) {
        var pmodels = models.PosModel.prototype.models;
        for (var i = 0; i < pmodels.length; i++) {
            if (pmodels[i].model === modelname) {
                // Store pointer to original callback
                pmodels[i]['original'] = pmodels[i]['loaded'];
                // Set new one
                pmodels[i]['loaded'] = callback;
            }
        }
    };
    /*
    Here we do add the fields and the models we need to load from the server
     */
    // BMF Fields we do need to communicate directly with the BMF SOAP Service
    // TODO models.load_fields("res.company", [ "bmf_tid", "bmf_benid", "bmf_pin", "bmf_hersteller_atu", "bmf_tax_number", "bmf_vat_number"]);
    // Update domain on product.product
    // TODO models.append_domain("product.product", [['rksv_tax_mapping_correct','=',true]]);
    // Load Odoo configured signature providers - check if this is still needed !
    // TODO
    /* models.load_models({
        model: 'signature.provider',
        fields: ['display_name', 'issuer', 'name', 'serial', 'subject', 'valid_from', 'valid_until'],
        domain: function (self) {
            // Check if a signature provider is configured
            if ((self.config.signature_provider_id) && (self.config.signature_provider_id.length > 0)) {
                return [['id', '=', self.config.signature_provider_id[0]]];
            } else {
                return [['id', '=', -1]];   // Do not load anything
            }
        },
        loaded: function (self, signature_provider) {
            console.log('signature provider loaded');
            if ((signature_provider) && (signature_provider.length == 1)) {
                var signature = new models.Signature(signature_provider[0], {
                    pos: self
                });
                self.set('signature', signature);
            }
        }
    });
    models.load_fields("account.tax", ['rksv_tax', 'rksv_tax_category']);
    models.load_fields("product.product", ['rksv_product_type', 'pos_product_invisible']);
    models.overwrite_loaded_callback("pos.config", function(self, configs) {
        this.original.call(this, self, configs);
        if (self.config.iface_rksv) {
            self.config.use_proxy = true;
        }
    });
    */


    /*
    Define Signature Model - in global models namespace
     */
    var signature_id = 1;

    class Signature extends PosModel{
        constructor(obj, options) {
            super(obj);
            this.idAttribute = "serial";
            this.id = signature_id++;
        }
        setup(attributes,options) {
            //Backbone.Model.prototype.initialize.apply(this, arguments);
            options = options || {};

            this.pos = options.pos;
            return this;
        }
        getVAT() {
            var regex = /.*\s(ATU\d{8})[,\s].*/g;
            var m = regex.exec(this.subject);
            if (m && m.length==2) {
                return m.pop();
            }
            return null;
        }
        getTaxNumber() {
            var regex = /.*\s(\d{5}\/\d{4})[,\s].*/g;
            var m = regex.exec(this.subject);
            if (m && m.length==2) {
                var number = m.pop();
                return number.replace(/[^\d]/g, "");
            }
            return null;
        }
        matchVAT(vat) {
            return (vat === this.getVAT()?true:false);
        }
        matchTaxNumber(tax_number) {
            if (tax_number){
                var clean_tax_number = tax_number.replace(/[^\d]/g, "");
                return (clean_tax_number === this.getTaxNumber()?true:false);
            }
            return false;
        }
        _updateStatus(status) {
            this.bmf_status = status['bmf_status'];
            this.bmf_message = status['bmf_message'];
            // Also do search in the list of signatures and update the status there
            var signatures = posmodel.signatures;
            if (signatures) {
                var sig = this;
                var signature = null;
                $(signatures).each(function(id, sprov) {
                    if (sprov.serial == sig.serial) {
                        signature = sprov;
                    }
                });
                if (signature)
                    signature.bmf_status = status['bmf_status'];
                    signature.bmf_message = status['bmf_message'];
                    signature.bmf_last_status = status['bmf_last_status'];
            }
        }
        setStatus(status) {
            this._updateStatus({
                'bmf_status': status.success,
                'bmf_message': status.message
            });
        }
        setBMFStatus(status) {
            var bmf_last_status = 'UNBEKANNT';
            if (status.success) {
                bmf_last_status = status.status.status;
            }
            var newStatus = {
                'bmf_last_status': bmf_last_status,
                'bmf_message': status.message,
                'bmf_status': status.success
            };
            this._updateStatus(newStatus);
        }
        isActive(pos) {
            var sig = this;
            var signature = null;
            $(pos.signatures).each(function(id, sprov) {
                if (sprov.serial == sig.serial) {
                    signature = sprov;
                }
            });
            var config_signature = null; // pos.config.signature_provider_id
            $(pos.signatures).each(function(id, sprov) {
                if (sprov.cin == pos.config.signature_provider_id[1]) {
                    config_signature = sprov;
                }
            });
            if (!config_signature)
                return false;
            return config_signature.serial == this.serial;
        }
        try_refresh_status() {
            var self = this;
            var proxyDeferred = $.Deferred();
            if (!posmodel.rksv.check_proxy_connection()) {
                this.setStatus({
                    success: false,
                    message: "Keine Verbindung zur PosBox, Status kann nicht abgefragt werden !"
                });
                proxyDeferred.reject("Keine Verbindung zur PosBox, Status kann nicht abgefragt werden !");
                return proxyDeferred;
            }
            // Do initiate the rpc call - we will get the status response
            // Do use the rksv object function for this
            posmodel.rksv.bmf_sprovider_status_rpc_call(this.serial).then(
                function done(response) {
                    proxyDeferred.resolve(response);
                    return response;
                },
                function failed(response) {
                    proxyDeferred.reject("Abfrage des Status beim BMF ist fehlgeschlagen");
                    return response;
                }
            ).then(function(response) {
                self.setBMFStatus(response);
            });
            return proxyDeferred;
        }

    };

    const RKSVPosGlobalState = (PosGlobalState) =>
        class extends PosGlobalState {
        constructor(obj) {
            super(obj);
            this.signatures = new PosCollection();
        }
        async _processData(loadedData) {
            await super._processData(...arguments);
            this._loadSignatures(loadedData['signature.provider']);
            this.signatures = loadedData['signature.provider'];
        }
        _loadSignatures(signatures) {
        for (let signature of signatures) {
            if (!this.signatures.includes(signature.serial)) {
                this.signatures.push(signature.serial);
            }
        }
    }
    }

    /*
    Define Signature Collection - does hold all available signature providers
     - in global models namespace
     */
    /* class Signatures extends PosCollection{
        model: models.Signature,
        getActiveSignature: function(pos) {
            var config_signature = pos.get('signature');
            return this.get(config_signature.get('serial'));
        }
    });*/

    const RKSVOrderline = (Orderline) => class PosSaleOrderline extends Orderline {
        export_for_printing() {
            var data = super.export_for_printing(...arguments);
            data.rksv_product_type = this.product.rksv_product_type;
            data.taxes = this.get_taxes();
            return data;
        }
    }

    const RKSVOrder = (Order) => class PosSaleOrder extends Order {
        set_sign_result(result) {
            this.sign_result = true;
            // We need definitely to cleanup the whole process a bit..
            this.qrcodevalue = result.qrcodeValue;
            this.qrcode_img = result.qrcodeImage;
            this.ocrcodevalue = result.ocrcodeValue;
            this.receipt_id = result.receipt_id;
            if (this.receipt_id)
                this.formatted_receipt_id = ('00000000' + this.receipt_id).slice(-8);
            this.cashbox_mode = result.cashbox_mode;
            Object.assign(this, result);
        }
        set_sign_failed() {
            this.sign_result = true;
        }
        export_for_printing() {
            var data = super.export_for_printing(...arguments);
            if (!this.pos.config.iface_rksv)
                return data;
            data.qrcodevalue = this.qrcodevalue;
            data.qrcode_img = this.qrcode_img;
            data.ocrcodevalue = this.ocrcodevalue;
            data.receipt_id = this.receipt_id;
            data.formatted_receipt_id = this.formatted_receipt_id;
            data.kassenidentifikationsnummer = this.pos.config.cashregisterid;
            data.start_receipt = this.start_receipt;
            data.year_receipt = this.year_receipt;
            data.month_receipt = this.month_receipt;
            data.null_receipt = this.null_receipt;
            data.set_serial = this.set_serial;
            data.cashbox_mode = this.cashbox_mode;
            data.uid = this.uid;
            return data;
        }
        // Include RKSV Data for the export to odoo
        export_as_JSON() {
            var data = super.export_as_JSON(...arguments);
            if (!this.pos.config.iface_rksv)
                return data;
            var rksv_data = {
                'qrcodevalue': this.qrcodevalue,
                'qrcode_img': this.qrcode_img,
                'receipt_id': this.receipt_id,
                'ocrcodevalue': this.ocrcodevalue,
                'cashbox_mode': this.cashbox_mode,
                'typeOfReceipt': this.typeOfReceipt,
                'signatureSerial': this.signatureSerial,
                'encryptedTurnOverValue': this.encryptedTurnOverValue,
                'chainValue': this.chainValue,
                'signedJWSCompactRep': this.signedJWSCompactRep,
                'taxSetNormal': this.taxSetNormal,
                'taxSetErmaessigt1': this.taxSetErmaessigt1,
                'taxSetErmaessigt2': this.taxSetErmaessigt2,
                'taxSetNull': this.taxSetNull,
                'taxSetBesonders': this.taxSetBesonders,
                'turnOverValue': this.turnOverValue
            };
            return Object.assign(rksv_data, data);
        }
        // Read also stored RKSV data
        init_from_JSON(json) {
            super.init_from_JSON(...arguments);
            if (!this.pos.config.iface_rksv)
                return;
            this.qrcodevalue = json.qrcodevalue;
            this.qrcode_img = json.qrcode_img;
            this.ocrcodevalue = json.ocrcodevalue;
            this.receipt_id = json.receipt_id;
            this.cashbox_mode = json.cashbox_mode;
            this.typeOfReceipt = json.typeOfReceipt;
            this.signatureSerial = json.signatureSerial;
            this.encryptedTurnOverValue = json.encryptedTurnOverValue;
            this.chainValue = json.chainValue;
            this.signedJWSCompactRep = json.signedJWSCompactRep;
            this.taxSetNormal = json.taxSetNormal;
            this.taxSetErmaessigt1 = json.taxSetErmaessigt1;
            this.taxSetErmaessigt2 = json.taxSetErmaessigt2;
            this.taxSetNull = json.taxSetNull;
            this.taxSetBesonders = json.taxSetBesonders;
            this.turnOverValue = json.turnOverValue;
        }
    }

    Registries.Model.extend(PosGlobalState, RKSVPosGlobalState);
    Registries.Model.extend(Order, RKSVOrder);
    Registries.Model.extend(Orderline, RKSVOrderline);
    Registries.Model.add(Signature);

    return {
        Signature
    }

});