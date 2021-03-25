odoo.define('pos_restaurant.chrome', function (require) {
    'use strict';

    const Chrome = require('point_of_sale.Chrome');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');

    const RKSVChrome = (Chrome) =>
        class extends Chrome {
            constructor() {
                super(...arguments);
                useListener('show-start-screen', this._showStartScreen);
            }
            /**
             * @override
             * Do not set `RKSVStatusScreen` to the order.
             */
            _setScreenData(name) {
                if (name === 'RKSVStatusScreen') return;
                super._setScreenData(...arguments);
            }
            /**
             * @override
             * `RKSVStatusScreen` is the start screen if there is the rksv enabled.
             */
            get startScreen() {
                if (this.env.pos.config.iface_rksv) {
                    return { name: 'RKSVStatusScreen' };
                } else {
                    return super.startScreen;
                }
            }
        };

    Registries.Component.extend(Chrome, RKSVChrome);

    return Chrome;
});
