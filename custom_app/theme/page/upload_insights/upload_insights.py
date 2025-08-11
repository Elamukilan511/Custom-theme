import frappe
from frappe import _
from frappe.utils import get_files_path
from frappe.utils.file_manager import save_file
import pandas as pd
import os

def preprocess_snore_column(df):
    if 'snore' not in df.columns:
        df['snore'] = 0
    else:
        df['snore'] = df['snore'].apply(
            lambda x: 1 if str(x).strip() not in ['', '-', '0', 'NaN', 'nan'] else 0
        )
    return df

@frappe.whitelist()
def prepare_psg_data(file_path):
    BASIC_SIGNALS = ['SpO2', 'Flow', 'ribcage', 'abdo', 'Pulse', 'EMG',
                     'Lefteye', 'RightEye', 'C3A2', 'C4A1', 'chan 1', 'chan 2', 'chan 3']
    if file_path.startswith("/private/files/"):
        full_path = os.path.join(frappe.get_site_path(), "private", "files", os.path.basename(file_path))
    elif file_path.startswith("/files/") or file_path.startswith("/public/files/"):
        full_path = os.path.join(frappe.get_site_path(), "public", "files", os.path.basename(file_path))
    else:
        frappe.throw(f"Unknown file path: {file_path}")
    df = pd.read_csv(full_path, low_memory=False)
    df = preprocess_snore_column(df)

    # Clean and limit to necessary columns
    required_columns = ['time_sec', 'id', 'is_event', 'predicted_event', 'snore']
    required_columns += [col for col in BASIC_SIGNALS if col in df.columns]
    for col in required_columns:
        if col not in df.columns:
            df[col] = 0  # or np.nan

    # Add difference columns
    df['tech_only_event'] = ((df['is_event'] == 1) & (df['predicted_event'] == 0)).astype(int)
    df['model_only_event'] = ((df['predicted_event'] == 1) & (df['is_event'] == 0)).astype(int)

    # Group signals by category (same as original)
    signal_groups = {
        "EEG/EMG/ECG": ['C3A2', 'C4A1', 'EMG', 'chan 1', 'chan 2', 'chan 3'],
        "Eye Movements": ['Lefteye', 'RightEye'],
        "Respiratory": ['SpO2', 'Flow', 'ribcage', 'abdo', 'Pulse']
    }

    # Return structured dict for frontend usage
    df.fillna(0, inplace=True)
    return {
        "df": df.to_dict(orient="records"),
        "signal_groups": signal_groups
    }
