# -*- coding: utf-8 -*-
{
    "name": "POS Product Reference",
    'version': '14.0.1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    "summary": "Druckt einen Referenz Text zum Produkt",
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino), WT-IO-IT GmbH, Wolfgang Taferner',
    'license': "Other proprietary",
    "category": "Point of Sale",
    "depends": ["base", 'point_of_sale'],
    'description': """
POS Product Reference
=============================

    *  31.01.2017: Erstellt - GB
    *  25.02.2017: Portiert auf Odoo v10 - WP
    *  29.10.2020: Portiert auf Odoo v14 - owl - WP

""",
    "data": [
            'views/pos_order_line.xml',
            'views/product_template.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'pos_product_reference/static/src/js/models.js',
            'pos_product_reference/static/src/js/Orderline.js',
        ],
        'point_of_sale.pos_assets_backend_style': [
            "pos_product_reference/static/src/css/pos_product_ref.css",
        ],
        'web.assets_qweb': [
            'pos_product_reference/static/src/xml/Orderline.xml'
        ]
    },
    "demo": [],
    "installable": True,
    "auto_install": False,
}
