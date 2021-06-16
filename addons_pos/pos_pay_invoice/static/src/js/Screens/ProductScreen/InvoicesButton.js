odoo.define('pos_pay_invoice.InvoicesButton', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require('web.custom_hooks');
	const Registries = require('point_of_sale.Registries');

	class InvoicesButton extends PosComponent {
		constructor() {
			super(...arguments);
			useListener('click', this.onClick);
		}
		async onClick() {
			var order = this.env.pos.get_order();
			if (!order) {
				return;
			}
			this.showTempScreen('InvoiceListScreen');
		}
	}
	InvoicesButton.template = 'SearchInvoicesButton';

	ProductScreen.addControlButton({
		component: InvoicesButton,
		condition: function() {
			return this.env.pos.config.search_invoices;
		},
	});

	Registries.Component.add(InvoicesButton);

	return InvoicesButton;
});
