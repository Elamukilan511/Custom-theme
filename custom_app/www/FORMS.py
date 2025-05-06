
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

    # Extract page name and dynamic doctype
    page_name = frappe.local.request.path.strip("/").split("/")[-1] or "default"
    doctype = frappe.form_dict.doctype or "Medical"  # <-- Dynamically fetch Doctype

    context.current_user = frappe.get_doc("User", frappe.session.user)
    context.show_sidebar = False
    context.page_name = page_name
    context.doctype = doctype  # Make it accessible in Jinja if needed
    context.fields = frappe.get_meta(doctype).fields
    context.sidebar_items = [
        {"label": "Home", "route": "/"},
        {"label": "Dashboard", "route": "/dashboard"},
        {"label": "Settings", "route": "/settings"},
        {"label": "Medical List", "route": "/medical_list"}
    ]

    # Fetch latest draft
    draft = frappe.get_all(
        doctype,
        filters={"owner": frappe.session.user, "docstatus": 0},
        fields=["name"],
        order_by="modified desc",
        limit=1
    )

    if draft:
        context.doc = frappe.get_doc(doctype, draft[0]["name"])
    else:
        doc = frappe.new_doc(doctype)
        doc.user_name = frappe.session.user
        doc.email = frappe.get_value("User", frappe.session.user, "email")
        doc.save(ignore_permissions=True)
        context.doc = doc

@frappe.whitelist()
def get_user_draft(doctype="Medical"):
    """Fetch the latest draft for the logged-in user"""
    user = frappe.session.user
    draft = frappe.get_all(
        doctype,
        filters={"owner": user, "docstatus": 0},
        fields=["name"],
        order_by="modified desc",
        limit=1
    )

    if draft:
        return {"exists": True, "name": draft[0]["name"]}
    return {"exists": False}


@frappe.whitelist()
def update_data(data, submit=False, doctype="Medical"):
    data = json.loads(data)

    doc = None
    if "name" in data and data["name"]:
        try:
            doc = frappe.get_doc(doctype, data["name"])
        except frappe.DoesNotExistError:
            doc = None

    if doc and doc.docstatus == 0:
        doc.update(data)
    else:
        doc = frappe.new_doc(doctype)
        doc.update(data)
        doc.docstatus = 0
        doc.insert(ignore_permissions=True)

    if submit and doc.docstatus == 0:
        doc.submit()
        send_submission_email(doc)

    frappe.db.commit()
    return {"message": "Success!", "name": doc.name, "docstatus": doc.docstatus}


def send_submission_email(doc):
    try:
        recipient = doc.email or frappe.session.user
        subject = f"Form Submitted: {doc.name}"
        message = frappe.render_template("templates/emails/form_submit_template.html", {"doc": doc})

        frappe.sendmail(
            recipients=[recipient],
            subject=subject,
            message=message,
            now=True
        )
        frappe.logger().info(f"✔️ Email sent to {recipient}")
    except Exception as e:
        frappe.log_error(f"❌ Email sending failed: {e}")


@frappe.whitelist()
def delete_draft(name, doctype="Medical"):
    """Delete a draft record if the user selects 'No'"""
    if name:
        try:
            frappe.delete_doc(doctype, name, force=True)
            frappe.db.commit()
            return {"message": "Draft deleted successfully."}
        except frappe.DoesNotExistError:
            return {"message": "Draft not found."}
