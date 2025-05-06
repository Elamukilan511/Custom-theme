# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: MIT. See LICENSE

import frappe
import frappe.www.list
from frappe import _
import json

no_cache = 1


def get_context(context):
	if frappe.session.user == "Guest":
		frappe.throw(_("You need to be logged in to access this page"), frappe.PermissionError)

	context.current_user = frappe.get_doc("User", frappe.session.user)
	context.show_sidebar = True
	context.fields =  frappe.get_meta('Form 1').fields
	context.sidebar_items = [
        {"label": "Home", "route": "/"},
        {"label": "Dashboard", "route": "/dashboard"},
        {"label": "Settings", "route": "/settings"},
    ]
