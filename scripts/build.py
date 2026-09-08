#!/usr/bin/env python3
"""Inline partials/<name>.html into index.template.html -> index.html.
Markers: <!--@@NAV@@--> <!--@@HERO@@--> <!--@@ABOUT@@--> <!--@@PROJECTS@@-->
         <!--@@EXPERIENCE@@--> <!--@@SKILLS@@--> <!--@@CONTACT@@--> <!--@@FOOTER@@-->
Safe to run any time; missing partials leave the marker in place."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
tpl = (root / "index.template.html").read_text()
def sub(m):
    name = m.group(1).lower()
    p = root / "partials" / f"{name}.html"
    return p.read_text().rstrip() if p.exists() else m.group(0)
out = re.sub(r"<!--@@([A-Z]+)@@-->", sub, tpl)
(root / "index.html").write_text(out)
print("built index.html")
