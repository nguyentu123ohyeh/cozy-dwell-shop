from pathlib import Path
import re

BRAND = "PAUL LAWRENCE JR LISTER"
LOGO = 'PAUL<span> LAWRENCE JR LISTER</span>'
LOGO_COPPER = 'PAUL<span style="color:var(--copper-2)"> LAWRENCE JR LISTER</span>'
CART_KEY = "paul_lawrence_jr_lister_cart"

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"

if not PUBLIC.exists():
    raise SystemExit("Không tìm thấy thư mục public. Hãy đặt file này ngang hàng với thư mục public rồi chạy lại.")

html_files = list(PUBLIC.glob("*.html"))
js_files = list((PUBLIC / "assets" / "js").glob("*.js")) if (PUBLIC / "assets" / "js").exists() else []
css_file = PUBLIC / "assets" / "css" / "style.css"

def fix_text(text: str, is_html: bool = False) -> str:
    # Logo variants from the old template
    text = re.sub(r'CAR\s*<span>\s*LY\s*</span>', LOGO, text, flags=re.I)
    text = re.sub(r'CAR\s*<span\s+style=["\']color:var\(--copper-2\)["\']>\s*LY\s*</span>', LOGO_COPPER, text, flags=re.I)

    # Logo variants from the earlier wrong patch
    text = re.sub(r'LISTER\s*<span>\s*LIVING\s*</span>', LOGO, text, flags=re.I)
    text = re.sub(r'LISTER\s*<span\s+style=["\']color:var\(--copper-2\)["\']>\s*LIVING\s*</span>', LOGO_COPPER, text, flags=re.I)

    # Any plain brand mentions / cart key
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

    return text

for path in html_files:
    old = path.read_text(encoding="utf-8")
    new = fix_text(old, is_html=True)
    new = new.replace(f"— {BRAND} Studio", f"— {BRAND}")
    path.write_text(new, encoding="utf-8")

for path in js_files:
    old = path.read_text(encoding="utf-8")
    new = fix_text(old, is_html=False)
    path.write_text(new, encoding="utf-8")

css_patch = r'''
/* =========================================================
   PAUL LAWRENCE JR LISTER brand + cart layout patch
   Added automatically by fix_public_site_paul_lawrence.py
   ========================================================= */

/* Long brand logo fix */
.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28em;
  max-width: 100%;
  box-sizing: border-box;
  white-space: nowrap;
  line-height: 1.05;
}

.logo span {
  display: inline;
}

.site-header .logo {
  min-width: auto;
  max-width: 390px;
  padding: 10px 14px;
  font-size: clamp(12px, 1vw, 17px);
  letter-spacing: clamp(1.5px, 0.32vw, 5px);
  overflow: visible;
}

.site-header .nav {
  gap: clamp(14px, 2vw, 34px);
}

.site-header .nav-links {
  flex-wrap: wrap;
  justify-content: center;
}

/* Footer logo can be full width */
.site-footer .logo {
  justify-content: flex-start;
  white-space: normal;
  line-height: 1.15;
  letter-spacing: 3px;
}

/* Cart center/layout fix */
#cart-wrap {
  width: 100%;
  margin: 0 auto;
}

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
  background: rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  padding: 72px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24px 70px rgba(65, 42, 30, 0.08);
}

.empty-icon,
.empty-state .icon {
  font-size: 42px;
  color: var(--copper, #b87333);
  margin-bottom: 24px;
  line-height: 1;
}

.empty-state h2 {
  max-width: 780px;
  margin: 0 auto 18px;
  font-size: clamp(34px, 4vw, 54px);
  line-height: 1.12;
  color: var(--espresso, #3b281f);
}

.empty-state p {
  margin: 0 0 28px;
  font-size: 18px;
  color: var(--espresso-2, #5f4b40);
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

.cart-items {
  display: grid;
  gap: 18px;
}

.cart-row {
  display: grid;
  grid-template-columns: 130px 1fr auto;
  gap: 22px;
  align-items: center;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 16px 45px rgba(65, 42, 30, 0.06);
}

.cart-img,
.cart-row .ci {
  width: 130px;
  height: 110px;
  background: #fff;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cart-img img,
.cart-row .ci img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
}

.cart-info h4,
.cart-row h4 {
  margin: 0 0 6px;
  font-size: 20px;
  color: var(--espresso, #35241d);
}

.cart-meta,
.cart-row .meta {
  margin: 0 0 6px;
  color: var(--espresso-2, #8a7465);
  font-size: 14px;
}

.cart-price {
  margin: 0 0 12px;
  color: var(--espresso, #3b281f);
  font-weight: 700;
}

.qty {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #f6efe4;
  border-radius: 999px;
  padding: 6px 10px;
}

.qty button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: var(--espresso, #3b281f);
  font-size: 18px;
  cursor: pointer;
}

.qty span {
  min-width: 24px;
  text-align: center;
  font-weight: 700;
}

.cart-right,
.cart-row .right {
  text-align: right;
}

.cart-subtotal,
.cart-row .sub {
  font-size: 18px;
  font-weight: 800;
  color: var(--espresso, #3b281f);
  margin-bottom: 12px;
}

.remove {
  border: none;
  background: transparent;
  color: var(--copper, #b87333);
  font-weight: 700;
  cursor: pointer;
}

.cart-summary {
  position: sticky;
  top: 110px;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 24px;
  padding: 26px;
  box-shadow: 0 20px 60px rgba(65, 42, 30, 0.08);
}

.cart-summary h3 {
  margin: 0 0 22px;
  color: var(--espresso, #3b281f);
  font-size: 26px;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(61, 40, 31, 0.1);
  color: var(--espresso-2, #5f4b40);
}

.sum-row.total {
  border-bottom: none;
  font-size: 20px;
  color: var(--espresso, #3b281f);
}

.cart-actions {
  display: grid;
  gap: 12px;
  margin-top: 24px;
}

.btn-block {
  width: 100%;
  text-align: center;
}

@media (max-width: 1050px) {
  .site-header .nav {
    grid-template-columns: auto 1fr auto;
  }

  .site-header .logo {
    max-width: 280px;
    font-size: 12px;
    letter-spacing: 2px;
  }
}

@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .cart-summary {
    position: static;
  }

  .site-header .logo {
    max-width: calc(100vw - 170px);
    white-space: normal;
    line-height: 1.12;
  }
}

@media (max-width: 620px) {
  .cart-row {
    grid-template-columns: 92px 1fr;
  }

  .cart-img,
  .cart-row .ci {
    width: 92px;
    height: 92px;
  }

  .cart-right,
  .cart-row .right {
    grid-column: 1 / -1;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .empty-state {
    padding: 54px 22px;
    min-height: 360px;
  }

  .site-header .logo {
    font-size: 10px;
    letter-spacing: 1px;
    padding: 8px 10px;
  }
}
'''

if css_file.exists():
    css = css_file.read_text(encoding="utf-8")
    marker = "PAUL LAWRENCE JR LISTER brand + cart layout patch"
    if marker not in css:
        css_file.write_text(css.rstrip() + "\n\n" + css_patch.lstrip(), encoding="utf-8")
else:
    css_file.parent.mkdir(parents=True, exist_ok=True)
    css_file.write_text(css_patch.lstrip(), encoding="utf-8")

print("Đã sửa xong:")
print("- Logo/brand: PAUL LAWRENCE JR LISTER")
print("- Carly/Carly Studio/Lister Living: đã thay")
print("- Cart key: paul_lawrence_jr_lister_cart")
print("- Đã thêm CSS để logo dài không vỡ layout và cart không lệch")
print("")
print("Bạn nên mở trình duyệt và chạy:")
print("localStorage.clear(); location.reload();")
