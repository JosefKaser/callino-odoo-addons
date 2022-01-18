# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class SignatureProvider(models.Model):
    _name = "signature.provider"
    _description = "Signature Providers"
    _order = 'name'
    _inherit = ['mail.thread']

    name = fields.Char(string='Signature Name')
    serial = fields.Char(string='Serial')
    reader = fields.Char(string='Reader')
    valid_from = fields.Date(string='Valid From')
    valid_until = fields.Date(string='Valid Until')
    public_key = fields.Char(string='Public Key')
    provider_name = fields.Char(string='Provider Name')
    issuer = fields.Char(string='Issuer')
    subject = fields.Char(string='Subject')
    x509 = fields.Text(string='X509')
    company_id = fields.Many2one('res.company', string="Company")
    bmf_last_status = fields.Selection(
        selection=[
            ('UNBEKANNT', 'Unbekannt'),
            ('IN_BETRIEB', 'In Betrieb'),
            ('AUSFALL', 'Ausfall'),
        ],
        string="Status",
        readonly=True,
        default='UNBEKANNT',
        track_visibility='onchange',
        copy=False
    )
    bmf_last_update = fields.Datetime(
        string='Letztes Update vom BMF',
        copy=False)
    bmf_message = fields.Char(
        string="BMF Status Text",
        track_visibility='onchange',
        copy=False
    )
