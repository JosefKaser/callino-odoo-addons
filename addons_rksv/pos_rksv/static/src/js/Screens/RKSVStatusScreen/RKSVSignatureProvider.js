odoo.define('pos_rksv.RKSVSignatureProvider', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class RKSVSignatureProvider extends PosComponent {
        get valid_vat() {
            var signature = this.props.signature;
            if (signature.matchVAT(this.env.pos.company.bmf_vat_number)) {
                return true;
            }
            // Try to match against Steuernummer
            if (signature.matchTaxNumber(this.env.pos.company.bmf_tax_number)) {
                return true;
            }
            return false;
        }

        reload_status() {
            this.env.pos.rksv.bmf_sprovider_status(this.props.signature.get('serial'));
        }
    }
    RKSVSignatureProvider.template = 'RKSVSignatureProvider';

    Registries.Component.add(RKSVSignatureProvider);

    return RKSVSignatureProvider;
});
