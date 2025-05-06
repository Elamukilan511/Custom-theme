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

    page_name = frappe.local.request.path.strip("/").split("/")[-1] or "default"
    context.current_user = frappe.get_doc("User", frappe.session.user)
    context.show_sidebar = False
    context.page_name = page_name
    context.fields = frappe.get_meta(page_name).fields
    context.sidebar_items = [
        {"label": "Home", "route": "/"},
        {"label": "Dashboard", "route": "/dashboard"},
        {"label": "Settings", "route": "/settings"},
        {"label": "Medical List", "route": "/medical_list"}
    ]

# Fetch latest draft
    draft = frappe.get_all(
        page_name,
        filters={"owner": frappe.session.user, "docstatus": 0},
        fields=["name"],
        order_by="modified desc",
        limit=1
    )

    if draft:
        context.doc = frappe.get_doc(page_name, draft[0]["name"])
    else:
        doc = frappe.new_doc(page_name)
        doc.user_name = frappe.session.user  # or fetch full name from User
        doc.email = frappe.get_value("User", frappe.session.user, "email")
        # doc.save(ignore_permissions=True)
        context.doc = doc

@frappe.whitelist()
def get_user_draft():
    """Fetch the latest draft for the logged-in user"""
    user = frappe.session.user
    draft = frappe.get_all("FORM 2", filters={"owner": user, "docstatus": 0}, fields=["name"], order_by="modified desc", limit=1)

    if draft:
        return {"exists": True, "name": draft[0]["name"]}
    return {"exists": False}


@frappe.whitelist()
def update_data(data, submit=False):
    data = json.loads(data)

    if "name" in data and data["name"]:  
        try:
            doc = frappe.get_doc("FORM 2", data["name"])
        except frappe.DoesNotExistError:
            doc = None
    else:
        doc = None

    if doc and doc.docstatus == 0:
        doc.update(data)
    else:
        doc = frappe.new_doc("FORM 2")
        doc.update(data)
        doc.docstatus = 0
        doc.insert(ignore_permissions=True)

    if submit and doc.docstatus == 0:
        doc.submit()
        send_submission_email(doc)  # ðŸ’¥ Trigger email

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
            now=True  # Send immediately
        )
        frappe.logger().info(f"Ã¢Å“â€¦ Stylish Email sent to {recipient}")
    except Exception as e:
        frappe.log_error(f"Ã¢Å’ Email sending failed: {e}")


@frappe.whitelist()
def delete_draft(name):
    """Delete a draft record if the user selects 'No'"""
    if name:
        try:
            frappe.delete_doc("FORM 2", name, force=True)
            frappe.db.commit()
            return {"message": "Draft deleted successfully."}
        except frappe.DoesNotExistError:
            return {"message": "Draft not found."}


