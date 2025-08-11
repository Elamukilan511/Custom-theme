import frappe

@frappe.whitelist(allow_guest=True)
def get_megamenu(root_node=None):
    if not root_node:
        root_node = "SERVICE"  # Fallback if no root node is provided

    def fetch_children(parent):
        return frappe.get_all("MegaMenu",
            filters={"parent_megamenu": parent},
            fields=["name", "megamenu", "route", "is_group"]
        )

    menu = []
    top_items = fetch_children(root_node)

    for item in top_items:
        first_level = {
            "title": item.megamenu,
            "route": item.route,
            "children": []
        }
        if item.is_group:
            second_level_items = fetch_children(item.name)
            for sub in second_level_items:
                second_level = {
                    "title": sub.megamenu,
                    "route": sub.route,
                    "children": []
                }
                if sub.is_group:
                    third_level_items = fetch_children(sub.name)
                    for subsub in third_level_items:
                        third_level = {
                            "title": subsub.megamenu,
                            "route": subsub.route
                        }
                        second_level["children"].append(third_level)
                first_level["children"].append(second_level)
        menu.append(first_level)

    # Fetch promo data with a fallback
    promo_data = frappe.db.get_value("MegaMenu",
        {"parent_megamenu": root_node},
        as_dict=True
    ) or {}

    return {
        "menu": menu,
        "promo_image": promo_data.get("promo_image") or "/files/bio_img.png",
        "promo_text": promo_data.get("promo_text") or "Explore our advanced gene research tools"
    }