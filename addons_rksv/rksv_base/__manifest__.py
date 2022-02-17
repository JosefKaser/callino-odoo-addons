# -*- coding: utf-8 -*-
{
    'name': 'Registrierkasse Österreich Base Module',
    'version': '15.0.1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Registrierkassenpflicht Modul für Österreich, Basismodul',
    'website': 'https://github.com/Odoo-Austria',
    'author': 'Wolfgang Pichler (Callino)',
    'license': "Other proprietary",
    'description': """
Registrierkasse Österreich Basis Modul
======================================

Registrierkassen Modul für die Anforderungen der Österreichischen Registrierkassenpflicht.
Basis Modul
""",
    'depends': [
        'pos_invisible_products',
        'base_vat',
    ],
    'test': [
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/signature_provider.xml',
        'views/res_company.xml',
        'views/account.xml',
        'views/product.xml',
        'data/data.xml'
    ],
    'installable': True,
    'auto_install': False,
    "external_dependencies": {
        "python": [],
        "bin": []
    },
}
