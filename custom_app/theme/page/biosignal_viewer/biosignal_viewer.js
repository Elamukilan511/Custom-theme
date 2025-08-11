frappe.pages['biosignal-viewer'].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Signal Plot Viewer',
		single_column: true
	});

	$(wrapper).html(`
		<div class="biosignal-viewer">
			<div class="biosignal-viewer-filter" style="margin-bottom: 15px;"></div>
			<div id="file-data-output">
				<div id="plot-container" style="height: 700px; width: 100%;"></div>
			</div>
		</div>
	`);

	const filter_wrapper = wrapper.querySelector('.biosignal-viewer-filter');

	let globalData = null;
	let globalAnnotations = [];

	// Create patient dropdown (filled dynamically after data fetch)
	const patient_id_filter = frappe.ui.form.make_control({
		df: {
			fieldtype: 'Select',
			label: 'Patient ID',
			fieldname: 'patient_id',
			options: [],
			onchange: () => {
				const selected = patient_id_filter.get_value();
				load_data(file_path, selected);
			}
		},
		parent: filter_wrapper,
		render_input: true
	});
	patient_id_filter.$wrapper.addClass("form-column col-sm-2");


	const event_jumper = frappe.ui.form.make_control({
		df: {
			fieldtype: 'Select',
			label: 'Jump to Event',
			fieldname: 'event_jump',
			options: [''],
			onchange: () => {
				const jumpTime = parseFloat(event_jumper.get_value());
				if (!isNaN(jumpTime)) {
					renderPlot(globalData, globalAnnotations, [jumpTime - 15, jumpTime + 15]);
				}
			}
		},
		parent: filter_wrapper,
		render_input: true
	});
	event_jumper.$wrapper.addClass("form-column col-sm-3");

	// Hardcoded file path
	const file_path = '/public/files/annotated_signals.csv';

	// Initial load (auto-load first patient)
	load_data(file_path);

	function load_data(file_url, patientId = null) {
		frappe.call({
			method: 'custom_app.theme.page.biosignal_viewer.biosignal_viewer.get_patient_data',
			args: { file_path: file_url, patient_id: patientId },
			callback: function (r) {
				if (r.message) {
					const { signals, annotations, patient_ids, selected_patient_id } = r.message;

					globalData = signals;
					globalAnnotations = annotations;

					// Populate dropdown only once on initial load
					if (!patientId) {
						const options = patient_ids.map(pid => ({ label: pid, value: pid }));
						patient_id_filter.df.options = options.map(o => o.value).join('\n');
						patient_id_filter.refresh();
					}

					const eventOpts = [''].concat(r.message.annotations.map((a, i) => ({
						label: `Event ${i + 1} @ ${formatDuration(a.start)}`,
						value: `${a.start}`
					})));
					event_jumper.df.options = eventOpts;
					event_jumper.refresh();


					// Set selected patient
					// patient_id_filter.set_value(selected_patient_id);

					// Render plot
					renderPlot(globalData, globalAnnotations);
				}
			}
		});
	}


	function formatDuration(seconds) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);

		return [
			h > 0 ? `${h}h` : '',
			m > 0 ? `${m}m` : '',
			`${s}s`
		].filter(Boolean).join(' ');
	}


	function renderPlot(data, annotations, viewRange = null) {
		if (!data || !data.time_sec) {
			document.getElementById('plot-container').innerHTML = "<p>No data</p>";
			return;
		}

		const time = data.time_sec;
		const signals = Object.keys(data).filter(k => k !== 'time_sec');
		const subplotCount = signals.length;
		const gap = 0.01;
		const normHeight = (1 - gap * (subplotCount - 1)) / subplotCount;

		const traces = signals.map((key, i) => ({
			x: time,
			y: data[key],
			type: 'scatter',
			mode: 'lines',
			name: key,
			xaxis: 'x',
			yaxis: `y${i + 1}`,
			line: { width: 1 }
		}));

		const shapes = annotations.map(({ start, end }) => ({
			type: 'rect',
			xref: 'x',
			yref: 'paper',
			x0: start,
			x1: end,
			y0: 0,
			y1: 1,
			fillcolor: 'rgba(255, 0, 0, 0.2)',
			line: { width: 0 },
			layer: 'below'
		}));

		const layout = {
			height: 150 * subplotCount + 100,
			margin: { t: 40, l: 60, r: 20, b: 20 },
			showlegend: false,
			shapes
		};

		signals.forEach((key, i) => {
			const top = 1 - i * (normHeight + gap);
			const bottom = top - normHeight;
			layout[`yaxis${i + 1}`] = {
				domain: [bottom, top],
				title: key,
				showticklabels: true
			};
			layout[`xaxis${i + 1}`] = {
				range: viewRange || undefined,
				title: i === subplotCount - 1 ? 'Time (s)' : '',
				showticklabels: i === subplotCount - 1,
				dtick: 30
			};
		});

		Plotly.newPlot('plot-container', traces, layout, {
			scrollZoom: true,
			displayModeBar: true,
			displaylogo: false,
			responsive: true
		});
	}
};
