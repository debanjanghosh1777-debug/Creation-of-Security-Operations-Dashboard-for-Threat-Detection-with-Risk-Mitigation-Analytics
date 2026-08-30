import os
import math
import mimetypes


def calculate_entropy(filepath):

    with open(filepath, "rb") as f:
        data = f.read()

    if len(data) == 0:
        return 0

    entropy = 0

    for x in range(256):
        p = data.count(bytes([x])) / len(data)

        if p > 0:
            entropy -= p * math.log2(p)

    return round(entropy, 2)


def extract_features(filepath):

    extension = os.path.splitext(filepath)[1].replace(".", "").lower()

    filesize = os.path.getsize(filepath)

    entropy = calculate_entropy(filepath)

    mime = mimetypes.guess_type(filepath)[0]

    if mime is None:
        mime = "unknown"

    executable = 1 if extension in [
        "exe",
        "dll",
        "bat",
        "ps1",
        "vbs",
        "js",
        "scr",
        "jar",
        "apk"
    ] else 0

    return {
        "Extension": extension,
        "File_Size": filesize,
        "Entropy": entropy,
        "Mime_Type": mime,
        "Is_Executable": executable
    }