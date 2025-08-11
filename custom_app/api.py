import frappe

@frappe.whitelist()
def get_doctype_records(doctype):
    # Get the "Link" field's options dynamically
    child_meta = frappe.get_meta(doctype)
    link_field = next((df for df in child_meta.fields if df.fieldtype == "Link"), None)

    if link_field and link_field.options:
        target_doctype = link_field.options  # Get the Doctype dynamically (e.g., "File1")
    else:
        return []  # No valid Link field found

    # Fetch records from the dynamically determined target Doctype
    return frappe.get_all(target_doctype, fields=["name"])

# Show the Table List  
@frappe.whitelist()
def get_medical_data():
    return frappe.get_all("Medical", fields=["owner","name","user_name", "email", "phone_number", "affiliation", "address", "person", "data", "project_name", "project_des", "sample_type", "samples_fiels", "reference", "preferred", "information", "application_system", "specify_other", "sequencing_type", "sequencing_depth", "data_format", "specify_others", "quality"])