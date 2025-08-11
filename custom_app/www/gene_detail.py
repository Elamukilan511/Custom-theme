import frappe
from frappe import _
import json

no_cache = 1

def get_context(context):
    # if frappe.session.user == "Guest":
    #     frappe.throw(_("You need to be logged in to access this page"), frappe.PermissionError)

    # page_name = frappe.local.request.path.strip("/").split("/")[-1] or "default"
    doc_name = frappe.form_dict.name
    print("doc_name", doc_name)
    if not doc_name:
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = "/select-doctype"
        return

    context.current_user = frappe.get_doc("User", frappe.session.user)
    context.show_sidebar = False
    # context.page_name = page_name
    context.doc = frappe.get_doc("Gene Data", doc_name)