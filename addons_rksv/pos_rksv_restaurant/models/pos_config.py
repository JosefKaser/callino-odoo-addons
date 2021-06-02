# -*- coding: utf-8 -*-
from odoo import models, fields, api, _


class POSConfig(models.Model):
    _name = 'pos.config'
    _inherit = 'pos.config'

    default_table_id = fields.Many2one(
        comodel_name='restaurant.table',
        string='Standard Tisch',
        required=True
    )
