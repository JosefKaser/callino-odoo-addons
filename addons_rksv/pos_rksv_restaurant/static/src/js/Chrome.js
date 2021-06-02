odoo.define('pos_rksv_restaurant.chrome', function (require) {
    'use strict';

    const Chrome = require('pos_restaurant.chrome');
    const Registries = require('point_of_sale.Registries');

    const RKSVRestaurantChrome = (Chrome) =>
        class extends Chrome {
            _showNormalStartScreen() {
                const { name, props } = super.startScreen;
                this.showScreen(name, props);
            }
        };

    Registries.Component.extend(Chrome, RKSVRestaurantChrome);

    return Chrome;
});
