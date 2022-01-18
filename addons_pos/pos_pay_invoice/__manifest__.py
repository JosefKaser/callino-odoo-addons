# -*- coding: utf-8 -*-
{
    'name': 'PoS Pay Invoice',
    'version': '14.0.0.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Pay open invoice directly in PoS session',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino), WT-IO-IT GmbH, Wolfgang Taferner',
    'license': "Other proprietary",
    'description': """
PoS Pay Invoice
===============

Pay invoice directly on in pos session
""",
    'depends': ['point_of_sale', 'pos_product_reference'],
    'test': [
    ],
    'data': [
        'views/pos_config.xml',
        'views/pos_order.xml',
        'views/account_move.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'pos_pay_invoice/static/src/js/pos.js',
            'pos_pay_invoice/static/src/js/models.js',
            'pos_pay_invoice/static/src/js/db.js',
            'pos_pay_invoice/static/src/js/Screens/ProductScreen/InvoicesButton.js',
            'pos_pay_invoice/static/src/js/Screens/ProductScreen/ProductScreen.js',
            'pos_pay_invoice/static/src/js/Screens/InvoiceList/InvoiceLine.js',
            'pos_pay_invoice/static/src/js/Screens/InvoiceList/InvoiceListScreen.js',
            'pos_pay_invoice/static/src/css/invoices.css'
        ]
    },
    'qweb': [
        'static/src/xml/Screens/ProductScreen/InvoicesButton.xml',
        'static/src/xml/Screens/InvoiceList/InvoiceListScreen.xml',
        'static/src/xml/Screens/InvoiceList/InvoiceLine.xml',
    ],
    'installable': True,
    'auto_install': False,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
