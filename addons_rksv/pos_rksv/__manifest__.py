# -*- coding: utf-8 -*-
{
    'name': 'Registrierkasse Österreich POS Addon',
    'version': '15.0.1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Registrierkassenpflicht Modul für Österreich',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino), WT-IO-IT GmbH, Wolfgang Taferner',
    'license': "Other proprietary",
    'description': """
Registrierkasse Österreich POS Addon
====================================

Registrierkassen Modul für die Anforderungen der Österreichischen Registrierkassenpflicht
""",
    'depends': [
        'point_of_sale',
        'pos_product_reference',
        'rksv_base',
    ],
    'test': [
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/signature_provider.xml',
        'views/pos_config.xml',
        'views/pos_order.xml',
        'views/product.xml',
        'data/data.xml'
    ],
    'assets': {
        'point_of_sale.assets': [
            'pos_rksv/static/src/js/db.js',
            'pos_rksv/static/src/js/models.js',
            'pos_rksv/static/src/js/pos.js',
            'pos_rksv/static/src/js/rksv.js',
            'pos_rksv/static/src/js/devices.js',
            'pos_rksv/static/src/js/Chrome.js',
            'pos_rksv/static/src/js/Popups/RKSVFailureWidget.js',
            'pos_rksv/static/src/js/Popups/RKSVPopupWidget.js',
            'pos_rksv/static/src/js/Popups/RegisterCashboxPopupWidget.js',
            'pos_rksv/static/src/js/Popups/RKSVBMFRegisterPopup.js',
            'pos_rksv/static/src/js/Popups/RKSVSProviderAusfallPopupWidget.js',
            'pos_rksv/static/src/js/Popups/RKSVSProviderWiederinbetriebnahmePopupWidget.js',
            'pos_rksv/static/src/js/Popups/RKSVFAPopupWidget.js',
            'pos_rksv/static/src/js/Popups/RKSVReceiptPopup/RKSVReceipt.js',
            'pos_rksv/static/src/js/Popups/RKSVReceiptPopup/RKSVReceiptPopup.js',
            'pos_rksv/static/src/js/ChromeWidgets/RKSVStatusWidget.js',
            'pos_rksv/static/src/js/ChromeWidgets/DebugWidget.js',
            'pos_rksv/static/src/js/Screens/PaymentScreen/PaymentScreen.js',
            'pos_rksv/static/src/js/Screens/ReceiptScreen/ReceiptScreen.js',
            'pos_rksv/static/src/js/Screens/RKSVStatusScreen/RKSVStatusScreen.js',
            'pos_rksv/static/src/js/Screens/RKSVStatusScreen/RKSVSignatureProvider.js',
        ],
        'point_of_sale.pos_assets_backend_style': [
            "pos_rksv/static/src/css/rksv.css",
        ],
        'web.assets_qweb': [
            'pos_rksv/static/src/xml/Screens/ReceiptScreen/OrderReceipt.xml',
            'pos_rksv/static/src/xml/rksv.xml',
            'pos_rksv/static/src/xml/Chrome.xml',
            'pos_rksv/static/src/xml/ChromeWidgets/RKSVStatusWidget.xml',
            'pos_rksv/static/src/xml/ChromeWidgets/DebugWidget.xml',
            'pos_rksv/static/src/xml/Screens/RKSVStatusScreen/RKSVStatusScreen.xml',
            'pos_rksv/static/src/xml/Screens/RKSVStatusScreen/CurrentRKSVSignature.xml',
            'pos_rksv/static/src/xml/Screens/RKSVStatusScreen/RKSVSignatureProvider.xml',
            'pos_rksv/static/src/xml/Screens/PaymentScreen/PaymentScreen.xml',
            'pos_rksv/static/src/xml/Popups/RegisterCashboxPopupWidget.xml',
            'pos_rksv/static/src/xml/Popups/RKSVFailureWidget.xml',
            'pos_rksv/static/src/xml/Popups/RKSVPopupWidget.xml',
            'pos_rksv/static/src/xml/Popups/RKSVFAPopupWidget.xml',
            'pos_rksv/static/src/xml/Popups/RKSVReceiptPopup/RKSVReceiptPopup.xml',
            'pos_rksv/static/src/xml/Popups/RKSVReceiptPopup/RKSVReceipt.xml',
        ],
    },
    'installable': True,
    'auto_install': False,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
