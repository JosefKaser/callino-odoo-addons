# -*- coding: utf-8 -*-
{
    'name': 'Registrierkasse Österreich - Glue Module',
    'version': '13.0.0.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Registrierkassenpflicht Modul für Österreich',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino)',
    'license': "Other proprietary",
    'description': """
Registrierkasse Österreich - Rechnung
=======================================
""",
    'depends': ['pos_rksv', 'pos_order_mgmt'],
    'test': [
    ],
    'data': [
        'views/templates.xml',
    ],
    'qweb': [
    ],
    'installable': True,
    'auto_install': True,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
