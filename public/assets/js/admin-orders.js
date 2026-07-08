/* ============================================================
   PAUL LAWRENCE JR LISTER — Admin order history page
   Reads checkout orders saved by main.js in localStorage.
   This is suitable for static-site demo/testing. For real orders
   from multiple customers, connect checkout to a backend/database.
   ============================================================ */
(function(){
  "use strict";

  const ORDER_KEY = "paul_lawrence_jr_lister_orders";
  const FIXED_QUEUE_ORDER_REF = "PLJR-QUEUE-20260707-0312";
  const SEEDED_QUEUE_PAYMENTS = [
    {
      ref: FIXED_QUEUE_ORDER_REF,
      name: "Long Le Thanh",
      email: "julio.kidd.07@gmail.com",
      total: 695.80,
      createdAt: "2026-07-07T03:12:00-05:00",
      loadDate: "07/07/2026 03:12 EST",
      paymentStatus: "Unpaid",
      note: "Estimated load date (EST): 07/07/2026 03:12",
      items: [
        { id:7, name:"Acrylic Sculptural Floor Lamp", category:"Ambient Lighting", price:109.91, image:"assets/images/product/7.webp", qty:5 },
        { id:4, name:"RGB Ocean Wave Projector", category:"Ambient Lighting", price:67.99, image:"assets/images/product/4.webp", qty:1 },
        { id:20, name:"Concrete Grey Side Table", category:"Furniture", price:52.86, image:"assets/images/product/20.webp", qty:1 },
        { id:15, name:"Wooden LED Alarm Clock", category:"Home Decor", price:11.82, image:"assets/images/product/15.webp", qty:1 },
        { id:12, name:"Teal Pom Pom Cushion Set", category:"Soft Furnishing", price:6.79, image:"assets/images/product/12.webp", qty:2 }
      ]
    },
    { ref:"PLJR-QUEUE-20260707-0313-WET-AVOCADO", name:"Wet Avocado Limited", total:5750.29, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0314-STEPH-DAVID", name:"Steph David", total:5754.14, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0315-HUONG-NGUYEN-HIEP", name:"Huong Nguyen Hiep", total:1988.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0316-SERHII-HOLUB", name:"SERHII HOLUB", total:1239.52, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0317-TRANG-VU-HIEN", name:"TRANG VU HIEN", total:354.39, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0318-BADANI-TASANA", name:"BADANI TASANA", total:500.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0319-MOHAMAD-WAKTHARIF", name:"MOHAMAD WAKTHARIF MOHAMAD", total:784.08, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0320-AMARASEKARA-HEWAVITHARANA", name:"Amarasekara Hewavitharana", total:340.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0321-MANJU-STORE", name:"Manju Store", total:740.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0322-PARATHANA-STORE", name:"PARATHANA STORE", total:205.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0323-PUSHPA-STORE", name:"Pushpa Store", total:367.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0324-GANESH-STORE", name:"ganesh store", total:215.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0325-NILANTHA-SUMANGALA", name:"Nilantha Sumangala", total:418.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0326-EL-HOUCINE-ASSOUK", name:"EL HOUCINE ASSOUK", total:496.00, paymentStatus:"Completed" },
    { ref:"PLJR-QUEUE-20260707-0327-SARAH-EL-OUAZZANI", name:"SARAH EL OUAZZANI", total:440.00, paymentStatus:"Completed" }
  ];
  const $ = (s,c)=>(c||document).querySelector(s);
  const $$ = (s,c)=>Array.from((c||document).querySelectorAll(s));
  const money = v => "$" + Number(v || 0).toFixed(2);

  const state = {
    search: "",
    status: "all",
    method: "all",
    selectedOrder: null
  };

  function escapeHTML(value){
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#039;", '"':"&quot;"
    }[ch]));
  }

  function getOrders(){
    try{ return JSON.parse(localStorage.getItem(ORDER_KEY)) || []; }
    catch(e){ return []; }
  }

  function saveOrders(orders){
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  }

  function formatDate(value){
    if(!value) return "—";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-US", {
      year:"numeric", month:"short", day:"2-digit",
      hour:"2-digit", minute:"2-digit"
    });
  }

  function displayLoadDate(order){
    return order.estimatedLoadDate || order.loadDate || order.estimatedLoadDateEST || "—";
  }

  function statusTone(status){
    const s = String(status || "").toLowerCase();
    if(s.includes("paid") || s.includes("completed")) return "good";
    if(s.includes("queue") || s.includes("dispatched") || s.includes("processing")) return "info";
    if(s.includes("cancelled")) return "danger";
    return "warn";
  }

  function normalizeOrder(order){
    return {
      ...order,
      customer: order.customer || {},
      items: Array.isArray(order.items) ? order.items : [],
      total: Number(order.total || order.subtotal || 0),
      paymentStatus: order.paymentStatus || "Unpaid",
      status: order.status || "Order request received · Awaiting confirmation",
      method: order.method || "Order First",
      queue: order.queue || ""
    };
  }

  function buildQueueBundleItems(payment, index){
    if(Array.isArray(payment.items) && payment.items.length){
      return payment.items.map(item => ({ ...item, subtotal:Number((Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)) }));
    }

    const total = Number(payment.total || 0);
    const productPool = [
      { id:7, name:"Acrylic Sculptural Floor Lamp", category:"Ambient Lighting", image:"assets/images/product/7.webp" },
      { id:4, name:"RGB Ocean Wave Projector", category:"Ambient Lighting", image:"assets/images/product/4.webp" },
      { id:20, name:"Concrete Grey Side Table", category:"Furniture", image:"assets/images/product/20.webp" },
      { id:15, name:"Wooden LED Alarm Clock", category:"Home Decor", image:"assets/images/product/15.webp" },
      { id:12, name:"Teal Pom Pom Cushion Set", category:"Soft Furnishing", image:"assets/images/product/12.webp" },
      { id:11, name:"Premium Ceramic Vase Set", category:"Home Decor", image:"assets/images/product/11.webp" },
      { id:18, name:"Modern Accent Lounge Chair", category:"Furniture", image:"assets/images/product/18.webp" },
      { id:22, name:"Decorative Wall Mirror", category:"Home Decor", image:"assets/images/product/22.webp" }
    ];

    const first = Number((total * 0.58).toFixed(2));
    const second = Number((total * 0.27).toFixed(2));
    const third = Number((total - first - second).toFixed(2));

    return [first, second, third].map((amount, i)=>{
      const product = productPool[(index + i) % productPool.length];
      return {
        ...product,
        price: amount,
        qty: 1,
        subtotal: amount
      };
    });
  }

  function buildRequestedQueueOrder(payment, index){
    const items = buildQueueBundleItems(payment, index);
    const total = Number(items.reduce((sum,item)=>sum + Number(item.subtotal || 0), 0).toFixed(2));
    const loadDate = payment.loadDate || "07/07/2026 03:12 EST";
    const createdMinute = String(12 + index).padStart(2, "0");

    return {
      id: payment.ref,
      ref: payment.ref,
      createdAt: payment.createdAt || `2026-07-07T03:${createdMinute}:00-05:00`,
      method: "Order First",
      status: "Queue · Awaiting processing",
      queue: "Queue",
      paymentStatus: payment.paymentStatus || "Completed",
      currency: "USD",
      subtotal: total,
      total: total,
      estimatedLoadDate: loadDate,
      customer: {
        name: payment.name,
        email: payment.email || "",
        phone: "",
        city: "",
        address: "",
        note: payment.note || `Payment from ${payment.name} · Completed · ${Number(payment.total || total).toFixed(2)} USD · Estimated load date (EST): ${loadDate.replace(" EST", "")}`
      },
      items
    };
  }

  function buildRequestedQueueOrders(){
    return SEEDED_QUEUE_PAYMENTS.map((payment,index)=>buildRequestedQueueOrder(payment,index));
  }

  function ensureRequestedQueueOrder(){
    const orders = getOrders().map(normalizeOrder);
    const existingRefs = new Set(orders.map(order => order.ref || order.id));
    const missingSeedOrders = buildRequestedQueueOrders().filter(order => !existingRefs.has(order.ref || order.id));
    if(!missingSeedOrders.length) return;
    saveOrders([...missingSeedOrders, ...orders]);
  }

  function filteredOrders(){
    const q = state.search.trim().toLowerCase();
    return getOrders().map(normalizeOrder).filter(order=>{
      const statusOk = state.status === "all" || [order.status, order.queue].join(" ").toLowerCase().includes(state.status.toLowerCase());
      const methodOk = state.method === "all" || order.method === state.method;
      const blob = [
        order.ref, order.id, order.status, order.queue, order.paymentStatus, order.method,
        order.createdAt, displayLoadDate(order), order.currency, order.total,
        order.customer.name, order.customer.email, order.customer.phone,
        order.customer.city, order.customer.address, order.customer.note,
        ...order.items.map(i=>`${i.name} ${i.category} ${i.qty} ${i.price}`)
      ].join(" ").toLowerCase();
      const searchOk = !q || blob.includes(q);
      return statusOk && methodOk && searchOk;
    });
  }

  function renderStats(){
    const orders = getOrders().map(normalizeOrder);
    const totalOrders = orders.length;
    const queued = orders.filter(o=>[o.status,o.queue].join(" ").toLowerCase().includes("queue")).length;
    const awaiting = orders.filter(o=>String(o.status).toLowerCase().includes("awaiting")).length;
    const revenue = orders.reduce((sum,o)=>sum + Number(o.total || 0), 0);

    $("#admin-stats").innerHTML = `
      <article class="admin-stat-card"><span>Total Orders</span><strong>${totalOrders}</strong><small>All saved checkout records</small></article>
      <article class="admin-stat-card"><span>Queue</span><strong>${queued}</strong><small>Orders waiting to process</small></article>
      <article class="admin-stat-card"><span>Awaiting</span><strong>${awaiting}</strong><small>Needs confirmation</small></article>
      <article class="admin-stat-card"><span>Order Value</span><strong>${money(revenue)}</strong><small>Subtotal from saved orders</small></article>
    `;
  }

  function renderOrders(){
    const root = $("#admin-orders-root");
    const orders = filteredOrders();

    renderStats();
    const countLabel = $("#admin-result-count");
    if(countLabel){ countLabel.textContent = `${orders.length} result${orders.length === 1 ? "" : "s"}`; }

    if(!orders.length){
      root.innerHTML = `
        <div class="admin-empty-state">
          <div class="empty-icon">◇</div>
          <h2>No order history found</h2>
          <p>Try another search keyword, or add the seeded queue payment orders again.</p>
          <div class="admin-empty-actions">
            <button class="btn btn-outline" type="button" id="empty-add-sample">Add Queue Orders</button>
          </div>
        </div>`;
      const sampleBtn = $("#empty-add-sample");
      if(sampleBtn) sampleBtn.addEventListener("click", addRequestedQueueOrder);
      return;
    }

    root.innerHTML = `
      <div class="admin-table-scroll">
        <table class="admin-orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Load Date</th>
              <th>Payment</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order=>{
              const firstItems = order.items.slice(0,2).map(i=>escapeHTML(i.name)).join(", ");
              const more = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";
              return `
                <tr>
                  <td>
                    <strong>${escapeHTML(order.ref || order.id)}</strong>
                    <small>${formatDate(order.createdAt)}</small>
                  </td>
                  <td>
                    <strong>${escapeHTML(order.customer.name || "No name")}</strong>
                    <small>${escapeHTML(order.customer.email || "No email")}</small>
                  </td>
                  <td>
                    <span>${firstItems || "—"}${more}</span>
                    <small>${order.items.length} item${order.items.length === 1 ? "" : "s"}</small>
                  </td>
                  <td><strong>${money(order.total)}</strong><small>${escapeHTML(order.currency || "USD")}</small></td>
                  <td><strong>${escapeHTML(displayLoadDate(order))}</strong><small>Estimated load date</small></td>
                  <td><span class="admin-pill ${statusTone(order.paymentStatus)}">${escapeHTML(order.paymentStatus)}</span><small>${escapeHTML(order.method)}</small></td>
                  <td><span class="admin-pill ${statusTone(order.status)}">${escapeHTML(order.status)}</span></td>
                  <td class="admin-row-actions"><button type="button" class="btn btn-outline" data-view="${escapeHTML(order.ref || order.id)}">View</button></td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;

    $$('[data-view]').forEach(btn=>{
      btn.addEventListener("click", ()=>openOrder(btn.dataset.view));
    });
  }

  function openOrder(ref){
    const order = getOrders().map(normalizeOrder).find(o => (o.ref || o.id) === ref);
    if(!order) return;
    state.selectedOrder = order;
    const modal = $("#admin-modal");
    const content = $("#admin-modal-content");

    content.innerHTML = `
      <span class="eyebrow">Order Detail</span>
      <h2 id="admin-modal-title">${escapeHTML(order.ref || order.id)}</h2>
      <div class="admin-detail-meta">
        <span>${formatDate(order.createdAt)}</span>
        <span>${escapeHTML(order.method)}</span>
        <span>${money(order.total)}</span>
        <span>${escapeHTML(displayLoadDate(order))}</span>
      </div>

      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <h4>Customer</h4>
          <p><strong>${escapeHTML(order.customer.name || "—")}</strong></p>
          <p>${escapeHTML(order.customer.email || "—")}</p>
          <p>${escapeHTML(order.customer.phone || "—")}</p>
          <p>${escapeHTML(order.customer.city || "—")}</p>
          <p>${escapeHTML(order.customer.address || "—")}</p>
          <p><strong>Estimated load date:</strong> ${escapeHTML(displayLoadDate(order))}</p>
        </div>
        <div class="admin-detail-card">
          <h4>Status</h4>
          <label>Order Status</label>
          <select id="modal-status">
            ${[
              "Queue · Awaiting processing",
              "Order request received · Awaiting confirmation",
              "Payment received · Awaiting fulfilment",
              "Processing",
              "Dispatched",
              "Completed",
              "Cancelled"
            ].map(v=>`<option value="${escapeHTML(v)}" ${order.status === v ? "selected" : ""}>${escapeHTML(v)}</option>`).join("")}
          </select>
          <label>Payment Status</label>
          <select id="modal-payment">
            ${["Unpaid","Paid","Refunded"].map(v=>`<option value="${escapeHTML(v)}" ${order.paymentStatus === v ? "selected" : ""}>${escapeHTML(v)}</option>`).join("")}
          </select>
          <button class="btn btn-primary btn-block" type="button" id="save-order-status">Save Status</button>
        </div>
      </div>

      <div class="admin-detail-card full">
        <h4>Items</h4>
        <div class="admin-detail-items">
          ${order.items.map(i=>`
            <div class="admin-detail-item">
              <div class="admin-detail-img"><img src="${escapeHTML(i.image || "")}" alt=""></div>
              <div>
                <strong>${escapeHTML(i.name)}</strong>
                <small>${escapeHTML(i.category || "")}</small>
              </div>
              <div>Qty ${Number(i.qty || 1)}</div>
              <div>${money(i.subtotal || (i.price * i.qty))}</div>
            </div>`).join("")}
        </div>
        <div class="admin-total-line"><span>Total</span><strong>${money(order.total)}</strong></div>
      </div>

      <div class="admin-detail-card full">
        <h4>Customer Note</h4>
        <p>${escapeHTML(order.customer.note || "No note.")}</p>
      </div>`;

    modal.hidden = false;
    document.body.classList.add("admin-modal-open");
    $("#save-order-status").addEventListener("click", saveModalStatus);
  }

  function saveModalStatus(){
    const current = state.selectedOrder;
    if(!current) return;
    const orders = getOrders().map(normalizeOrder).map(order=>{
      if((order.ref || order.id) !== (current.ref || current.id)) return order;
      return {
        ...order,
        status: $("#modal-status").value,
        paymentStatus: $("#modal-payment").value,
        queue: $("#modal-status").value.toLowerCase().includes("queue") ? "Queue" : "",
        updatedAt: new Date().toISOString()
      };
    });
    saveOrders(orders);
    closeModal();
    renderOrders();
  }

  function closeModal(){
    $("#admin-modal").hidden = true;
    document.body.classList.remove("admin-modal-open");
    state.selectedOrder = null;
  }

  function csvEscape(value){
    return '"' + String(value ?? "").replace(/"/g,'""') + '"';
  }

  function exportCSV(){
    const orders = filteredOrders();
    if(!orders.length){ alert("No orders to export."); return; }
    const rows = [[
      "Ref", "Created At", "Customer", "Email", "Phone", "City", "Address",
      "Estimated Load Date", "Method", "Payment Status", "Order Status", "Items", "Total", "Note"
    ]];
    orders.forEach(order=>{
      rows.push([
        order.ref || order.id,
        formatDate(order.createdAt),
        order.customer.name,
        order.customer.email,
        order.customer.phone,
        order.customer.city,
        order.customer.address,
        displayLoadDate(order),
        order.method,
        order.paymentStatus,
        order.status,
        order.items.map(i=>`${i.name} x${i.qty}`).join(" | "),
        Number(order.total || 0).toFixed(2),
        order.customer.note
      ]);
    });
    const csv = rows.map(row=>row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paul-lawrence-orders.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function addRequestedQueueOrder(){
    const seedOrders = buildRequestedQueueOrders();
    const seedRefs = new Set(seedOrders.map(order => order.ref || order.id));
    const orders = getOrders().map(normalizeOrder).filter(order => !seedRefs.has(order.ref || order.id));
    saveOrders([...seedOrders, ...orders]);
    renderOrders();
  }

  function clearHistory(){
    if(!confirm("Clear all saved order history in this browser?")) return;
    localStorage.removeItem(ORDER_KEY);
    renderOrders();
  }

  function initHeader(){
    const toggle = $(".menu-toggle");
    const nav = $(".nav-links");
    if(toggle && nav){ toggle.addEventListener("click", ()=>nav.classList.toggle("open")); }
  }

  document.addEventListener("DOMContentLoaded", function(){
    initHeader();
    ensureRequestedQueueOrder();

    $("#admin-search").addEventListener("input", e=>{ state.search = e.target.value; renderOrders(); });
    const clearSearch = $("#admin-search-clear");
    if(clearSearch){
      clearSearch.addEventListener("click", ()=>{
        state.search = "";
        $("#admin-search").value = "";
        renderOrders();
        $("#admin-search").focus();
      });
    }
    $("#admin-status").addEventListener("change", e=>{ state.status = e.target.value; renderOrders(); });
    $("#admin-method").addEventListener("change", e=>{ state.method = e.target.value; renderOrders(); });
    $("#admin-export").addEventListener("click", exportCSV);
    $("#admin-seed").addEventListener("click", addRequestedQueueOrder);
    $("#admin-clear").addEventListener("click", clearHistory);
    $$('[data-close-modal]').forEach(el=>el.addEventListener("click", closeModal));
    document.addEventListener("keydown", e=>{ if(e.key === "Escape" && !$("#admin-modal").hidden) closeModal(); });
    renderOrders();
  });
})();
