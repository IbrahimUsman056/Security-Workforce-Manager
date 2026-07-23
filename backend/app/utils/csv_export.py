import csv
import io

def dicts_to_csv(data: list[dict]) -> str:
    if not data:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue()