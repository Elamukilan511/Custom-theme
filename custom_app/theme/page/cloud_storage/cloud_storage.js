frappe.pages['cloud-storage'].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Cloud Storage',
		single_column: true
	});

	// --- Toolbar UI ---
	const controls_html = `
		<div class="d-flex align-items-center gap-2">
			<div class="btn-group mr-2">
				<button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">
					New
				</button>
				<div class="dropdown-menu">
					<a class="dropdown-item" href="#" id="create-folder"><i class="fa fa-folder mr-2"></i>Create New Folder</a>
					<a class="dropdown-item" href="#" id="upload-file"><i class="fa fa-upload mr-2"></i>Upload File</a>
					<a class="dropdown-item" href="#" id="upload-folder"><i class="fa fa-folder-open mr-2"></i>Upload Folder</a>
				</div>
			</div>
			<div>
				<button class="btn btn-light border view-toggle active mr-1" data-view="grid" title="Grid View">
					<i class="fa fa-th"></i>
				</button>
				<button class="btn btn-light border view-toggle mr-1" data-view="list" title="List View">
					<i class="fa fa-list"></i>
				</button>
				<button class="btn btn-light border view-toggle" data-view="tree" title="Tree View">
					<i class="fa fa-sitemap"></i>
				</button>
			</div>
		</div>
	`;
	$(page.page_actions).html(controls_html);

	// --- Data: Folder Structure
	const rootItems = [
	{
		type: 'folder',
		name: 'Documents',
		children: [
			{
				type: 'folder',
				name: 'Work',
				children: [
					{
						type: 'folder',
						name: 'Projects',
						children: [
							{ type: 'file', name: 'ProjectPlan.docx' },
							{ type: 'file', name: 'Budget.xlsx' },
							{
								type: 'folder',
								name: 'Designs',
								children: [
									{ type: 'file', name: 'UI-Mockup.fig' },
									{ type: 'file', name: 'Wireframes.pdf' }
								]
							}
						]
					},
					{ type: 'file', name: 'MeetingNotes.txt' }
				]
			},
			{
				type: 'folder',
				name: 'Personal',
				children: [
					{ type: 'file', name: 'Resume.pdf' },
					{ type: 'file', name: 'CoverLetter.docx' }
				]
			}
		]
	},
	{
		type: 'folder',
		name: 'Pictures',
		children: [
			{
				type: 'folder',
				name: 'Vacations',
				children: [
					{
						type: 'folder',
						name: '2023',
						children: [
							{
								type: 'folder',
								name: 'Beach',
								children: [
									{ type: 'file', name: 'sunset.jpg' },
									{ type: 'file', name: 'waves.png' }
								]
							},
							{
								type: 'folder',
								name: 'Mountains',
								children: [
									{ type: 'file', name: 'hiking.jpg' },
									{ type: 'file', name: 'campfire.jpeg' }
								]
							}
						]
					}
				]
			},
			{
				type: 'folder',
				name: 'Family',
				children: [
					{ type: 'file', name: 'birthday.png' },
					{ type: 'file', name: 'wedding.jpg' }
				]
			}
		]
	},
	{
		type: 'folder',
		name: 'Videos',
		children: [
			{
				type: 'folder',
				name: 'Tutorials',
				children: [
					{
						type: 'folder',
						name: 'JavaScript',
						children: [
							{
								type: 'folder',
								name: 'Beginner',
								children: [
									{ type: 'file', name: 'intro.mp4' },
									{ type: 'file', name: 'variables.mp4' }
								]
							},
							{
								type: 'folder',
								name: 'Advanced',
								children: [
									{ type: 'file', name: 'async-await.mp4' },
									{ type: 'file', name: 'performance.mp4' }
								]
							}
						]
					}
				]
			},
			{ type: 'file', name: 'presentation.mp4' }
		]
	},
	{ type: 'file', name: 'Invoice.xlsx' },
	{ type: 'file', name: 'Presentation.pptx' }
];


	let currentPath = []; // Keeps track of folder path
	let currentView = 'grid';
	let rightClickedIndex = null;

	// --- Helper to get current folder's items
	function getCurrentItems() {
		let pointer = rootItems;
		for (const index of currentPath) {
			pointer = pointer[index].children;
		}
		return pointer;
	}

	// --- Render Items ---
	function renderItems() {
		const items = getCurrentItems();
		let html = '';

		// Add Back button if not in root
		if (currentPath.length > 0) {
			html += `
				<div class="mb-3">
					<button class="btn btn-sm btn-outline-secondary" id="go-back">
						<i class="fa fa-arrow-left mr-1"></i> Back
					</button>
				</div>
			`;
		}

		if (currentView === 'grid') {
			html += `<div class="row">`;
			items.forEach((item, index) => {
				const icon = item.type === 'folder' ? 'fa-folder' : 'fa-file';
				const color = item.type === 'folder' ? '#ffc107' : '#17a2b8';
				html += `
					<div class="col-md-3 col-sm-6 mb-4">
						<div class="card shadow-sm text-center h-100 item-card" data-index="${index}">
							<div class="card-body d-flex flex-column justify-content-center align-items-center p-4">
								<i class="fa ${icon} fa-3x mb-2" style="color: ${color};"></i>
								<h6 class="card-title">${item.name}</h6>
							</div>
						</div>
					</div>
				`;
			});
			html += `</div>`;
		} else if (currentView === 'list') {
			html += `<div class="list-group">`;
			items.forEach((item, index) => {
				const icon = item.type === 'folder' ? 'fa-folder' : 'fa-file';
				const color = item.type === 'folder' ? '#ffc107' : '#17a2b8';
				html += `
					<a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center item-card" data-index="${index}">
						<div>
							<i class="fa ${icon} mr-2" style="color: ${color};"></i>
							<span>${item.name}</span>
						</div>
						<span class="badge badge-secondary">${item.type}</span>
					</a>
				`;
			});
			html += `</div>`;
		} else if (currentView === 'tree') {
			html = renderTree(rootItems);
		}

		$(page.body).html(html);
	}

	// --- Render Tree View
	function renderTree(items, depth = 0) {
		let html = '<ul class="pl-' + (depth * 3) + '">';
		items.forEach((item, index) => {
			const icon = item.type === 'folder' ? 'fa-folder' : 'fa-file';
			const color = item.type === 'folder' ? '#ffc107' : '#17a2b8';
			html += `
				<li class="item-card py-1" data-index="${index}" style="cursor:pointer;">
					<i class="fa ${icon} mr-2" style="color:${color}"></i> ${item.name}
				</li>
			`;
			if (item.type === 'folder' && item.children && item.children.length > 0) {
				html += renderTree(item.children, depth + 1);
			}
		});
		html += '</ul>';
		return html;
	}

	// --- Initial Render ---
	renderItems();

	// --- Go Back
	$(document).on('click', '#go-back', function () {
		currentPath.pop();
		renderItems();
	});

	// --- View Toggle ---
	$(document).on('click', '.view-toggle', function () {
		currentView = $(this).data('view');
		$('.view-toggle').removeClass('active');
		$(this).addClass('active');
		renderItems();
	});

	// --- Click Handler: Navigate or Rename ---
	$(document).on('click', '.item-card', function () {
		const index = $(this).data('index');
		const items = getCurrentItems();
		const item = items[index];

		if (item.type === 'folder') {
			currentPath.push(index); // Go deeper into the folder
			renderItems();
		} else {
			// Rename file only
			frappe.prompt([
				{
					label: 'New Name',
					fieldname: 'new_name',
					fieldtype: 'Data',
					reqd: 1,
					default: item.name
				}
			], (values) => {
				item.name = values.new_name;
				renderItems();
				frappe.show_alert('Renamed successfully!');
			}, 'Rename File');
		}
	});

	// --- Create New Folder ---
	$(document).on('click', '#create-folder', function (e) {
		e.preventDefault();
		frappe.prompt([
			{
				label: 'Folder Name',
				fieldname: 'folder_name',
				fieldtype: 'Data',
				reqd: 1
			}
		], (values) => {
			getCurrentItems().unshift({ type: 'folder', name: values.folder_name, children: [] });
			renderItems();
			frappe.show_alert('Folder created successfully!');
		});
	});

	// --- Upload Placeholders ---
	$(document).on('click', '#upload-file', function (e) {
		e.preventDefault();
		frappe.msgprint('Upload File clicked. Integrate uploader here.');
	});
	$(document).on('click', '#upload-folder', function (e) {
		e.preventDefault();
		frappe.msgprint('Upload Folder clicked. Integrate folder logic.');
	});

	// --- Custom Context Menu ---
	if (!$('#custom-context-menu').length) {
		$('body').append(`
			<ul id="custom-context-menu" class="dropdown-menu" style="display:none; position:absolute; z-index:9999;">
				<li><a class="dropdown-item" href="#" id="context-rename"><i class="fa fa-edit mr-2"></i>Rename</a></li>
				<li><a class="dropdown-item" href="#" id="context-delete"><i class="fa fa-trash mr-2"></i>Delete</a></li>
				<li><a class="dropdown-item" href="#" id="context-properties"><i class="fa fa-info-circle mr-2"></i>Properties</a></li>
			</ul>
		`);
	}

	$(document).on('contextmenu', function (e) {
		e.preventDefault();
	});

	// Right-click context menu on item
	$(document).on('contextmenu', '.item-card', function (e) {
		e.preventDefault();
		rightClickedIndex = $(this).data('index');
		$('#custom-context-menu')
			.css({ top: e.pageY + 'px', left: e.pageX + 'px' })
			.show();
	});

	$(document).on('click', function () {
		$('#custom-context-menu').hide();
	});

	// Context Rename
	$(document).on('click', '#context-rename', function () {
		const items = getCurrentItems();
		if (rightClickedIndex != null && items[rightClickedIndex]) {
			frappe.prompt([
				{
					label: 'New Name',
					fieldname: 'new_name',
					fieldtype: 'Data',
					reqd: 1,
					default: items[rightClickedIndex].name
				}
			], (values) => {
				items[rightClickedIndex].name = values.new_name;
				renderItems();
				frappe.show_alert('Renamed successfully!');
			});
		}
	});

	// Context Delete
	$(document).on('click', '#context-delete', function () {
		const items = getCurrentItems();
		if (rightClickedIndex != null && items[rightClickedIndex]) {
			frappe.confirm('Are you sure you want to delete this item?', () => {
				items.splice(rightClickedIndex, 1);
				renderItems();
				frappe.show_alert('Deleted successfully!');
			});
		}
	});

	// Context Properties
	$(document).on('click', '#context-properties', function () {
		const items = getCurrentItems();
		if (rightClickedIndex != null && items[rightClickedIndex]) {
			const item = items[rightClickedIndex];
			frappe.msgprint(`
				<b>Name:</b> ${item.name}<br>
				<b>Type:</b> ${item.type}<br>
				<b>Children:</b> ${item.children ? item.children.length : '-'}
			`);
		}
	});
};
