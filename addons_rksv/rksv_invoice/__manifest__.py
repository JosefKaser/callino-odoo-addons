# -*- coding: utf-8 -*-
{
    'name': 'Bar-Zahlungen RKSV Signatur',
    'version': '15.0.1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Bar-Zahlungen RKSV Signatur',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino)',
    'license': "Other proprietary",
    'description': """
Bar-Zahlungen RKSV Signatur
===========================

Registrierkassen Modul für die Anforderungen der Österreichischen Registrierkassenpflicht.
Ermöglicht das Signieren von Bar Rechnungen im Odoo Backend
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
