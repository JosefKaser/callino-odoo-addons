odoo.define('pos_pay_invoice.ProductScreen', function(require) {
    'use strict';

    const ProductScreen = require('point_of_sale.ProductScreen');
    const Registries = require('point_of_sale.Registries');
    const { onChangeOrder } = require('point_of_sale.custom_hooks');

    const PayInvoiceProductScreen = (ProductScreen) =>
        class extends ProductScreen {
            constructor() {
                super(...arguments);
                onChangeOrder(this._removePPIErrorListener, this._addPPIErrorListener);
            }

            _removePPIErrorListener(order) {
                order.off('ppi-error');
            }
            _addPPIErrorListener(order) {
                var self = this;
                order.on('ppi-error', function(error) {
                    self.showPopup('ErrorPopup',{
                        'title': error.title,
                        'body': error.body,
                    });
                });
            }
        };

    Registries.Component.extend(ProductScreen, PayInvoiceProductScreen);

    return ProductScreen;
});