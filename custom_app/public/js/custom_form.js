frappe.ui.form.on('*', {
    refresh: function (frm) {
        if (!frm.custom_buttons || !frm.custom_buttons['Back']) {
            frm.add_custom_button(__('Back'), function () {
                frappe.msgprint({
                    title: __('Action Triggered'),
                    message: __('This is a global custom button action!'),
                    indicator: 'green',
                });
            }, __('Utilities')); 
        }
    }
});
