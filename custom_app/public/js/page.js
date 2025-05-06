
frappe.ui.Page = class CustomPage extends frappe.ui.Page{
	constructor(opts){
		super(opts);
		
	}

	make() {
		super.make();
		this.setup_menupage_view();
	}
	

	setup_menupage_view(){

		let arrow = document.querySelectorAll(".arrow");
		for (var i = 0; i < arrow.length; i++) {
			arrow[i].addEventListener("click", (e)=>{
				let arrowParent = e.target.parentElement.parentElement;//selecting main parent of arrow
				arrowParent.classList.toggle("showMenu");
			});
		}
	}

	add_main_section() {
		
		$(frappe.render_template("page", {})).appendTo(this.wrapper);
		
		var sb =`<div class="row layout-main">
		<div class="custom_sidebar">
        <ul class="nav-links">`
		
		$.each(frappe.boot.custom_workspace.pages,  function(i,  item) {
			sb +=`<li>
				<div class="icon-link">
				<a href="/app/${
						item.public
						? frappe.router.slug(item.title)
						: "private/" + frappe.router.slug(item.title)
				}">
					<i class='${__(item.custom__icon)}'></i>
					<span class="link_name">${__(item.title)}</span>
				  </a>
				<ul class="sub-menu blank">
					<li><a class="link_name" href="#">${__(item.title)}</a></li>
				</ul>` 
				if(item.submenu){
				sb +=`<i class='fa fa-chevron-down arrow' style="min-width: 40px;"></i>` 
				}
        		sb +=`</div>` + item.submenu + `</li>`
		})
		sb +=`</ul></div>
			<div class="col-lg-2 layout-side-section"></div>
			<div class="col layout-main-section-wrapper">
				<div class="layout-main-section"></div>
				<div class="layout-footer hide"></div>
			</div>
			</div>`
			this.add_view("main",sb);
			this.setup_page();



		// if (this.single_column) {
		// 	// nesting under col-sm-12 for consistency
		// 	this.add_view(
		// 		"main",
		// 		'<div class="row layout-main">\
		// 			<div class="col-md-12 layout-main-section-wrapper">\
		// 				<div class="layout-main-section"></div>\
		// 				<div class="layout-footer hide"></div>\
		// 			</div>\
		// 		</div>'
		// 	);
		// } else {
			
		// }

		
	}
}

