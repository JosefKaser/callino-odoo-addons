odoo.define('pos_rksv.RKSVFailureWidget', function (require) {
    "use strict";

    const { useState, useRef } = owl.hooks;
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');

    /*
    RKSV Generic Failure Widget
    - configureable buttons
     */
    class RKSVFailureWidget extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.state = useState({
                title: arguments[1].title,
                body: arguments[1].body,
            });
        }
    }

    RKSVFailureWidget.template = 'RKSVFailureWidget';
    RKSVFailureWidget.defaultProps = {
        title: 'Fehler',
        body: 'Genauere Details zum Fehler'
    };

    Registries.Component.add(RKSVFailureWidget);

    return RKSVFailureWidget;
});