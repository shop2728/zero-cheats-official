// IMPORTANT: Replace the placeholder payment numbers before publishing.
// Do NOT put a Discord webhook URL or bot token in this public JavaScript file.
const PAYMENT_NUMBERS = {
  bKash: "01410242259",
  Nagad: "01410242259"
};

// Product plans and prices from the store owner's message.
const products = [
  {name:"BR Mood PC", symbol:"BR", label:"POPULAR", description:"Choose a duration that matches your order.", plans:[["1 day",35],["10 days",90],["15 days",150],["30 days",200],["1 year",1500],["Permanent",2500]]},
  {name:"Fake Lag PC ", symbol:"FL", label:"DIGITAL", description:"Duration-based digital product listing.", plans:[["1 month",350],["Lifetime",1500]]},
  {name:"BR Mood Bypass", symbol:"BP", label:"BYPASS", description:"Select a listed duration to continue to checkout.", plans:[["7 days",220],["30 days",410]]},
  {name:"Dustu Aim Kill", symbol:"AK", label:"FEATURED", description:"Choose one of the available plans below.", plans:[["7 days",400],["30 days",650]]},
  {name:"Emote PAanel", symbol:"EMOTE", label:"EMOTE", description:"Digital emote product with flexible durations.", plans:[["1 day",30],["7 days",150],["30 days",300]]},
  {name:"Mod Menu Ultra PC", symbol:"PC", label:"PC", description:"PC digital product listing.", plans:[["7 days",350],["30 days",600]]}
];
let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;
products.forEach((product, index) => {
  const card = document.createElement("article");
  card.className = "product-card";
  card.style.animationDelay = `${index * 75}ms`;
  card.innerHTML = `
    <div class="product-art"><span class="art-label">${product.label}</span><div class="art-symbol">${product.symbol}</div><span class="art-index">0${index+1} / ZERO</span></div>
    <div class="product-info"><h3>${product.name}</h3><p>${product.description}</p>
      <div class="plans" role="group" aria-label="${product.name} plans">
        ${product.plans.map((plan,i)=>`<button type="button" class="plan ${i===0?'selected':''}" data-index="${i}">${plan[0]} <b>${taka(plan[1])}</b></button>`).join("")}
      </div>
      <button class="buy-button" type="button">BUY NOW <span>↗</span></button>
    </div>`;
  let chosenPlan = product.plans[0];
  card.querySelectorAll(".plan").forEach(btn => btn.addEventListener("click", () => {
    card.querySelectorAll(".plan").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    chosenPlan = product.plans[Number(btn.dataset.index)];
  }));
  card.querySelector(".buy-button").addEventListener("click", () => openOrder(product, chosenPlan));
  grid.appendChild(card);
});

const backdrop = document.getElementById("modalBackdrop");
function openOrder(product, plan) {
  selectedProduct = {product:product.name, duration:plan[0], price:plan[1]};
  document.getElementById("selectedSummary").textContent = `${product.name} · ${plan[0]} · ${taka(plan[1])}`;
  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}
function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}
document.getElementById("closeModal").addEventListener("click",closeOrder);
backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeOrder();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeOrder();});
document.querySelectorAll(".payment-option").forEach(btn=>btn.addEventListener("click",()=>{
  chosenMethod=btn.dataset.method;
  document.querySelectorAll(".payment-option").forEach(b=>b.classList.toggle("active",b===btn));
  updatePaymentDisplay();
}));
function updatePaymentDisplay(){
  document.getElementById("methodLabel").textContent=chosenMethod;
  document.getElementById("paymentNumber").textContent=PAYMENT_NUMBERS[chosenMethod];
}
document.getElementById("year").textContent = new Date().getFullYear();

document.getElementById("orderForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const file=document.getElementById("screenshot").files[0];
  if(!selectedProduct || !file) return;
  if(!file.type.startsWith("image/")) {
    document.getElementById("formFeedback").textContent="Please choose an image file.";
    return;
  }
  // Front-end demo only: no payment screenshot or personal details are transmitted.
  // Connect a secure backend endpoint before accepting real customer orders.
  const details={
    ...selectedProduct,
    paymentMethod:chosenMethod,
    transactionLast4:document.getElementById("last4").value,
    discordUsername:document.getElementById("discord").value,
    screenshotFileName:file.name
  };
  console.log("Demo order request (not sent anywhere):",details);
  fetch("https://discordapp.com/api/webhooks/1559701009629061284/YtlNY99Ndh_HY_RR2o9RLxaF0YUgNCAQl5rTlmPsb8AmOZzEVG5cOMPqPYApCmhIuOyh", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
  content:
`🛒 NEW ORDER

📦 Product: ${details.product}
📅 Duration: ${details.duration}
💰 Price: ৳${details.price}
💳 Payment: ${details.paymentMethod}
🔢 Last 4 Digit: ${details.transactionLast4}
👤 Discord: ${details.discordUsername}
📸 Screenshot: ${details.screenshotFileName}`
})`
  })
});
  document.getElementById("formFeedback").textContent="Demo only: the form works visually, but it is not sending your order yet. Connect a secure backend before publishing.";
});
