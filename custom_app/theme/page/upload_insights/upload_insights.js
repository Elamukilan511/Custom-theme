frappe.pages['upload-insights'].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Upload Insights',
		single_column: true
	});

	// HTML Layout with left-right split
	const container = $(`
		<div style="display: flex; gap: 20px; align-items: flex-start;">
			<div style="flex: 1;" id="uploader-container"></div>
			<div style="flex: 1;" id="file-info-panel">
				<div id="file-data-output" style="margin-bottom: 20px;"></div>
			</div>
		</div>
		<div style="display: flex; gap: 20px; align-items: flex-start;">
			<div style="flex: 1;" id="file-dropdown-container"></div>
		</div>
		<div id="psg-chart" style="height: 800px; margin-top: 40px;"></div>
	`).appendTo(page.body);

	// Load PapaParse if not already loaded
	frappe.require("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js");

	// FileUploader setup
	new frappe.ui.FileUploader({
		wrapper: document.getElementById("uploader-container"),
		allow_multiple: true,
		on_success: async function (files) {
			const uploaded_files = Array.isArray(files) ? files : [files];
			const output = document.getElementById("file-data-output");
			const dropdownContainer = document.getElementById("file-dropdown-container");

			output.innerHTML = '';
			dropdownContainer.innerHTML = '';

			for (let file of uploaded_files) {
				const fileUrl = file.file_url;
				let rowCount = 'N/A';

				// Count rows if CSV
				// if (file.file_url.endsWith(".csv")) {
				// 	const content = await frappe.call({
				// 		method: "frappe.utils.file_manager.get_file_content_from_url",
				// 		args: { file_url: fileUrl },
				// 	});
				// 	const parsed = Papa.parse(content.message, { header: true });
				// 	rowCount = parsed.data.length;
				// }

				

				

				// Call backend to process PSG data
				frappe.call({
					method: "custom_app.theme.page.upload_insights.upload_insights.prepare_psg_data",
					args: {
						file_path: fileUrl
					},
					callback: function (r) {
						if (r.message) {
							const { df, signal_groups } = r.message;

							// Clear chart container
							document.getElementById("psg-chart").innerHTML = "";
							output.innerHTML += `
								<p><strong>File:</strong> <a href="${fileUrl}" target="_blank">${file.file_name}</a></p>
								<p><strong>Rows:</strong> ${r.message.length} </p>
							`;


							// Add dropdown
							const dropdown = document.createElement("select");
							dropdown.innerHTML = `
								<option value="">Select an action</option>
								<option value="summary">Show Summary</option>
								<option value="validate">Run Validation</option>
							`;
							dropdown.className = "form-control";
							dropdown.onchange = function () {
								frappe.msgprint(`Selected action: ${this.value}`);
							};
							dropdownContainer.appendChild(dropdown);

							plotPsgSignals({
								df: df,
								signalGroups: [
									["EEG/EMG/ECG", ["C3A2", "C4A1", "EMG", "chan 1", "chan 2", "chan 3"]],
									["Eye Movements", ["Lefteye", "RightEye"]],
									["Respiratory", ["SpO2", "Flow", "ribcage", "abdo", "Pulse"]]
								],
								eventCol: 'tech_only_event',
								predictedCol: 'model_only_event',
								plotId: 'psg-chart'
							});
						} else {
							frappe.msgprint("Failed to process file.");
						}
					}
				});
			}
		},
		restrictions: {
			allowed_file_types: [".csv", ".json", ".xls", ".xlsx", ".pdf"]
		}
	});

	// Plot function
	function plotPsgSignals({
		df,
		signalGroups,
		eventCol = "is_event",
		predictedCol = null,
		plotId = "psg-chart"
	}) {
		const traces = [];
		const shapes = [];
		const annotations = [];
		const totalSignals = signalGroups.flatMap(([_, signals]) => signals).length;

		let axisCount = 1;
		let axisDomains = [];
		const step = 1 / totalSignals;

		for (let i = 0; i < totalSignals; i++) {
			axisDomains.push([1 - (i + 1) * step, 1 - i * step]);
		}

		for (const [groupName, signalList] of signalGroups) {
			for (const col of signalList) {
				if (!(col in df[0])) continue;

				const sig = df.map(row => row[col]);
				const time = df.map(row => row.time_sec);

				const mean = sig.reduce((a, b) => a + b, 0) / sig.length;
				const std = Math.sqrt(sig.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sig.length);
				const norm = sig.map(v => ((v - mean) / (std + 1e-6)) * 10);

				const yAxisName = axisCount === 1 ? 'y' : `y${axisCount}`;
				traces.push({
					x: time,
					y: norm,
					type: 'scatter',
					mode: 'lines',
					name: col,
					yaxis: yAxisName,
					line: { width: 1 },
					showlegend: false
				});

				annotations.push({
					x: time[0],
					y: 0,
					xref: 'x',
					yref: yAxisName,
					text: col,
					showarrow: false,
					font: { size: 10, color: "black" },
					xanchor: 'right',
					yanchor: 'middle'
				});

				axisCount++;
			}
		}

		// Event shading
		if (eventCol && eventCol in df[0]) {
			const eventTimes = df.filter(row => row[eventCol] === 1).map(row => row.time_sec);
			let eventRegions = [];
			let start = null;
			let prev_t = null;

			for (const t of eventTimes) {
				if (start === null) {
					start = t;
				} else if (t - prev_t > 0.6) {
					eventRegions.push([start, prev_t]);
					start = t;
				}
				prev_t = t;
			}
			if (start !== null && prev_t !== null) {
				eventRegions.push([start, prev_t]);
			}

			for (const [x0, x1] of eventRegions) {
				shapes.push({
					type: 'rect',
					xref: 'x',
					yref: 'paper',
					x0: x0,
					x1: x1,
					y0: 0,
					y1: 1,
					fillcolor: 'red',
					opacity: 0.15,
					line: { width: 0 },
					layer: 'below'
				});
			}
		}

		const layout = {
			height: 200 * totalSignals,
			margin: { l: 80, r: 20, t: 30, b: 40 },
			xaxis: {
				title: 'Time (seconds)',
				rangeslider: { visible: true }
			},
			dragmode: 'pan',
			annotations,
			shapes
		};

		for (let i = 0; i < totalSignals; i++) {
			const axisName = i === 0 ? 'yaxis' : `yaxis${i + 1}`;
			layout[axisName] = {
				domain: axisDomains[i],
				showticklabels: true,
			};
		}

		Plotly.newPlot(plotId, traces, layout, {
			displayModeBar: true,
			displaylogo: false,
			responsive: true
		});
	}
};
