import frappe
from frappe import _
import json

no_cache = 1

def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(_("You need to be logged in to access this page"), frappe.PermissionError)

    context.current_user = frappe.get_doc("User", frappe.session.user)
    context.show_sidebar = False

    path_parts = frappe.request.path.split("/")
    if len(path_parts) > 2 and path_parts[1] == "f":
        context.doctype = path_parts[2]

    # Fetch dynamic Doctypes + Hardcoded Doctypes
    extra_doctypes = frappe.get_all("DocType", filters={"custom": 1}, fields=["name"])
    fixed_doctypes = [{"name": "Medical"}] + extra_doctypes

    # Merge both lists into the sidebar
    context.sidebar_items = [{"label": dt["name"], "route": "/f/"+dt['name']} for dt in fixed_doctypes]
    context.fields =  frappe.get_meta(context.doctype).fields
    

@frappe.whitelist()
def get_fields(doctype):
    if not doctype:
        return {"status": "error", "message": "Doctype not provided"}
    
    try:
        meta = frappe.get_meta(doctype)
        fields = [
            {"fieldname": f.fieldname, "label": f.label, "fieldtype": f.fieldtype, "options": f.options or ""}
            for f in meta.fields
        ]
        return {"status": "success", "fields": fields}
    except Exception as e:
        frappe.log_error(f"Error in get_fields: {str(e)}")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def update_data(data):
    try:
        data = json.loads(data)
        doc = frappe.get_doc(data["doctype"], data.get("name")) if data.get("name") else frappe.new_doc(data["doctype"])
        doc.update(data)
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        return {"status": "success", "message": "Data saved successfully"}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Form Submission Error")
        frappe.throw(_("There was an error saving the form. Please try again."))
