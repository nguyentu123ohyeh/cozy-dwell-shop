from pathlib import Path
import re
import shutil
import subprocess

BRAND = "PAUL LAWRENCE JR LISTER"
CART_KEY = "paul_lawrence_jr_lister_cart"
LOGO_INNER = '<span class="brand-logo-main">PAUL</span><span class="brand-logo-accent">LAWRENCE JR LISTER</span>'
ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"

if not PUBLIC.exists():
    raise SystemExit("ERROR: Không tìm thấy thư mục public. Hãy đặt file này ngang hàng với thư mục public rồi chạy lại.")

BACKUP = ROOT / "_backup_before_paul_fix_v2"
BACKUP.mkdir(exist_ok=True)

html_files = sorted(PUBLIC.glob("*.html"))
js_files = sorted((PUBLIC / "assets" / "js").glob("*.js")) if (PUBLIC / "assets" / "js").exists() else []
css_file = PUBLIC / "assets" / "css" / "style.css"

def backup_file(path: Path):
    rel = path.relative_to(ROOT)
    dst = BACKUP / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists():
        shutil.copy2(path, dst)

# Replace occurrences of BRAND outside JavaScript string/comment with a quoted string.
def quote_brand_outside_js_strings(src: str) -> str:
    out = []
    i = 0
    n = len(src)
    state = "code"
    quote = ""
    while i < n:
        ch = src[i]
        nxt = src[i+1] if i + 1 < n else ""

        if state == "code":
            if src.startswith(BRAND, i):
                out.append(repr(BRAND))
                i += len(BRAND)
                continue
            if ch in ('"', "'", '`'):
                state = "string"
                quote = ch
                out.append(ch)
                i += 1
                continue
            if ch == "/" and nxt == "/":
                state = "line_comment"
                out.append(ch)
                out.append(nxt)
                i += 2
                continue
            if ch == "/" and nxt == "*":
                state = "block_comment"
                out.append(ch)
                out.append(nxt)
                i += 2
                continue
            out.append(ch)
            i += 1
            continue

        if state == "string":
            out.append(ch)
            if ch == "\\":
                if i + 1 < n:
                    out.append(src[i+1])
                    i += 2
                else:
                    i += 1
                continue
            if ch == quote:
                state = "code"
                quote = ""
            i += 1
            continue

        if state == "line_comment":
            out.append(ch)
            if ch == "\n":
                state = "code"
            i += 1
            continue

        if state == "block_comment":
            out.append(ch)
            if ch == "*" and nxt == "/":
                out.append(nxt)
                i += 2
                state = "code"
            else:
                i += 1
            continue
    return "".join(out)

def fix_html(text: str) -> str:
    # Replace any logo content safely while preserving link/div attributes.
    text = re.sub(r'(<a\b(?=[^>]*class=["\'][^"\']*\blogo\b[^"\']*["\'])([^>]*)>)(.*?)(</a>)',
                  lambda m: m.group(1) + LOGO_INNER + m.group(4), text, flags=re.I | re.S)
    text = re.sub(r'(<div\b(?=[^>]*class=["\'][^"\']*\blogo\b[^"\']*["\'])([^>]*)>)(.*?)(</div>)',
                  lambda m: m.group(1) + LOGO_INNER + m.group(4), text, flags=re.I | re.S)

    # Plain brand cleanup in text/meta/title/legal copy.
    replacements = {
        "Carly Studio Notes": f"{BRAND} Studio Notes",
        "Carly Studio": BRAND,
        "Carly pieces": f"{BRAND} pieces",
        "Carly piece": f"{BRAND} piece",
        "Carly product": f"{BRAND} product",
        "Carly products": f"{BRAND} products",
        "Carly handles": f"{BRAND} handles",
        "Carly is": f"{BRAND} is",
        "Carly does": f"{BRAND} does",
        "Carly never": f"{BRAND} never",
        "Carly website": f"{BRAND} website",
        "Why Carly": f"Why {BRAND}",
        "About Carly": f"About {BRAND}",
        "Carly": BRAND,
        "CARLY": BRAND,
        "Lister Living": BRAND,
        "LISTER LIVING": BRAND,
        "lister_living_cart": CART_KEY,
        "carly_cart": CART_KEY,
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Remove duplicated phrase if a previous patch made it messy.
    text = re.sub(r'(PAUL LAWRENCE JR LISTER)(\s+Studio){2,}', r'\1 Studio', text)
    text = text.replace(f"© 2026 {BRAND} Studio. All rights reserved.", f"© 2026 {BRAND}. All rights reserved.")
    text = text.replace(f"© 2026 {BRAND}. Studio. All rights reserved.", f"© 2026 {BRAND}. All rights reserved.")
    return text

def fix_js(text: str) -> str:
    # Fix common cart-key literals.
    text = text.replace('"carly_cart"', f'"{CART_KEY}"')
    text = text.replace("'carly_cart'", f"'{CART_KEY}'")
    text = text.replace('`carly_cart`', f'`{CART_KEY}`')
    text = text.replace('"lister_living_cart"', f'"{CART_KEY}"')
    text = text.replace("'lister_living_cart'", f"'{CART_KEY}'")
    text = text.replace('`lister_living_cart`', f'`{CART_KEY}`')

    # If the previous patch created raw PAUL LAWRENCE JR LISTER in JS code, quote it.
    text = quote_brand_outside_js_strings(text)

    # But CART_KEY should be the storage key, not the display name.
    text = re.sub(r'(const|let|var)\s+CART_KEY\s*=\s*(["\'])PAUL LAWRENCE JR LISTER\2\s*;',
                  rf'\1 CART_KEY = "{CART_KEY}";', text)
    text = re.sub(r'(const|let|var)\s+CART_KEY\s*=\s*(["\'])Lister Living\2\s*;',
                  rf'\1 CART_KEY = "{CART_KEY}";', text, flags=re.I)

    # Cleanup display strings only. These are safe because they remain inside quotes/template literals.
    text = text.replace("Carly Studio", BRAND)
    text = text.replace("Carly", BRAND)
    text = text.replace("CARLY", BRAND)
    text = text.replace("Lister Living", BRAND)
    text = text.replace("LISTER LIVING", BRAND)
    return text

changed = []

for path in html_files:
    backup_file(path)
    old = path.read_text(encoding="utf-8")
    new = fix_html(old)
    if new != old:
        path.write_text(new, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))

for path in js_files:
    backup_file(path)
    old = path.read_text(encoding="utf-8")
    new = fix_js(old)
    if new != old:
        path.write_text(new, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))

css_patch = r'''

/* =========================================================
   Emergency PAUL LAWRENCE JR LISTER layout patch v2
   ========================================================= */
.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .42em;
  white-space: nowrap;
  box-sizing: border-box;
  line-height: 1.05;
  max-width: 100%;
}

.logo .brand-logo-main,
.logo .brand-logo-accent {
  display: inline-block;
}

.logo .brand-logo-accent {
  color: var(--copper-2, #b87333);
}

.site-header .logo {
  min-width: auto;
  max-width: 430px;
  padding: 10px 14px;
  font-size: clamp(11px, .95vw, 16px);
  letter-spacing: clamp(1.5px, .28vw, 5px);
  overflow: visible;
  border-width: 0;
}

.site-header .nav {
  gap: clamp(12px, 2vw, 34px);
}

.site-header .nav-links {
  flex-wrap: wrap;
  justify-content: center;
}

.site-footer .logo {
  justify-content: flex-start;
  white-space: normal;
  line-height: 1.15;
  letter-spacing: 3px;
  gap: .45em;
}

@media (max-width: 980px) {
  .site-header .logo {
    max-width: 280px;
    font-size: 11px;
    letter-spacing: 2px;
  }
}

@media (max-width: 680px) {
  .site-header .logo {
    max-width: 220px;
    font-size: 10px;
    letter-spacing: 1.4px;
  }
}

/* Cart center/layout fix */
#cart-wrap { width: 100%; margin: 0 auto; }
.cart-empty-wrap {
  width: min(1120px, 100%);
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0 90px;
}
.empty-state {
  width: min(880px, 100%);
  min-height: 430px;
  background: rgba(255,255,255,.72);
  border-radius: 24px;
  padding: 72px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24px 70px rgba(65,42,30,.08);
}
.empty-icon, .empty-state .icon {
  font-size: 42px;
  color: var(--copper, #b87333);
  margin-bottom: 24px;
  line-height: 1;
}
.cart-layout {
  width: min(1120px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 28px;
  align-items: start;
  padding: 40px 0 90px;
}
.cart-items { display: grid; gap: 18px; }
.cart-row {
  display: grid;
  grid-template-columns: 130px 1fr auto;
  gap: 22px;
  align-items: center;
  background: rgba(255,255,255,.75);
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 16px 45px rgba(65,42,30,.06);
}
.cart-img, .cart-row .ci {
  width: 130px;
  height: 110px;
  background: #fff;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cart-img img, .cart-row .ci img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
}
.cart-right, .cart-row .right { text-align: right; }
@media (max-width: 900px) {
  .cart-layout { grid-template-columns: 1fr; }
  .cart-summary { position: static; }
}
@media (max-width: 620px) {
  .cart-row { grid-template-columns: 92px 1fr; }
  .cart-img, .cart-row .ci { width: 92px; height: 92px; }
  .cart-right, .cart-row .right {
    grid-column: 1 / -1;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
'''

if css_file.exists():
    backup_file(css_file)
    css = css_file.read_text(encoding="utf-8")
    if "Emergency PAUL LAWRENCE JR LISTER layout patch v2" not in css:
        css_file.write_text(css + css_patch, encoding="utf-8")
        changed.append(str(css_file.relative_to(ROOT)))

print("DONE. Đã sửa các file:")
for item in changed:
    print("-", item)
print("\nBackup lần đầu nằm ở:", BACKUP)
print("\nBây giờ hãy mở trình duyệt, F12 > Console chạy: localStorage.clear(); location.reload();")
print("Nếu vẫn còn lỗi SyntaxError, hãy gửi đúng dòng báo lỗi gồm tên file và line number.")

# Optional local JS syntax check if Node is available.
try:
    node = shutil.which("node")
    if node:
        print("\nKiểm tra nhanh cú pháp JS bằng node --check:")
        for path in js_files:
            result = subprocess.run([node, "--check", str(path)], capture_output=True, text=True)
            if result.returncode == 0:
                print("OK", path.relative_to(ROOT))
            else:
                print("ERROR", path.relative_to(ROOT))
                print(result.stderr)
except Exception as exc:
    print("Không chạy được node --check:", exc)
