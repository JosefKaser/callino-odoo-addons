odoo.define('pos_rksv.RKSVFAPopupWidget', function (require) {
    "use strict";

    const RKSVPopupWidget = require('pos_rksv.RKSVPopupWidget');
    const Registries = require('point_of_sale.Registries');

    class RKSVFAPopupWidget extends RKSVPopupWidget {
        init(pos, options) {
            console.log('in RKSV FA Popup init');
            this._super(pos, options);
        }
        installEventHandler() {
            var self = this;
            // Install close button event handler
            this.$('.close_button').off();
            this.$('.close_button').on('click', function(){
                self.hide();
            });
        }
        show(show_options){
            var self = this;
            this._super(show_options);
            var signature = this.pos.get('signature');
            // Not sure if we need a signature for the starting record, but I guess we do
            if (signature === null){
                this.failure("No Signature provided yet.");
                return false
            }
            this.$('.rksvfa_serial').val(signature.get('serial'));
            this.$('.rksvfa_cashregisterid').val(this.pos.config.cashregisterid);
            this.$('.rksvfa_atu').val(this.pos.company.vat);
            this.loading("Bitte warten...");
            this.pos.proxy.connection.rpc(
                    '/hw_proxy/rksv_get_fa_data',
                    Object.assign(self.pos.rksv.get_rksv_info()),
                    {timeout: 7500}
                ).then(
                function done(response) {
                    self.$('.rksvfa_aes_key').val(response.aes_key);
                    if (response.start_receipt && response.start_receipt.qrcodeImage){
                        self.$('.rksvfa_image').attr('src', response.start_receipt.qrcodeImage);
                    } else {
                        self.$('#rksvfa_startbeleg').html('Kein Startbeleg vorhanden!');
                        self.$('.rksvfa_image').hide();
                    }
                    self.loading_done();
                },
                function failed() {
                    self.loading_done();
                }
            );
            this.installEventHandler();
        }
        hide(){
            if(this.$el){
                this.$el.addClass('oe_hidden');
            }
        }
        loading(message) {
            this.$('.content').addClass('oe_hidden');
            this.$('.loading').removeClass('oe_hidden');
            this.$('.loading').html(message);
        }
        loading_done() {
            this.$('.content').removeClass('oe_hidden');
            this.$('.loading').addClass('oe_hidden');
        }
        failure(message) {
            this.$('.data').addClass('oe_hidden');
            this.$('.loading').addClass('oe_hidden');
            this.$('.message').html('<p style="color: red;">' + message + '</p>');
        }
    }

    RKSVFAPopupWidget.template = 'RKSVFAPopupWidget';

    Registries.Component.add(RKSVFAPopupWidget);

    return RKSVFAPopupWidget;

    //gui.define_popup({name:'rksv_fa_widget', widget: RKSVFAPopupWidget});
});