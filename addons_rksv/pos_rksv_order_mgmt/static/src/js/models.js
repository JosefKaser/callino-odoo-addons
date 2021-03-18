odoo.define('pos_rksv_order_mgmt.models', function (require) {
    "use strict";
    var widgets = require('pos_order_mgmt.widgets');


    widgets.OrderListScreenWidget.include({

        _prepare_order_from_order_data: function (order_data, action) {
            var order = this._super(order_data, action);
            order.qrcodevalue = order_data.qrcodevalue;
            order.qrcode_img = order_data.qr_code_image;
            order.receipt_id = order_data.receipt_id;
            order.cashbox_mode = order_data.cashbox_mode;
            if (order.receipt_id) {
                order.formatted_receipt_id = ('00000000' + order.receipt_id).slice(-8);
            }
            return order;
        }

    });

});
