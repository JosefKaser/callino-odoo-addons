odoo.define('pos_rksv.RKSVPaymentScreen', function(require) {
    'use strict';

    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const Registries = require('point_of_sale.Registries');

    const RKSVPaymentScreen = (PaymentScreen) =>
        class extends PaymentScreen {
            finalize_validation() {
                if (!this.pos.config.iface_rksv)
                    return this._super();

                var self = this;
                var order = this.pos.get_order();

                if (order.push_to_rksv) {
                    // If validation date is already set - then this order is already in validation state - so do not send it a second time
                    self.gui.show_popup('error',{
                        'title': _t('Not allowed'),
                        'body': _t('This order is already transmitted'),
                    });
                    return;
                }
                // Set the push to rksv flag
                order.push_to_rksv = true;

                if (order.is_paid_with_cash() && this.pos.config.iface_cashdrawer) {
                    this.pos.proxy.open_cashbox();
                }
                order.initialize_validation_date();
                self.pos.rksv.rksv_wait();

                if (order.is_to_invoice()) {
                    var invoiced = this.pos.push_and_invoice_order(order);
                    this.invoicing = true;

                    invoiced.fail(function(error){
                        // Reset the push to rksv flag
                        order.push_to_rksv = false;
                        self.invoicing = false;
                        if (error.message === 'Missing Customer') {
                            self.gui.show_popup('confirm',{
                                'title': _t('Please select the Customer'),
                                'body': _t('You need to select the customer before you can invoice an order.'),
                                confirm: function(){
                                    self.gui.show_screen('clientlist');
                                },
                            });
                            // Set the push to rksv flag back
                            self.pos.rksv.rksv_done();
                        } else if (error.code < 0) {        // XmlHttpRequest Errors
                            self.gui.show_popup('error',{
                                'title': _t('The order could not be sent'),
                                'body': _t('Check your internet connection and try again.'),
                            });
                        } else if (error.code === 200) {    // OpenERP Server Errors
                            self.gui.show_popup('error-traceback',{
                                'title': error.data.message || _t("Server Error"),
                                'body': error.data.debug || _t('The server encountered an error while receiving your order.'),
                            });
                        } else {                            // ???
                            self.gui.show_popup('error',{
                                'title': _t("Unknown Error"),
                                'body':  _t("The order could not be sent to the server due to an unknown error"),
                            });
                        }
                    });

                    invoiced.done(function(){
                        self.invoicing = false;
                        self.gui.show_screen('receipt');
                        self.pos.rksv.rksv_done();
                    });
                } else {
                    this.pos.push_order(order).then(
                        function done(){
                            self.gui.show_screen('receipt');
                            self.pos.rksv.rksv_done();
                            console.log('RKSV has done its job - we have signed the order');
                        },
                        function failed(message){
                            self.pos.rksv.rksv_done();
                            self.pos.gui.show_popup('error',{
                                'title': _t("RKSV Fehler"),
                                'body':  message
                            });
                        }
                    );
                }
            }
            start() {
                var self = this;
                this._super();
                // do bind on proxy status change - disable action bar when we lose proxy connection
                this.pos.proxy.on('change:status', this, function (eh, status) {
                    if (!self.pos.rksv.all_ok()) {
                        this.$('.next').hide();
                    } else {
                        this.$('.next').show();
                    }
                });
            }
        };

    Registries.Component.extend(PaymentScreen, RKSVPaymentScreen);

    return PaymentScreen;
});