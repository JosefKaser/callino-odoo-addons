# -*- coding: utf-8 -*-
{
    'name': 'Registrierkasse Österreich',
    'version': '14.0.1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Registrierkassenpflicht Modul für Österreich',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino), WT-IO-IT GmbH, Wolfgang Taferner',
    'license': "Other proprietary",
    'description': """
Registrierkasse Österreich
==================================

Registrierkassen Modul für die Anforderungen der Österreichischen Registrierkassenpflicht
""",
    'depends': [
        'point_of_sale',
        'pos_product_reference',
        'pos_invisible_products',
        'base_vat',
    ],
    'test': [
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/signature_provider.xml',
        'views/pos_config.xml',
        'views/pos_order.xml',
        'views/res_company.xml',
        'views/account.xml',
        'views/product.xml',
        'views/templates.xml',
        'data/data.xml'
    ],
    'qweb': [
        'static/src/xml/Screens/ReceiptScreen/OrderReceipt.xml',
        'static/src/xml/rksv.xml',
        'static/src/xml/Chrome.xml',
        'static/src/xml/ChromeWidgets/RKSVStatusWidget.xml',
        'static/src/xml/ChromeWidgets/DebugWidget.xml',
        'static/src/xml/Screens/RKSVStatusScreen/RKSVStatusScreen.xml',
        'static/src/xml/Screens/RKSVStatusScreen/CurrentRKSVSignature.xml',
        'static/src/xml/Screens/RKSVStatusScreen/RKSVSignatureProvider.xml',
        'static/src/xml/Screens/PaymentScreen/PaymentScreen.xml',
        'static/src/xml/Popups/RegisterCashboxPopupWidget.xml',
        'static/src/xml/Popups/RKSVFailureWidget.xml',
        'static/src/xml/Popups/RKSVPopupWidget.xml',
        'static/src/xml/Popups/RKSVFAPopupWidget.xml',
        'static/src/xml/Popups/RKSVReceiptPopup/RKSVReceiptPopup.xml',
        'static/src/xml/Popups/RKSVReceiptPopup/RKSVReceipt.xml',
    ],
    'installable': True,
    'auto_install': False,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
