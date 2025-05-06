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

    path_parts = frappe.request.path.split("/")
    if len(path_parts) > 2:
        context.doctype = path_parts[2]

    # Fetch dynamic Doctypes + Hardcoded Doctypes
    extra_doctypes = frappe.get_all("DocType", filters={"custom": 1}, fields=["name"])
    fixed_doctypes = [{"name": "Medical"}] + extra_doctypes

    # Merge both lists into the sidebar
    context.sidebar_items = [{"label": dt["name"], "route": "/test/"+dt['name']} for dt in fixed_doctypes]
    context.fields =  frappe.get_meta(context.doctype).fields

@frappe.whitelist(allow_guest=True)
def update_data(data):
	nd = frappe.new_doc('Form 1')
	data = json.loads(data)
	# frappe.msgprint(nd)
	# frappe.msgprint(data)
	nd.update(data)
	nd.save(ignore_permissions=True)
	frappe.db.commit()