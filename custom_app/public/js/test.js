frappe.ui.form.on("*", {
    refresh: function(frm) {
        if (!frm.custom_button_added) {
            frm.custom_button_added = true;

            frm.add_custom_button("Global Button", function() {
                frappe.msgprint(`Server-side injected button clicked in ${frm.doc.doctype}: ${frm.doc.name}`);
            }, "Actions");
        }
    }
});
