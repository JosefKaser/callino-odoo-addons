# -*- coding: utf-8 -*-
{
    'name': 'RKSV Bar Rechnungen',
    'version': '12.0.0.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Registrierkassenpflicht Modul für Österreich',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino)',
    'license': "Other proprietary",
    'description': """
Registrierkasse Österreich
==================================

Registrierkassen Modul für die Anforderungen der Österreichischen Registrierkassenpflicht.
Ermöglicht das Signieren von Bar Rechnungen
""",
    'depends': [
        'account',
        'rksv_base',
    ],
    'test': [
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/account_invoice.xml',
        'views/account_journal.xml',
        'views/account_payment.xml',
        'views/rksv_box.xml',
        'views/signature_provider.xml',
        'data/cron.xml',
    ],
    'installable': True,
    'auto_install': False,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
