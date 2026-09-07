from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

DOCX = Path(r"D:\Folder drive\BRD_Workflow Managermentt v1.0 3 updated.docx")
OUT = Path(r"D:\Source\MySource\JogetMVC\.tmp-brd-review\current_text.txt")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{" + NS["w"] + "}"

with ZipFile(DOCX) as archive:
    root = ET.fromstring(archive.read("word/document.xml"))
    rels_root = ET.fromstring(archive.read("word/_rels/document.xml.rels"))

parent = {child: node for node in root.iter() for child in node}

def inside(node, tag):
    while node in parent:
        node = parent[node]
        if node.tag == W + tag:
            return True
    return False

def paragraph_text(p, mode="current"):
    chunks = []
    for node in p.iter():
        if node.tag == W + "t":
            deleted = inside(node, "del")
            inserted = inside(node, "ins")
            keep = (mode == "current" and not deleted) or (mode == "inserted" and inserted) or (mode == "deleted" and deleted)
            if keep:
                chunks.append(node.text or "")
        elif node.tag == W + "tab" and mode == "current" and not inside(node, "del"):
            chunks.append("\t")
        elif node.tag in (W + "br", W + "cr") and mode == "current" and not inside(node, "del"):
            chunks.append("\n")
    return "".join(chunks).strip()

lines = []
for i, p in enumerate(root.findall(".//w:body//w:p", NS), 1):
    current = paragraph_text(p, "current")
    inserted = paragraph_text(p, "inserted")
    deleted = paragraph_text(p, "deleted")
    if current or inserted or deleted:
        lines.append(f"P{i:04d} CURRENT: {current}")
        if inserted:
            lines.append(f"P{i:04d} INSERTED: {inserted}")
        if deleted:
            lines.append(f"P{i:04d} DELETED: {deleted}")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {len(lines)} lines to {OUT}")

REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
rels = {r.attrib["Id"]: r.attrib["Target"] for r in rels_root.findall(f"{{{REL_NS}}}Relationship")}
R_EMBED = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
print("IMAGE REFERENCES:")
for blip in root.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}blip"):
    rid = blip.attrib.get(R_EMBED)
    print(rid, rels.get(rid), "deleted=" + str(inside(blip, "del")), "inserted=" + str(inside(blip, "ins")))
