odoo.define('point_of_sale.RKSVReceipt', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class RKSVReceipt extends PosComponent {
        constructor() {
            super(...arguments);
            this._receipt = this.props.receipt;
        }
        get receipt() {
            return this._receipt;
        }
    }
    RKSVReceipt.template = 'RKSVReceipt';

    Registries.Component.add(RKSVReceipt);

    return RKSVReceipt;
});
