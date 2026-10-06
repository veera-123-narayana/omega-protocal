# ORGANIZER SOLUTION MANUAL: THE FORGOTTEN ARCHIVE
**CONFIDENTIAL // ORGANIZER & AUTHOR REFERENCE ONLY**
**DO NOT DISTRIBUTE TO PARTICIPANTS**

---

## 1. Challenge Overview
- **Title**: THE FORGOTTEN ARCHIVE
- **Category**: File Forensics + Steganography + Encoding
- **Difficulty**: Medium
- **Flag**: `sctf{forgotten_archive_lsb}`
- **Carrier Artifact**: `the_forgotten_archive.zip`

---

## 2. Solving Workflow Summary
```
the_forgotten_archive.zip
  │
  ├──► Inspect files: README.txt, manifest.txt, backup_01.txt, notes.txt, thumbs.db, archive_fragment.png
  │
  ├──► Identify Suspicious Artifact: archive_fragment.png (unusual dimensions / file size / entropy)
  │
  ├──► RGB LSB Extraction:
  │      Extract least significant bit (LSB) from Red, Green, Blue channels sequentially.
  │
  ├──► Header Detection:
  │      Payload header: "FA14" + 4-byte payload length (229 bytes)
  │      Extracted string begins with: "FA14_PAYLOAD:"
  │
  ├──► Multi-Stage Hex Decoding:
  │      Remove "FA14_PAYLOAD:" to retrieve 216-character hexadecimal string
  │
  │      [Layer 3 Hex] 33373333333633333337... (216 chars)
  │            │
  │            ▼ Hex Decode (Step 1)
  │      [Layer 2 Hex] 37333633373436363762... (108 chars)
  │            │
  │            ▼ Hex Decode (Step 2)
  │      [Layer 1 Hex] 736374667b666f72676f... (54 chars)
  │            │
  │            ▼ Hex Decode (Step 3)
  │      [Final Flag]  sctf{forgotten_archive_lsb}
```

---

## 3. Detailed Step-by-Step Walkthrough

### Step 1: Unpack and Survey Archive Contents
Participants download `the_forgotten_archive.zip` and extract its contents:
```bash
unzip the_forgotten_archive.zip
```
The archive contains 6 files:
1. `README.txt` – Mentions "One artifact may be worth closer inspection."
2. `manifest.txt` – Routine file inventory.
3. `backup_01.txt` – Normal backup log.
4. `notes.txt` – Routine operator note.
5. `thumbs.db` – Standard Windows OLE storage format with thumbnail timestamps.
6. `archive_fragment.png` – An 800x600 PNG diagram.

### Step 2: Identify Anomalies in `archive_fragment.png`
Inspecting `archive_fragment.png` with standard forensics tools:
```bash
file archive_fragment.png
pngcheck archive_fragment.png
zsteg archive_fragment.png
```
Running `zsteg archive_fragment.png`:
```
b1,rgb,lsb,xy       .. text: "FA14\x00\x00\x00\xe5FA14_PAYLOAD:333733333336333333373334333633363337363233363336333636363337333233363337333636363337333433373334333633353336363533353636333633313337333233363333333633383336333933373336333633353335363633363633333733333336333233373634"
```

### Step 3: Extract Hidden Payload
The payload header is `FA14_PAYLOAD:`. Removing the prefix leaves the 216-character hexadecimal string:
```
333733333336333333373334333633363337363233363336333636363337333233363337333636363337333433373334333633353336363533353636333633313337333233363333333633383336333933373336333633353335363633363633333733333336333233373634
```

### Step 4: Three-Stage Hex Decoding
1. **First Hex Decode**:
   Decoding from hex yields a 108-character hex string:
   `373336333734363637623636366637323637366637343734363536653566363137323633363836393736363535663663373336323764`

2. **Second Hex Decode**:
   Decoding again yields a 54-character hex string:
   `736374667b666f72676f7474656e5f617263686976655f6c73627d`

3. **Third Hex Decode**:
   Decoding the third time reveals the plaintext flag:
   `sctf{forgotten_archive_lsb}`

---

## 4. Standalone Automated Python Solver Script

```python
#!/usr/bin/env python3
"""
THE FORGOTTEN ARCHIVE - Reference Solution Solver
Solves directly from archive_fragment.png or the_forgotten_archive.zip
"""
import zipfile
import zlib
import struct
import sys

def extract_flag_from_png(png_bytes: bytes) -> str:
    # 1. Parse PNG chunks
    pos = 8
    width = height = 0
    idat = bytearray()
    while pos < len(png_bytes):
        length = struct.unpack('>I', png_bytes[pos:pos+4])[0]
        chunk_type = png_bytes[pos+4:pos+8]
        data = png_bytes[pos+8:pos+8+length]
        pos += 8 + length + 4
        if chunk_type == b'IHDR':
            width, height, _, _ = struct.unpack('>IIBB', data[:10])
        elif chunk_type == b'IDAT':
            idat.extend(data)
        elif chunk_type == b'IEND':
            break

    # 2. Decompress scanlines
    raw = zlib.decompress(idat)
    stride = 1 + width * 4
    bits = []
    for y in range(height):
        line_start = y * stride + 1
        for x in range(width):
            px = line_start + x * 4
            # RGB LSBs
            bits.extend([raw[px] & 1, raw[px+1] & 1, raw[px+2] & 1])
            if len(bits) >= 2500:
                break
        if len(bits) >= 2500:
            break

    # 3. Convert bits to bytes
    extracted = bytearray()
    for i in range(0, len(bits), 8):
        b = 0
        for bit in bits[i:i+8]:
            b = (b << 1) | bit
        extracted.append(b)

    text = extracted.decode('latin1', errors='ignore')
    if 'FA14_PAYLOAD:' not in text:
        raise ValueError("Header FA14_PAYLOAD: not found in LSB stream")

    hex_layer3 = text.split('FA14_PAYLOAD:')[1].split('\x00')[0].strip()
    
    # 4. Multi-stage hex decoding
    hex_layer2 = bytes.fromhex(hex_layer3).decode('ascii')
    hex_layer1 = bytes.fromhex(hex_layer2).decode('ascii')
    flag = bytes.fromhex(hex_layer1).decode('ascii')
    return flag

if __name__ == '__main__':
    # Test directly against the generated zip or png
    try:
        with zipfile.ZipFile('public/the_forgotten_archive.zip', 'r') as z:
            png_bytes = z.read('archive_fragment.png')
            print("[+] Successfully extracted archive_fragment.png from ZIP")
    except Exception:
        with open('public/archive_fragment.png', 'rb') as f:
            png_bytes = f.read()
            print("[+] Read archive_fragment.png directly")

    flag = extract_flag_from_png(png_bytes)
    print(f"[+] Final CTF Flag Recovered: {flag}")
```
