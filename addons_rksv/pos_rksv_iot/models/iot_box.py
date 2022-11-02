from odoo import api, fields, models


class IOTBox(models.Model):
    _inherit = 'iot.box'

    rksv_box = fields.Boolean('RKSV AT Enabled', default=False)
