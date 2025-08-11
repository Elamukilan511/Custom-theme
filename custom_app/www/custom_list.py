import frappe
from frappe import _
import json

no_cache = 1

def get_context(context):

    if frappe.session.user == "Guest":
        frappe.throw(_("You need to be logged in to access this page"), frappe.PermissionError)

    page_name = frappe.local.request.path.strip("/").split("/")[-1] or "default"
    doctype = frappe.form_dict.doctype
    if not doctype:
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = "/select-doctype"
        return

    # Get fieldnames (you can change which fields you want)
    fields = [f.fieldname for f in frappe.get_meta(doctype).fields if f.in_list_view]
    print(fields)

    # Fallback if no in_list_view fields found
    if not fields:
        fields = [ "modified"]

    # Get human-readable labels
    columns = []
    meta = frappe.get_meta(doctype)
    for field in fields:
        label = next((f.label for f in meta.fields if f.fieldname == field), field)
        columns.append({"fieldname": field, "label": label})

    # Fetch data
    limit = 20
    data = frappe.get_all(
        doctype,
        fields=fields,
        order_by="modified desc",
        start=0,
        limit=limit
    )

    context.page_title = f"{doctype} List"
    context.doctype = doctype
    context.columns = columns
    context.data = data
    context.limit = limit
    context.total = frappe.db.count(doctype)

@frappe.whitelist()
def load_more_data(doctype, start=0, limit=20):
    from urllib.parse import unquote
    doctype = unquote(doctype)
    fields = [f.fieldname for f in frappe.get_meta(doctype).fields if f.in_list_view]
    if not fields:
        fields = ["name", "modified"]

    return frappe.get_all(
        doctype,
        fields=fields,
        order_by="modified desc",
        start=int(start),
        limit=int(limit)
    )
