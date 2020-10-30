odoo.define('pos_rksv.RKSVSProviderWiederinbetriebnahmePopupWidget', function (require) {
    "use strict";

    const RKSVPopupWidget = require('pos_rksv.RKSVPopupWidget');
    const Registries = require('point_of_sale.Registries');

    class RKSVSProviderWiederinbetriebnahmePopupWidget extends RKSVPopupWidget {}

    RKSVSProviderWiederinbetriebnahmePopupWidget.template = 'RKSVSProviderWiederinbetriebnahmePopupWidget';

    Registries.Component.add(RKSVSProviderWiederinbetriebnahmePopupWidget);

    return RKSVSProviderWiederinbetriebnahmePopupWidget;

    //gui.define_popup({name:'rksv_provider_wiederinbetriebnahme_widget', widget: RKSVSProviderWiederinbetriebnahmePopupWidget});
});