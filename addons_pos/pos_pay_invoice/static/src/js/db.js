odoo.define('pos_pay_invoice.db', function (require) {
    "use strict";

    var PosDB = require("point_of_sale.DB");

    // This is still ok for odoo pos v14
    PosDB.include({
        init: function(options){
            this._super(options);
            this.invoice_by_id = {};
            this.invoice_sorted = [];
        },

        get_invoice_by_id: function(id) {
            return id in this.invoice_by_id ? this.invoice_by_id[id] : null;
        },

        update_invoices: function(invoices) {
            var invoice;
            // First - remove invoice not in the list any more
            var invoice_ids = [];
            for(var i = 0, len = invoices.length; i < len; i++) {
                invoice_ids.push(invoices[i].id);
            }
            var clear_invoices = $(this.invoice_sorted).not(invoice_ids).get();
            for(var i = 0, len = clear_invoices.length; i < len; i++) {
                if (this.invoice_by_id[clear_invoices[i]]) {
                    delete this.invoice_by_id[clear_invoices[i]];
                    this.invoice_sorted.splice(this.invoice_sorted.indexOf(clear_invoices[i]), 1);
                }
            }
            for(var i = 0, len = invoices.length; i < len; i++) {
                invoice = invoices[i];
                if (!this.invoice_by_id[invoice.id]) {
                    this.invoice_sorted.push(invoice.id);
                }
                this.invoice_by_id[invoice.id] = invoice;
            }
        },
        add_invoices: function(invoices) {
            var invoice;
            for(var i = 0, len = invoices.length; i < len; i++) {
                invoice = invoices[i];
                if (!this.invoice_by_id[invoice.id]) {
                    this.invoice_sorted.push(invoice.id);
                }
                this.invoice_by_id[invoice.id] = invoice;
            }
        },

        get_invoices: function(){
            var invoices = [];
            for (var i = 0; i < this.invoice_sorted.length; i++) {
                invoices.push(this.invoice_by_id[this.invoice_sorted[i]]);
            }
            return invoices;
        },

        search_invoices: function(term){
            var invoices = [];
            var invoice;
            for (var i = 0; i < this.invoice_sorted.length; i++) {
                invoice = this.invoice_by_id[this.invoice_sorted[i]];
                if (invoice.name.includes(term) ||  invoice.partner_id[1].includes(term)) {
                    invoices.push(invoice);
                }
            }
            return invoices;
        },
    });
});