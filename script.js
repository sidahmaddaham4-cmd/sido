// يقرأ products.json ويبني الصفحة الرئيسية وصفحات المنتجات تلقائياً.
// كل التعديلات (اسم المتجر، رقم واتساب، المنتجات) تتم في products.json فقط.

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === "class") e.className = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach(c => e.append(c instanceof Node ? c : document.createTextNode(c)));
  return e;
}
const $ = s => document.querySelector(s);
const fmt = (n, cur) => `${Number(n).toLocaleString("en")} ${cur}`;

function media(p, i = 0) {
  const src = p.images && p.images[i];
  return h("div", { class: "media" },
    src ? h("img", { src, alt: p.name, loading: "lazy" })
        : h("div", { class: "ph", "aria-hidden": "true" }, [...p.name][0] || "•"));
}

function priceBlock(p, cur) {
  const box = h("div", { class: "price" }, h("strong", {}, fmt(p.price, cur)));
  if (p.oldPrice && p.oldPrice > p.price) {
    box.append(h("s", {}, fmt(p.oldPrice, cur)));
    box.append(h("span", { class: "badge" },
      `خصم ${Math.round((1 - p.price / p.oldPrice) * 100)}%`));
  }
  return box;
}

function card(p, cur) {
  return h("a", { class: "card", href: `product.html?id=${encodeURIComponent(p.id)}` },
    media(p),
    h("div", { class: "card-body" },
      h("h3", {}, p.name),
      p.short ? h("p", {}, p.short) : "",
      priceBlock(p, cur)));
}

function waLink(store, text) {
  const num = String(store.whatsapp || "").replace(/\D/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function renderProduct(p, store, all) {
  document.title = `${p.name} | ${store.name}`;
  const main = $("#product");
  main.replaceChildren();

  const gal = h("div", { class: "gallery" });
  const stage = h("div", { id: "stage" }, media(p, 0));
  gal.append(stage);
  if (p.images && p.images.length > 1) {
    const thumbs = h("div", { class: "thumbs" });
    p.images.forEach((src, i) => {
      const b = h("button", { type: "button", "aria-label": `صورة ${i + 1}`, "aria-current": i === 0 },
        h("img", { src, alt: "" }));
      b.addEventListener("click", () => {
        stage.replaceChildren(media(p, i));
        thumbs.querySelectorAll("button").forEach(x => x.setAttribute("aria-current", "false"));
        b.setAttribute("aria-current", "true");
      });
      thumbs.append(b);
    });
    gal.append(thumbs);
  }

  const msg = `مرحباً، أريد طلب: ${p.name} (${fmt(p.price, store.currency)})`;
  const buy = h("a", { class: "btn buy", href: waLink(store, msg), target: "_blank", rel: "noopener" },
    "اطلب عبر واتساب");

  const info = h("div", { class: "info" },
    h("h1", {}, p.name),
    priceBlock(p, store.currency),
    h("p", { class: "desc" }, p.description || ""),
    (p.features && p.features.length)
      ? h("ul", { class: "features" }, p.features.map(f => h("li", {}, f))) : "",
    h("div", { class: "buy-bar" }, buy));

  main.append(h("div", { class: "pdp" }, gal, info));
  document.body.classList.add("has-bar");

  const others = all.filter(x => x.id !== p.id);
  if (others.length) {
    $("#more-title").hidden = false;
    $("#more").replaceChildren(...others.map(x => card(x, store.currency)));
  }
}

async function init() {
  let data;
  try {
    const r = await fetch("products.json", { cache: "no-cache" });
    data = await r.json();
  } catch (e) {
    const box = $("#grid") || $("#product");
    box.replaceChildren(h("p", { class: "empty" },
      "تعذّر تحميل المنتجات. تأكد أن الملف products.json موجود وصيغته صحيحة."));
    return;
  }
  const { store, products } = data;

  $("#brand").textContent = store.name;
  $("#foot-name").textContent = `© ${new Date().getFullYear()} ${store.name}`;
  $("#wa-top").href = waLink(store, `مرحباً ${store.name}`);

  if ($("#grid")) {
    document.title = store.name;
    $("#hero-title").textContent = store.name;
    $("#hero-tagline").textContent = store.tagline || "";
    $("#grid").replaceChildren(...(products.length
      ? products.map(p => card(p, store.currency))
      : [h("p", { class: "empty" }, "لا توجد منتجات بعد. أضف منتجاً في products.json.")]));
  }

  if ($("#product")) {
    const id = new URLSearchParams(location.search).get("id");
    const p = products.find(x => x.id === id);
    if (p) renderProduct(p, store, products);
    else $("#product").replaceChildren(h("p", { class: "empty" },
      "المنتج غير موجود. ", h("a", { href: "index.html" }, "العودة للمتجر")));
  }
}
init();
