"""Bundle the site into one self-contained HTML file: dist/index.html (+ dist/min.html)."""
import re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
order = ["src/rest/wix-config.js", "src/rest/wix-client.js", "src/rest/wix-restaurants-menu.js",
         "src/rest/wix-restaurants-reservations.js", "app.js"]
out = []
for f in order:
    s = open(f).read()
    s = re.sub(r'^export \{[^}]*\} from [^;]+;\s*$', '', s, flags=re.M)
    s = re.sub(r'^import [\s\S]*?from\s+"[^"]+";\s*$', '', s, flags=re.M)
    s = re.sub(r'^export (async function|function|const|let|class)', r'\1', s, flags=re.M)
    out.append(s)
js = "(()=>{\n" + "\n".join(out) + "\n})();"
html = open("index.html").read()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + open("styles.css").read() + '\n</style>')
html = html.replace('<script type="module" src="app.js"></script>', '<script>\n' + js.replace("</script", "<\\/script") + '\n</script>')
os.makedirs("dist", exist_ok=True)
open("dist/index.html", "w").write(html)
m = re.sub(r'/\*[\s\S]*?\*/', '', html)
m = re.sub(r'^\s*//.*$', '', m, flags=re.M)
m = re.sub(r'\n\s+', '\n', m)
m = re.sub(r'\n+', '\n', m)
assert '*/' not in m
open("dist/min.html", "w").write(m)
print(len(html), len(m))
