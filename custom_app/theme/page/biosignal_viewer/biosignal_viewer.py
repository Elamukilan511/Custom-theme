import pandas as pd
import os
import frappe

@frappe.whitelist(allow_guest=True)
def get_patient_data(file_path, patient_id=None):
    # ✅ Resolve full path
    if file_path.startswith("/private/files/"):
        full_path = os.path.join(frappe.get_site_path(), "private", "files", os.path.basename(file_path))
    elif file_path.startswith("/files/") or file_path.startswith("/public/files/"):
        full_path = os.path.join(frappe.get_site_path(), "public", "files", os.path.basename(file_path))
    else:
        frappe.throw(f"Unknown file path: {file_path}")

    # ✅ Read CSV
    try:
        df = pd.read_csv(full_path, low_memory=False)
    except Exception as e:
        frappe.local.response.http_status_code = 400
        return {"error": f"Failed to read CSV: {str(e)}"}

    # ✅ Deduplicate column names
    def deduplicate_columns(cols):
        seen = {}
        result = []
        for col in cols:
            if col not in seen:
                seen[col] = 1
                result.append(col)
            else:
                seen[col] += 1
                result.append(f"{col}.{seen[col]-1}")
        return result

    df.columns = deduplicate_columns(df.columns)

    # ✅ Validate patient_id column
    id_col = "id" if "id" in df.columns else ("patient_id" if "patient_id" in df.columns else None)
    if not id_col:
        frappe.local.response.http_status_code = 400
        return {"error": "Missing patient ID column in CSV (expected 'id' or 'patient_id')"}

    patient_ids = df[id_col].dropna().unique().tolist()
    if not patient_ids:
        frappe.local.response.http_status_code = 404
        return {"error": "No patient IDs found in the file."}

    selected_patient_id = patient_id or patient_ids[0]
    df = df[df[id_col] == selected_patient_id]

    # ✅ Pick valid signal columns
    present = ['time_sec', 'SpO2', 'Flow', 'ribcage', 'abdo', 'Pulse', 'EMG',
               'C3A2', 'C4A1', 'chan 1', 'chan 2', 'chan 3']
    present = [col for col in present if col in df.columns]

    signal_data = df[present].fillna(0).to_dict(orient='list')

    # ✅ AHI and annotations
    if "is_event" in df.columns and "time_sec" in df.columns:
        is_event = df["is_event"].values
        time_sec = df["time_sec"].values

        start_time = time_sec[0]
        end_time = time_sec[-1]
        duration_sec = end_time - start_time
        duration_hr = duration_sec / 3600 if duration_sec > 0 else 0

        valid_events = 0
        annotations = []
        start_idx = None

        for i in range(len(is_event)):
            if is_event[i] == 1 and start_idx is None:
                start_idx = i
            elif (is_event[i] == 0 or i == len(is_event) - 1) and start_idx is not None:
                end_idx = i if is_event[i] == 0 else i + 1
                duration = time_sec[end_idx - 1] - time_sec[start_idx]
                if duration >= 10:
                    annotations.append({
                        "start": float(time_sec[start_idx]),
                        "end": float(time_sec[end_idx - 1])
                    })
                    valid_events += 1
                start_idx = None
    else:
        annotations = []
        valid_events = 0
        duration_hr = 0

    ahi = round(valid_events / duration_hr, 2) if duration_hr > 0 else 0.0

    return {
        "patient_ids": patient_ids,
        "selected_patient_id": selected_patient_id,
        "signals": signal_data,
        "annotations": annotations,
        "ahi": ahi
    }
