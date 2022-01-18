# -*- coding: utf-8 -*-
{
    'name': 'Registrierkasse Österreich Restaurant',
    'version': '14.0.0.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Registrierkassenpflicht Modul für Österreich, Restaurant Erweiterung',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino), WT-IO-IT GmbH, Wolfgang Taferner',
    'license': "Other proprietary",
    'description': """
Registrierkasse Österreich
==================================

Erweiterung zum Basis RKSV Modul für die Restaurant Erweiterung
""",
    'depends': ['pos_rksv', 'pos_restaurant'],
    'test': [
    ],
    'data': [
        'views/pos_config.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'pos_rksv_restaurant/static/src/js/rksv.js',
        ],
    },
    'qweb': [
    ],
    'installable': True,
    'auto_install': True,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
