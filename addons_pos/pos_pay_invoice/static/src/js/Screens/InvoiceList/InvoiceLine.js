odoo.define('pos_pay_invoice.InvoiceLine', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class InvoiceLine extends PosComponent {
        get highlight() {
            return this.props.invoice !== this.props.selectedInvoice ? '' : 'highlight';
        }
        get total() {
            return this.env.pos.format_currency(this.props.invoice.amount_residual);
        }
        get partner_displayname() {
            var string = this.props.invoice.partner_id[1];
            var length = 20;
            return string.length > length ? string.substring(0, length - 3) + "..." : string;
        }

    }
    InvoiceLine.template = 'InvoiceLine';

    Registries.Component.add(InvoiceLine);

    return InvoiceLine;
});
