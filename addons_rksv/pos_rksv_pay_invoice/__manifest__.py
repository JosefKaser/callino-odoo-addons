# -*- coding: utf-8 -*-
{
    'name': 'Registrierkasse Österreich - Rechnung über PoS zahlen',
    'version': '13.0.0.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Registrierkassenpflicht Modul für Österreich',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino), WT-IO-IT GmbH, Wolfgang Taferner',
    'license': "Other proprietary",
    'description': """
Registrierkasse Österreich - Rechnung
=======================================
""",
    'depends': ['pos_rksv', 'pos_pay_invoice'],
    'test': [
    ],
    'data': [
        'views/account_invoice.xml',
    ],
    'qweb': [
    ],
    'installable': False,
    'auto_install': True,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
