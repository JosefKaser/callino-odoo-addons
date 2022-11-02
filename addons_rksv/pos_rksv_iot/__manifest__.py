# -*- coding: utf-8 -*-
{
    'name': 'Registrierkasse Österreich POS Addon - POS IOT ',
    'version': '15.0.1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Registrierkassenpflicht Modul für Österreich - POS IOT Erweiterung',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino), WT-IO-IT GmbH, Wolfgang Taferner',
    'license': "Other proprietary",
    'description': """
Registrierkasse Österreich POS Addon - POS IOT
====================================

Registrierkassen Modul für die Anforderungen der Österreichischen Registrierkassenpflicht
Erweiterung für den gebrauch mit pos_iot
""",
    'depends': [
        'pos_rksv',
        'pos_iot'
    ],
    'test': [
    ],
    'data': [
        'views/pos_config.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'pos_rksv_iot/static/src/js/devices.js',
        ],
        'point_of_sale.pos_assets_backend_style': [
        ],
        'web.assets_qweb': [
        ],
    },
    'installable': True,
    'auto_install': True,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
