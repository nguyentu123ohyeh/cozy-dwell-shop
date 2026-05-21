/* ============================================================
   CARLY — main.js
   Handles rendering, cart, pagination, gallery, checkout,
   contact inquiry, cookie banner, reveal animations.
   product.js MUST be loaded before this file.
   ============================================================ */
(function(){
  "use strict";

  /* ---------- Fallback if catalog missing ---------- */
  if(!window.PRODUCTS || !Array.isArray(window.PRODUCTS)){
    document.addEventListener("DOMContentLoaded", function(){
      const root = document.querySelector("main") || document.body;
      root.innerHTML = '<div class="container" style="padding:120px 20px;text-align:center">'+
        '<h1>Product data not found</h1>'+
        '<p>Product data is not loaded correctly. Please refresh the page.</p>'+
        '</div>';
    });
    return;
  }

  const PRODUCTS = window.PRODUCTS;
  const CART_KEY = "carly_cart";
  const COOKIE_KEY = "carly_cookie_pref";
  const $ = (s,c)=>(c||document).querySelector(s);
  const $$ = (s,c)=>Array.from((c||document).querySelectorAll(s));
  const money = v => "$"+Number(v).toFixed(2);

  /* ---------- Cart functions (localStorage) ---------- */
  function getCart(){
    try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch(e){ return []; }
  }
  function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartBadge(); }
  function addToCart(id){
    const p = PRODUCTS.find(x=>x.id==id);
    if(!p) return;
    const cart = getCart();
    const ex = cart.find(x=>x.id==id);
    if(ex){ ex.qty += 1; }
    else { cart.push({id:p.id,name:p.name,category:p.category,price:p.price,image:p.image,qty:1}); }
    saveCart(cart);
    toast(p.name+" added to your selection");
  }
  function removeFromCart(id){ saveCart(getCart().filter(x=>x.id!=id)); }
  function updateQuantity(id,delta){
    const cart = getCart();
    const item = cart.find(x=>x.id==id);
    if(!item) return;
    item.qty = Math.max(1, item.qty + delta);
    saveCart(cart);
  }
  function clearCart(){ localStorage.removeItem(CART_KEY); updateCartBadge(); }
  function calculateCartTotal(){ return getCart().reduce((s,i)=>s+i.price*i.qty,0); }
  function cartCount(){ return getCart().reduce((s,i)=>s+i.qty,0); }
  function updateCartBadge(){
    const n = cartCount();
    $$(".cart-badge").forEach(b=>{
      b.textContent = n;
      if(n>0){ b.hidden = false; } else { b.hidden = true; }
    });
  }

  // Expose minimal API for inline use
  window.Carly = { addToCart, getCart, clearCart, updateCartBadge };

  /* ---------- Toast ---------- */
  function toast(msg){
    let t = $(".toast");
    if(!t){ t = document.createElement("div"); t.className="toast success"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(()=>t.classList.remove("show"), 2200);
  }

  /* ---------- Header: mobile toggle + active link ---------- */
  function initHeader(){
    const toggle = $(".menu-toggle");
    const nav = $(".nav-links");
    if(toggle && nav){
      toggle.addEventListener("click", ()=>nav.classList.toggle("open"));
    }
    const path = location.pathname.split("/").pop() || "index.html";
    $$(".nav-links a").forEach(a=>{
      const href = a.getAttribute("href");
      if(href === path) a.classList.add("active");
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal(){
    const els = $$(".reveal");
    if(!els.length || !("IntersectionObserver" in window)){
      els.forEach(e=>e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }});
    }, {threshold:.12});
    els.forEach(e=>io.observe(e));
  }

  /* ---------- Product card template ---------- */
  function cardHTML(p){
    return `<article class="product-card reveal">
      <a class="product-media" href="product-detail.html?id=${p.id}">
        <img src="${p.image}" alt="${p.name}" loading="lazy"
             onerror="this.style.padding='40px';this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23fbf8f2%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23b87333%22 font-family=%22serif%22 font-size=%2210%22>Carly</text></svg>'">
      </a>
      <div class="product-body">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.short}</p>
        <div class="product-price">${money(p.price)}</div>
        <div class="product-actions">
          <button class="btn btn-primary" data-add="${p.id}">Add to Cart</button>
          <a class="btn btn-outline" href="product-detail.html?id=${p.id}">View Detail</a>
        </div>
      </div>
    </article>`;
  }

  /* ---------- Products listing with pagination (9/page, 22 products) ---------- */
  function initProductsPage(){
    const grid = $("#products-grid");
    if(!grid) return;
    const PER = 9;
    const totalPages = Math.ceil(PRODUCTS.length / PER);
    let page = 1;

    function render(){
      const start = (page-1)*PER;
      const items = PRODUCTS.slice(start, start+PER);
      grid.innerHTML = items.map(cardHTML).join("");
      // pagination
      const pag = $("#pagination");
      let btns = `<button data-page="prev" ${page===1?"disabled":""}>‹</button>`;
      for(let i=1;i<=totalPages;i++){
        btns += `<button data-page="${i}" class="${i===page?"active":""}">${i}</button>`;
      }
      btns += `<button data-page="next" ${page===totalPages?"disabled":""}>›</button>`;
      pag.innerHTML = btns;
      initReveal();
      window.scrollTo({top: $("#products-grid").offsetTop - 100, behavior:"smooth"});
    }
    grid.parentElement.addEventListener("click", e=>{
      const b = e.target.closest("[data-page]");
      if(b){
        const v = b.dataset.page;
        if(v==="prev" && page>1) page--;
        else if(v==="next" && page<totalPages) page++;
        else if(!isNaN(parseInt(v))) page = parseInt(v);
        render();
      }
      const a = e.target.closest("[data-add]");
      if(a){ addToCart(a.dataset.add); }
    });
    render();
  }

  /* ---------- Featured (home) ---------- */
  function initFeatured(){
    const grid = $("#featured-grid");
    if(!grid) return;
    const featured = [1,2,7,12,17,22];
    grid.innerHTML = featured.map(id=>{
      const p = PRODUCTS.find(x=>x.id===id);
      return p ? cardHTML(p) : "";
    }).join("");
    grid.addEventListener("click", e=>{
      const a = e.target.closest("[data-add]");
      if(a) addToCart(a.dataset.add);
    });
  }

  /* ---------- Product detail ---------- */
  function initDetail(){
    const wrap = $("#detail");
    if(!wrap) return;
    const id = new URLSearchParams(location.search).get("id");
    const p = PRODUCTS.find(x=>x.id==id);
    if(!p){
      wrap.innerHTML = `<div class="container center" style="padding:80px 0">
        <span class="eyebrow">Not Found</span>
        <h1>Product not found</h1>
        <p>The piece you are looking for is no longer available.</p>
        <a class="btn btn-primary" href="products.html">Back to Products</a>
      </div>`;
      return;
    }
    document.title = p.name + " — Carly";
    const gallery = (p.images && p.images.length ? p.images : [p.image]);
    wrap.innerHTML = `
      <div class="container">
        <div class="detail-grid">
          <div>
            <div class="gallery-main"><img id="main-img" src="${gallery[0]}" alt="${p.name}" onerror="this.src='${p.image}'"></div>
            <div class="thumbs" id="thumbs">
              ${gallery.map((g,i)=>`<button class="thumb ${i===0?"active":""}" data-src="${g}"><img src="${g}" alt="" onerror="this.src='${p.image}'"></button>`).join("")}
            </div>
          </div>
          <div class="detail-info reveal">
            <span class="product-cat">${p.category}</span>
            <h1>${p.name}</h1>
            <div class="price">${money(p.price)}</div>
            <p>${p.long}</p>
            <h4 style="font-family:var(--serif);margin-top:18px">Features</h4>
            <ul class="feature-list">${p.features.map(f=>`<li>${f}</li>`).join("")}</ul>
            <div class="care-box">
              <h4>Care &amp; Usage</h4>
              <p>${p.care}</p>
            </div>
            <div class="detail-actions">
              <button class="btn btn-primary" id="add-detail">Add to Cart</button>
              <a class="btn btn-outline" href="contact.html">Contact Us</a>
            </div>
          </div>
        </div>
      </div>`;
    const thumbs = $("#thumbs");
    thumbs.addEventListener("click", e=>{
      const t = e.target.closest(".thumb");
      if(!t) return;
      $$(".thumb").forEach(x=>x.classList.remove("active"));
      t.classList.add("active");
      $("#main-img").src = t.dataset.src;
    });
    $("#add-detail").addEventListener("click", ()=>addToCart(p.id));
    initReveal();
  }

  /* ---------- Cart page ---------- */
  function initCart(){
    const wrap = $("#cart-wrap");
    if(!wrap) return;
    function render(){
      const cart = getCart();
      if(!cart.length){
        wrap.innerHTML = `<div class="empty-state">
          <div class="icon">◇</div>
          <h2>Your living room selection is empty</h2>
          <p>Discover pieces curated for elegant, smart living.</p>
          <a class="btn btn-primary" href="products.html">Browse Products</a>
        </div>`;
        return;
      }
      const items = cart.map(i=>`
        <div class="cart-row">
          <div class="ci"><img src="${i.image}" alt="${i.name}"></div>
          <div>
            <h4>${i.name}</h4>
            <div class="meta">${i.category} · ${money(i.price)}</div>
            <div class="qty">
              <button data-dec="${i.id}">−</button>
              <span>${i.qty}</span>
              <button data-inc="${i.id}">+</button>
            </div>
          </div>
          <div class="right">
            <div class="sub">${money(i.price*i.qty)}</div>
            <button class="remove" data-rm="${i.id}">Remove</button>
          </div>
        </div>`).join("");
      const total = calculateCartTotal();
      wrap.innerHTML = `
        <div class="cart-items">${items}</div>
        <aside class="cart-summary">
          <h3>Order Summary</h3>
          <div class="sum-row"><span>Subtotal</span><span>${money(total)}</span></div>
          <div class="sum-row"><span>Estimated Shipping</span><span>Calculated at checkout</span></div>
          <div class="sum-row total"><span>Estimated Total</span><span>${money(total)}</span></div>
          <div class="cart-actions">
            <a class="btn btn-primary btn-block" href="checkout.html">Checkout</a>
            <a class="btn btn-outline btn-block" href="products.html">Continue Shopping</a>
          </div>
        </aside>`;
    }
    wrap.addEventListener("click", e=>{
      const inc = e.target.closest("[data-inc]");
      const dec = e.target.closest("[data-dec]");
      const rm  = e.target.closest("[data-rm]");
      if(inc){ updateQuantity(inc.dataset.inc, +1); render(); }
      else if(dec){ updateQuantity(dec.dataset.dec, -1); render(); }
      else if(rm){ removeFromCart(rm.dataset.rm); render(); }
    });
    render();
  }

  /* ---------- Checkout ---------- */
  function renderSummary(target){
    const cart = getCart();
    const total = calculateCartTotal();
    if(!cart.length){
      target.innerHTML = `<p>Your cart is empty. <a href="products.html" style="color:var(--copper)">Browse products</a>.</p>`;
      return 0;
    }
    target.innerHTML = `<div class="summary-list">${cart.map(i=>`
      <div class="summary-item">
        <div class="ci"><img src="${i.image}" alt=""></div>
        <div>
          <h5>${i.name}</h5>
          <div class="meta">${i.category} · Qty ${i.qty}</div>
        </div>
        <div class="price">${money(i.price*i.qty)}</div>
      </div>`).join("")}</div>
      <div class="sum-row"><span>Subtotal</span><span>${money(total)}</span></div>
      <div class="sum-row total"><span>Total</span><span>${money(total)}</span></div>`;
    return total;
  }
  function initCheckout(){
    const root = $("#checkout-root");
    if(!root) return;
    const summary = $("#order-summary");
    renderSummary(summary);

    const opts = $$(".method-opt");
    const placeBtn = $("#place-order");
    const paypalWrap = $("#paypal-button-container");
    let method = "order";
    let paypalRendered = false;

    function setMethod(m){
      method = m;
      opts.forEach(o=>o.classList.toggle("active", o.dataset.method===m));
      if(m === "order"){
        placeBtn.style.display = "";
        paypalWrap.style.display = "none";
      } else {
        placeBtn.style.display = "none";
        paypalWrap.style.display = "";
        renderPayPal();
      }
    }
    function renderPayPal(){
      if(paypalRendered || !window.paypal) return;
      try{
        window.paypal.Buttons({
          fundingSource: window.paypal.FUNDING.PAYPAL,
          style:{layout:"vertical", color:"gold", shape:"pill", label:"paypal"},
          createOrder: (data, actions) => actions.order.create({
            purchase_units:[{amount:{value: String(calculateCartTotal().toFixed(2))}}]
          }),
          onApprove: (data, actions) => actions.order.capture().then(()=>{
            clearCart();
            location.href = "thank.html?method=paypal";
          })
        }).render("#paypal-button-container");
        paypalRendered = true;
      }catch(err){ console.warn("PayPal SDK error", err); }
    }
    opts.forEach(o=>o.addEventListener("click", ()=>setMethod(o.dataset.method)));
    setMethod("order");

    // Place Order (Order First flow)
    $("#checkout-form").addEventListener("submit", e=>{
      e.preventDefault();
      if(method !== "order") return;
      const form = e.target;
      if(!form.checkValidity()){ form.reportValidity(); return; }
      if(!getCart().length){ alert("Your cart is empty."); return; }
      clearCart();
      location.href = "thank.html?method=order";
    });
  }

  /* ---------- Thank you ---------- */
  function initThank(){
    const wrap = $("#thank-content");
    if(!wrap) return;
    const method = new URLSearchParams(location.search).get("method");
    const ref = "CARLY-"+Date.now().toString(36).toUpperCase().slice(-8);
    let title, msg, status;
    if(method === "paypal"){
      title = "PayPal Payment Completed";
      msg = "Thank you. Your payment has been completed successfully using PayPal. Our team will confirm your order details and arrange fulfilment shortly.";
      status = "Payment received · Awaiting fulfilment";
    } else if(method === "order"){
      title = "Order Submitted";
      msg = "Thank you. Your order request has been submitted successfully. Our team will contact you to confirm product availability, shipping information, and arrange the order.";
      status = "Order request received · Awaiting confirmation";
    } else {
      title = "Thank You";
      msg = "Your request has been received successfully. Our team will be in touch shortly.";
      status = "Request received";
    }
    wrap.innerHTML = `
      <div class="thank-card reveal">
        <div class="check-icon">✓</div>
        <span class="eyebrow">Confirmation</span>
        <h1>${title}</h1>
        <div class="ref-card">REF · ${ref}</div>
        <p style="color:var(--espresso-2)">${msg}</p>
        <div class="status-card">
          <h4>Order Status</h4>
          <p style="margin:0;color:var(--espresso-2)">${status}</p>
        </div>
        <div class="next-steps">
          <h4 style="font-family:var(--serif)">Next Steps</h4>
          <ol>
            <li>Our team reviews your request within 24 hours.</li>
            <li>We confirm product availability and shipping details with you.</li>
            <li>Your order is carefully packed and dispatched.</li>
          </ol>
        </div>
        <div class="thank-actions">
          <a class="btn btn-primary" href="products.html">Continue Shopping</a>
          <a class="btn btn-outline" href="index.html">Back to Home</a>
        </div>
      </div>`;
    initReveal();
  }

  /* ---------- Contact ---------- */
  function initContact(){
    const form = $("#contact-form");
    if(!form) return;
    const opts = $$(".inquiry-opt");
    const preview = $("#cart-preview");
    const messageEl = $("#contact-message");
    let inquiryType = "general";

    function renderPreview(){
      const cart = getCart();
      if(inquiryType !== "products"){
        preview.style.display = "none";
        return;
      }
      preview.style.display = "";
      if(!cart.length){
        preview.innerHTML = `<h5>Selected Products</h5><p style="margin:0;color:var(--espresso-2)">No products selected yet. <a href="products.html" style="color:var(--copper)">Browse products</a>.</p>`;
        messageEl.value = "";
        return;
      }
      const MAX = 3;
      const visible = cart.slice(0, MAX);
      const more = cart.length - MAX;
      preview.innerHTML = `<h5>Selected Products (${cart.length})</h5>
        <div class="cc-list">
          ${visible.map(i=>`<div class="cc-item">
            <div class="ci"><img src="${i.image}" alt=""></div>
            <div><strong>${i.name}</strong><div class="meta" style="font-size:.78rem;color:var(--espresso-2)">${i.category} · Qty ${i.qty}</div></div>
            <div>${money(i.price*i.qty)}</div>
          </div>`).join("")}
        </div>
        ${more>0 ? `<a class="cc-more" href="cart.html">View all ${cart.length} items in cart →</a>` : `<a class="cc-more" href="cart.html">Back to cart →</a>`}`;
      // Auto-fill message
      const lines = cart.map(i=>`• ${i.name} (${i.category}) — Qty ${i.qty} — ${money(i.price*i.qty)}`).join("\n");
      messageEl.value = "Hello Carly team,\n\nI'm interested in the following items from my selection:\n\n"+lines+
        `\n\nEstimated total: ${money(calculateCartTotal())}\n\nCould you please confirm availability and shipping details?\n\nThank you.`;
    }
    function setType(t){
      inquiryType = t;
      opts.forEach(o=>o.classList.toggle("active", o.dataset.type===t));
      renderPreview();
    }
    opts.forEach(o=>o.addEventListener("click", ()=>setType(o.dataset.type)));
    setType("general");

    form.addEventListener("submit", e=>{
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      // Only clear cart on success and only for product inquiry
      if(inquiryType === "products"){ clearCart(); }
      form.reset();
      setType("general");
      $("#contact-success").style.display = "block";
      window.scrollTo({top:0, behavior:"smooth"});
    });
  }

  /* ---------- FAQ ---------- */
  function initFAQ(){
    $$(".faq-q").forEach(q=>{
      q.addEventListener("click", ()=>{
        q.parentElement.classList.toggle("open");
      });
    });
  }

  /* ---------- Cookie banner ---------- */
  function initCookie(){
    if(localStorage.getItem(COOKIE_KEY)) return;
    const el = document.createElement("div");
    el.className = "cookie";
    el.innerHTML = `<p>We use a few cookies for cart and preferences. No tracking, no third parties — promise.</p>
      <div class="actions">
        <button class="btn btn-copper" data-c="accept">Accept</button>
        <button class="btn btn-outline" style="border-color:rgba(255,255,255,.3);color:var(--ceramic)" data-c="decline">Decline</button>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add("show"));
    el.addEventListener("click", e=>{
      const b = e.target.closest("[data-c]");
      if(!b) return;
      localStorage.setItem(COOKIE_KEY, b.dataset.c);
      el.classList.remove("show");
      setTimeout(()=>el.remove(), 400);
    });
  }

  /* ---------- Newsletter / generic demo forms ---------- */
  function initDemoForms(){
    $$("[data-demo-form]").forEach(f=>{
      f.addEventListener("submit", e=>{
        e.preventDefault();
        if(!f.checkValidity()){ f.reportValidity(); return; }
        toast("Thank you. We'll be in touch.");
        f.reset();
      });
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function(){
    initHeader();
    updateCartBadge();
    initReveal();
    initFeatured();
    initProductsPage();
    initDetail();
    initCart();
    initCheckout();
    initThank();
    initContact();
    initFAQ();
    initDemoForms();
    initCookie();
  });
})();
