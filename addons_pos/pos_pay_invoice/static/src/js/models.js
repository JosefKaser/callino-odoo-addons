/*
 Do allow the cashier to select an open invoice that the customer will pay
 */
odoo.define('pos_pay_invoice.models', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var _t = core._t;

    /*
    Define Invoice Model
     - in global models namespace
     */
    models.Invoice = Backbone.Model.extend({
        idAttribute: "id",
        initialize: function(attr,options) {
            this.pos = options.pos;
        },
        get_partner: function() {
            return this.pos.db.get_partner_by_id(this.get('partner_id')[0]);
        },
        get_partner_displayname: function() {
            var partner = this.get_partner();
            if (partner) {
                return partner.name;
            } else {
                return _t("Unknown");
            }
        },
    });

    /*
    Define Invoices Collection - does hold all loaded invoices
     - in global models namespace
     */
    models.Invoices = Backbone.Collection.extend({
        model: models.Invoice,
    });

    // Load invoices
    models.load_models({
        model: 'account.move',
        label: 'load_invoices',
        fields: ['name', 'ref', 'partner_id', 'invoice_date', 'amount_total', 'invoice_date_due', 'id', 'pos_order_id', 'payment_state', 'amount_residual'],
        domain: function (self) {
            return [['state', '=', 'posted'], ['pos_order_id', '=', false], ['move_type', 'in', ['out_invoice']], ['payment_state', 'in', ['not_paid','partial']]];   // Do load open out invoices
        },
        loaded: function (self, invoices) {
            self.invoices = invoices;
            self.db.add_invoices(invoices);
        }
    });

    var OrderlineModelSuper = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            this.invoice_id = null;
            OrderlineModelSuper.initialize.call(this, attr, options);
        },
        export_for_printing: function () {
            var data = OrderlineModelSuper.export_for_printing.call(this);
            if (this.invoice_id){
                data.invoice = this.pos.db.get_invoice_by_id(this.invoice_id);
            }
            return data;
        },
        clone: function() {
            if (this.invoice_id) {
                return null;
            }
            return OrderlineModelSuper.clone.call(this);
        },
        set_discount: function(discount) {
            if (this.invoice_id) {
                return null;
            }
            return OrderlineModelSuper.set_discount.call(this, discount);
        },
        set_unit_price: function(price){
            var invoice = this.pos.db.get_invoice_by_id(this.invoice_id);
            if ((invoice) && (price > invoice.amount_residual)) {
                this.order.trigger('ppi-error', {
                    'title': _t("Error"),
                    'body': _t("You can not pay more then the open invoice amount!")
                });
                return;
            }
            return OrderlineModelSuper.set_unit_price.call(this, price);
        },
        set_quantity: function(quantity, keep_price) {
            if ((this.invoice_id) && (quantity > 1)) {
                this.order.trigger('ppi-error', {
                    'title': _t("Error"),
                    'body': _t("You can not pay the invoice more than 1 time !")
                });
                return;
            }
            return OrderlineModelSuper.set_quantity.call(this, quantity, keep_price);
        },
        can_be_merged_with: function(orderline){
            if (this.invoice_id) {
                return false;
            }
            return OrderlineModelSuper.can_be_merged_with.call(this, orderline);
        },
        export_as_JSON: function() {
            var data = OrderlineModelSuper.export_as_JSON.call(this);
            data['invoice_id'] = this.invoice_id;
            return data;
        },
        init_from_JSON: function(json) {
            OrderlineModelSuper.init_from_JSON.call(this, json);
            if (json['invoice_id'])  {
                this.set_unit_price(json['price_unit']);
                this.invoice_id = json['invoice_id'];
                this.price_manually_set = true;
            }
        },
    });

    var OrderModelSuper = models.Order.prototype;
    models.Order = models.Order.extend({
        add_product: function(product, options) {
            var last_orderline = this.get_last_orderline();
            if ((last_orderline) && (last_orderline.invoice_id)) {
                // Nothing else is allowed - so create new order here
                this.pos.add_new_order();
                var order = this.pos.get_order();
                order.add_product(product, options);
                if (options && options.extras && options.extras.invoice) {
                    var orderline = this.get_last_orderline();
                    last_orderline.invoice_id = options.extras.invoice.get('id');
                    this.orderlines.trigger('change', last_orderline)
                }
                return;
            }
            // Everything is ok - proceed
            OrderModelSuper.add_product.call(this, product, options);
            if (options && options.extras && options.extras.invoice) {
                var last_orderline = this.get_last_orderline();
                last_orderline.invoice_id = options.extras.invoice.id;
                this.orderlines.trigger('change', last_orderline)
            }
        },
    });

});