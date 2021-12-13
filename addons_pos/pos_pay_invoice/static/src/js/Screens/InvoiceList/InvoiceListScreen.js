odoo.define('pos_pay_invoice.InvoiceListScreen', function(require) {
    'use strict';

    const { debounce } = owl.utils;
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');

    class InvoiceListScreen extends PosComponent {
        constructor() {
            super(...arguments);
            this.state = {
                query: null,
                selectedInvoice: null,
            };
            this.updateInvoiceList = debounce(this.updateInvoiceList, 70);
        }
        mounted() {
            this.updateInvoiceList();
        }
        // Lifecycle hooks
        back() {
            this.trigger('close-temp-screen');
        }
        reload() {
            this.updateInvoiceList();
        }
        pay_invoice() {
            var order = this.env.pos.get_order();
            if ((!order) || (!order.is_empty())) {
                // Create a new order
                this.env.pos.add_new_order();
                // And get it
                order = this.env.pos.get_order();
            }
            var client_id = this.state.selectedInvoice.partner_id[0];
            var partner = this.env.pos.db.get_partner_by_id(client_id);
            // Set invoice partner as order client
            order.set_client(partner);
            order.fiscal_position = _.find(this.env.pos.fiscal_positions, function (fp) {
                return fp.id === partner.property_account_position_id[0];
            });

            var product = this.env.pos.db.get_product_by_id(this.env.pos.config.invoice_product_id[0]);
            // Add product to order
            order.add_product(product, {
                quantity: 1,
                price_extra: this.state.selectedInvoice.amount_residual,
                lst_price: 0,
                price: undefined,
                extras: {
                    invoice: this.state.selectedInvoice,
                    invoice_id: this.state.selectedInvoice.id,
                    product_ref_text: this.state.selectedInvoice.name,
                    price_manually_set: true,
                },
                merge: false,
            });
            this.trigger('close-temp-screen');
        }
        async print_invoice() {
            await this.env.pos.do_action('account.account_invoices', {
                additional_context: {
                    active_ids: [this.state.selectedInvoice.id],
                },
            });
        }
        // Getters

        get currentOrder() {
            return this.env.pos.get_order();
        }

        get invoices() {
            if (this.state.query && this.state.query.trim() !== '') {
                return this.env.pos.db.search_invoices(this.state.query.trim());
            } else {
                return this.env.pos.db.get_invoices();
            }
        }

        // Methods

        // We declare this event handler as a debounce function in
        // order to lower its trigger rate.
        updateInvoiceList(event) {
            if (event) {
                this.state.query = event.target.value;
            }
            var self = this;
            this.env.pos.reload_invoices().then(function() {
                self.render();
            });
        }
        clickInvoice(event) {
            let invoice = event.detail.invoice;
            if (this.state.selectedInvoice === invoice) {
                this.state.selectedInvoice = null;
            } else {
                this.state.selectedInvoice = invoice;
            }
            this.render();
        }
    }
    InvoiceListScreen.template = 'InvoiceListScreen';

    Registries.Component.add(InvoiceListScreen);

    return InvoiceListScreen;
});
