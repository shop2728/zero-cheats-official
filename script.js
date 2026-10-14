const PAYMENT_NUMBERS = {
  bKash: "01309079852",
  Nagad: "....." // এখানে আসল Nagad নম্বর বসাবি
};

const ORDER_ENDPOINT = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const products = [
  {
    name: "BR Mood PC", symbol: "BR", label: "POPULAR",
    description: "Choose a duration that matches your order.",
    plans: [["1 day", 35], ["10 days", 90], ["15 days", 150], ["30 days", 200], ["1 year", 1500], ["Permanent", 2500]]
  },
  {
    name: "Fake Lag PC ", symbol: "FL", label: "DIGITAL",
    description: "Duration-based digital product listing.",
    plans: [["1 month", 350], ["Lifetime", 1500]]
  },
  {
    name: "BR Mood Bypass", symbol: "BP", label: "BYPASS",
    description: "Select a listed duration to continue to checkout.",
    plans: [["7 days", 220], ["30 days", 410]]
  },
  {
    name: "Dustu Aim Kill", symbol: "AK", label: "FEATURED",
    description: "Choose one of the available plans below.",
    plans: [["7 days", 400], ["30 days", 650]]
  },
  {
    name: "Emote PAanel", symbol: "EMOTE", label: "EMOTE",
    description: "Digital emote product with flexible durations.",
    plans: [["1 day", 30], ["7 days", 150], ["30 days", 300]]
  },
  {
    name: "Mod Menu Ultra PC", symbol: "PC", label: "PC",
    description: "PC digital product listing.",
    plans: [["7 days", 350], ["30 days", 600]]
  }
];

let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;

// Product cards
if (grid) {
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${index * 75}ms`;

    card.innerHTML = `
      <div class="product-art">
        <span class="art-label">${product.label}</span>
        <div class="art-symbol">${product.symbol}</div>
        <span class="art-index">0${index + 1} / ZERO</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="plans" role="group" aria-label="${product.name} plans">
          ${product.plans.map((plan, i) => `
            <button type="button"
              class="plan ${i === 0 ? "selected" : ""}"
              data-index="${i}">
              ${plan[0]} <b>${taka(plan[1])}</b>
            </button>
          `).join("")}
        </div>
        <button class="buy-button" type="button">
          BUY NOW <span>↗</span>
        </button>
      </div>
    `;

    let chosenPlan = product.plans[0];

    card.querySelectorAll(".plan").forEach(btn => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".plan").forEach(b =>
          b.classList.remove("selected")
        );
        btn.classList.add("selected");
        chosenPlan = product.plans[Number(btn.dataset.index)];
      });
    });

    card.querySelector(".buy-button").addEventListener("click", () => {
      openOrder(product, chosenPlan);
    });

    grid.appendChild(card);
  });
}

// Order modal
const backdrop = document.getElementById("modalBackdrop");

function openOrder(product, plan) {
  selectedProduct = {
    product: product.name.trim(),
    duration: plan[0],
    price: plan[1]
  };

  document.getElementById("selectedSummary").textContent =
    `${selectedProduct.product} · ${plan[0]} · ${taka(plan[1])}`;

  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}

function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeOrder);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeOrder();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOrder();
});

// Payment method buttons
document.querySelectorAll(".payment-option").forEach(btn => {
  btn.addEventListener("click", () => {
    chosenMethod = btn.dataset.method;

    document.querySelectorAll(".payment-option").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    updatePaymentDisplay();
  });
});

function updatePaymentDisplay() {
  document.getElementById("methodLabel").textContent = chosenMethod;
  document.getElementById("paymentNumber").textContent =
    PAYMENT_NUMBERS[chosenMethod] || "";
}

document.getElementById("year").textContent =
  new Date().getFullYear();

// Order form + screenshot upload through the secure backend
document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();

  const feedback = document.getElementById("formFeedback");
  const submitButton = e.submitter ||
    document.querySelector('#orderForm button[type="submit"]');
  const file = document.getElementById("screenshot").files[0];

  if (!selectedProduct) {
    feedback.textContent = "Please select a product first.";
    return;
  }

  if (!file) {
    feedback.textContent = "Please upload your payment screenshot.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    feedback.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedback.textContent = "Image must be 5 MB or smaller.";
    return;
  }

  const last4 = document.getElementById("last4").value.trim();
  const discord = document.getElementById("discord").value.trim();

  if (!/^\d{4}$/.test(last4)) {
    feedback.textContent = "Enter the last 4 transaction digits.";
    return;
  }

  if (!discord) {
    feedback.textContent = "Enter your Discord username.";
    return;
  }

  if (ORDER_ENDPOINT.includes("YOUR-WORKER-NAME")) {
    feedback.textContent =
      "Backend setup is not complete yet. Please try again later.";
    return;
  }

  const formData = new FormData();
  formData.append("product", selectedProduct.product);
  formData.append("duration", selectedProduct.duration);
  formData.append("price", String(selectedProduct.price));
  formData.append("paymentMethod", chosenMethod);
  formData.append("transactionLast4", last4);
  formData.append("discordUsername", discord);
  formData.append("screenshot", file, file.name);

  try {
    feedback.textContent = "Sending your order...";
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order submission failed.");
    }

    feedback.textContent = "Order submitted successfully!";
    document.getElementById("orderForm").reset();
    selectedProduct = null;
  } catch (error) {
    console.error("Order submission error:", error);
    feedback.textContent =
      "Order could not be sent. Please try again later.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Copy payment number
const copyBtn = document.getElementById("copyPaymentNumber");
const copyFeedback = document.getElementById("copyFeedback");

if (copyBtn && copyFeedback) {
  copyBtn.addEventListener("click", async () => {
    const number = document.getElementById("paymentNumber")
      .textContent.trim();

    if (!number || number === "....." || number.includes("ADD_YOUR_")) {
      copyFeedback.textContent = "Payment number not set!";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const input = document.createElement("textarea");
        input.value = number;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        const success = document.execCommand("copy");
        input.remove();

        if (!success) throw new Error("Copy failed");
      }

      copyBtn.textContent = "COPIED ✓";
      copyFeedback.textContent = "Number copied successfully!";

      setTimeout(() => {
        copyBtn.textContent = "COPY";
      }, 2000);
    } catch (error) {
      copyFeedback.textContent =
        "Copy failed! Please copy the number manually.";
    }
  });
}const PAYMENT_NUMBERS = {
  bKash: "01309079852",
  Nagad: "....." // এখানে আসল Nagad নম্বর বসাবি
};

const ORDER_ENDPOINT = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const products = [
  {
    name: "BR Mood PC", symbol: "BR", label: "POPULAR",
    description: "Choose a duration that matches your order.",
    plans: [["1 day", 35], ["10 days", 90], ["15 days", 150], ["30 days", 200], ["1 year", 1500], ["Permanent", 2500]]
  },
  {
    name: "Fake Lag PC ", symbol: "FL", label: "DIGITAL",
    description: "Duration-based digital product listing.",
    plans: [["1 month", 350], ["Lifetime", 1500]]
  },
  {
    name: "BR Mood Bypass", symbol: "BP", label: "BYPASS",
    description: "Select a listed duration to continue to checkout.",
    plans: [["7 days", 220], ["30 days", 410]]
  },
  {
    name: "Dustu Aim Kill", symbol: "AK", label: "FEATURED",
    description: "Choose one of the available plans below.",
    plans: [["7 days", 400], ["30 days", 650]]
  },
  {
    name: "Emote PAanel", symbol: "EMOTE", label: "EMOTE",
    description: "Digital emote product with flexible durations.",
    plans: [["1 day", 30], ["7 days", 150], ["30 days", 300]]
  },
  {
    name: "Mod Menu Ultra PC", symbol: "PC", label: "PC",
    description: "PC digital product listing.",
    plans: [["7 days", 350], ["30 days", 600]]
  }
];

let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;

// Product cards
if (grid) {
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${index * 75}ms`;

    card.innerHTML = `
      <div class="product-art">
        <span class="art-label">${product.label}</span>
        <div class="art-symbol">${product.symbol}</div>
        <span class="art-index">0${index + 1} / ZERO</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="plans" role="group" aria-label="${product.name} plans">
          ${product.plans.map((plan, i) => `
            <button type="button"
              class="plan ${i === 0 ? "selected" : ""}"
              data-index="${i}">
              ${plan[0]} <b>${taka(plan[1])}</b>
            </button>
          `).join("")}
        </div>
        <button class="buy-button" type="button">
          BUY NOW <span>↗</span>
        </button>
      </div>
    `;

    let chosenPlan = product.plans[0];

    card.querySelectorAll(".plan").forEach(btn => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".plan").forEach(b =>
          b.classList.remove("selected")
        );
        btn.classList.add("selected");
        chosenPlan = product.plans[Number(btn.dataset.index)];
      });
    });

    card.querySelector(".buy-button").addEventListener("click", () => {
      openOrder(product, chosenPlan);
    });

    grid.appendChild(card);
  });
}

// Order modal
const backdrop = document.getElementById("modalBackdrop");

function openOrder(product, plan) {
  selectedProduct = {
    product: product.name.trim(),
    duration: plan[0],
    price: plan[1]
  };

  document.getElementById("selectedSummary").textContent =
    `${selectedProduct.product} · ${plan[0]} · ${taka(plan[1])}`;

  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}

function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeOrder);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeOrder();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOrder();
});

// Payment method buttons
document.querySelectorAll(".payment-option").forEach(btn => {
  btn.addEventListener("click", () => {
    chosenMethod = btn.dataset.method;

    document.querySelectorAll(".payment-option").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    updatePaymentDisplay();
  });
});

function updatePaymentDisplay() {
  document.getElementById("methodLabel").textContent = chosenMethod;
  document.getElementById("paymentNumber").textContent =
    PAYMENT_NUMBERS[chosenMethod] || "";
}

document.getElementById("year").textContent =
  new Date().getFullYear();

// Order form + screenshot upload through the secure backend
document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();

  const feedback = document.getElementById("formFeedback");
  const submitButton = e.submitter ||
    document.querySelector('#orderForm button[type="submit"]');
  const file = document.getElementById("screenshot").files[0];

  if (!selectedProduct) {
    feedback.textContent = "Please select a product first.";
    return;
  }

  if (!file) {
    feedback.textContent = "Please upload your payment screenshot.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    feedback.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedback.textContent = "Image must be 5 MB or smaller.";
    return;
  }

  const last4 = document.getElementById("last4").value.trim();
  const discord = document.getElementById("discord").value.trim();

  if (!/^\d{4}$/.test(last4)) {
    feedback.textContent = "Enter the last 4 transaction digits.";
    return;
  }

  if (!discord) {
    feedback.textContent = "Enter your Discord username.";
    return;
  }

  if (ORDER_ENDPOINT.includes("YOUR-WORKER-NAME")) {
    feedback.textContent =
      "Backend setup is not complete yet. Please try again later.";
    return;
  }

  const formData = new FormData();
  formData.append("product", selectedProduct.product);
  formData.append("duration", selectedProduct.duration);
  formData.append("price", String(selectedProduct.price));
  formData.append("paymentMethod", chosenMethod);
  formData.append("transactionLast4", last4);
  formData.append("discordUsername", discord);
  formData.append("screenshot", file, file.name);

  try {
    feedback.textContent = "Sending your order...";
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order submission failed.");
    }

    feedback.textContent = "Order submitted successfully!";
    document.getElementById("orderForm").reset();
    selectedProduct = null;
  } catch (error) {
    console.error("Order submission error:", error);
    feedback.textContent =
      "Order could not be sent. Please try again later.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Copy payment number
const copyBtn = document.getElementById("copyPaymentNumber");
const copyFeedback = document.getElementById("copyFeedback");

if (copyBtn && copyFeedback) {
  copyBtn.addEventListener("click", async () => {
    const number = document.getElementById("paymentNumber")
      .textContent.trim();

    if (!number || number === "....." || number.includes("ADD_YOUR_")) {
      copyFeedback.textContent = "Payment number not set!";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const input = document.createElement("textarea");
        input.value = number;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        const success = document.execCommand("copy");
        input.remove();

        if (!success) throw new Error("Copy failed");
      }

      copyBtn.textContent = "COPIED ✓";
      copyFeedback.textContent = "Number copied successfully!";

      setTimeout(() => {
        copyBtn.textContent = "COPY";
      }, 2000);
    } catch (error) {
      copyFeedback.textContent =
        "Copy failed! Please copy the number manually.";
    }
  });
}const PAYMENT_NUMBERS = {
  bKash: "01309079852",
  Nagad: "....." // এখানে আসল Nagad নম্বর বসাবি
};

const ORDER_ENDPOINT = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const products = [
  {
    name: "BR Mood PC", symbol: "BR", label: "POPULAR",
    description: "Choose a duration that matches your order.",
    plans: [["1 day", 35], ["10 days", 90], ["15 days", 150], ["30 days", 200], ["1 year", 1500], ["Permanent", 2500]]
  },
  {
    name: "Fake Lag PC ", symbol: "FL", label: "DIGITAL",
    description: "Duration-based digital product listing.",
    plans: [["1 month", 350], ["Lifetime", 1500]]
  },
  {
    name: "BR Mood Bypass", symbol: "BP", label: "BYPASS",
    description: "Select a listed duration to continue to checkout.",
    plans: [["7 days", 220], ["30 days", 410]]
  },
  {
    name: "Dustu Aim Kill", symbol: "AK", label: "FEATURED",
    description: "Choose one of the available plans below.",
    plans: [["7 days", 400], ["30 days", 650]]
  },
  {
    name: "Emote PAanel", symbol: "EMOTE", label: "EMOTE",
    description: "Digital emote product with flexible durations.",
    plans: [["1 day", 30], ["7 days", 150], ["30 days", 300]]
  },
  {
    name: "Mod Menu Ultra PC", symbol: "PC", label: "PC",
    description: "PC digital product listing.",
    plans: [["7 days", 350], ["30 days", 600]]
  }
];

let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;

// Product cards
if (grid) {
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${index * 75}ms`;

    card.innerHTML = `
      <div class="product-art">
        <span class="art-label">${product.label}</span>
        <div class="art-symbol">${product.symbol}</div>
        <span class="art-index">0${index + 1} / ZERO</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="plans" role="group" aria-label="${product.name} plans">
          ${product.plans.map((plan, i) => `
            <button type="button"
              class="plan ${i === 0 ? "selected" : ""}"
              data-index="${i}">
              ${plan[0]} <b>${taka(plan[1])}</b>
            </button>
          `).join("")}
        </div>
        <button class="buy-button" type="button">
          BUY NOW <span>↗</span>
        </button>
      </div>
    `;

    let chosenPlan = product.plans[0];

    card.querySelectorAll(".plan").forEach(btn => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".plan").forEach(b =>
          b.classList.remove("selected")
        );
        btn.classList.add("selected");
        chosenPlan = product.plans[Number(btn.dataset.index)];
      });
    });

    card.querySelector(".buy-button").addEventListener("click", () => {
      openOrder(product, chosenPlan);
    });

    grid.appendChild(card);
  });
}

// Order modal
const backdrop = document.getElementById("modalBackdrop");

function openOrder(product, plan) {
  selectedProduct = {
    product: product.name.trim(),
    duration: plan[0],
    price: plan[1]
  };

  document.getElementById("selectedSummary").textContent =
    `${selectedProduct.product} · ${plan[0]} · ${taka(plan[1])}`;

  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}

function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeOrder);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeOrder();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOrder();
});

// Payment method buttons
document.querySelectorAll(".payment-option").forEach(btn => {
  btn.addEventListener("click", () => {
    chosenMethod = btn.dataset.method;

    document.querySelectorAll(".payment-option").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    updatePaymentDisplay();
  });
});

function updatePaymentDisplay() {
  document.getElementById("methodLabel").textContent = chosenMethod;
  document.getElementById("paymentNumber").textContent =
    PAYMENT_NUMBERS[chosenMethod] || "";
}

document.getElementById("year").textContent =
  new Date().getFullYear();

// Order form + screenshot upload through the secure backend
document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();

  const feedback = document.getElementById("formFeedback");
  const submitButton = e.submitter ||
    document.querySelector('#orderForm button[type="submit"]');
  const file = document.getElementById("screenshot").files[0];

  if (!selectedProduct) {
    feedback.textContent = "Please select a product first.";
    return;
  }

  if (!file) {
    feedback.textContent = "Please upload your payment screenshot.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    feedback.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedback.textContent = "Image must be 5 MB or smaller.";
    return;
  }

  const last4 = document.getElementById("last4").value.trim();
  const discord = document.getElementById("discord").value.trim();

  if (!/^\d{4}$/.test(last4)) {
    feedback.textContent = "Enter the last 4 transaction digits.";
    return;
  }

  if (!discord) {
    feedback.textContent = "Enter your Discord username.";
    return;
  }

  if (ORDER_ENDPOINT.includes("YOUR-WORKER-NAME")) {
    feedback.textContent =
      "Backend setup is not complete yet. Please try again later.";
    return;
  }

  const formData = new FormData();
  formData.append("product", selectedProduct.product);
  formData.append("duration", selectedProduct.duration);
  formData.append("price", String(selectedProduct.price));
  formData.append("paymentMethod", chosenMethod);
  formData.append("transactionLast4", last4);
  formData.append("discordUsername", discord);
  formData.append("screenshot", file, file.name);

  try {
    feedback.textContent = "Sending your order...";
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order submission failed.");
    }

    feedback.textContent = "Order submitted successfully!";
    document.getElementById("orderForm").reset();
    selectedProduct = null;
  } catch (error) {
    console.error("Order submission error:", error);
    feedback.textContent =
      "Order could not be sent. Please try again later.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Copy payment number
const copyBtn = document.getElementById("copyPaymentNumber");
const copyFeedback = document.getElementById("copyFeedback");

if (copyBtn && copyFeedback) {
  copyBtn.addEventListener("click", async () => {
    const number = document.getElementById("paymentNumber")
      .textContent.trim();

    if (!number || number === "....." || number.includes("ADD_YOUR_")) {
      copyFeedback.textContent = "Payment number not set!";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const input = document.createElement("textarea");
        input.value = number;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        const success = document.execCommand("copy");
        input.remove();

        if (!success) throw new Error("Copy failed");
      }

      copyBtn.textContent = "COPIED ✓";
      copyFeedback.textContent = "Number copied successfully!";

      setTimeout(() => {
        copyBtn.textContent = "COPY";
      }, 2000);
    } catch (error) {
      copyFeedback.textContent =
        "Copy failed! Please copy the number manually.";
    }
  });
}const PAYMENT_NUMBERS = {
  bKash: "01309079852",
  Nagad: "....." // এখানে আসল Nagad নম্বর বসাবি
};

const ORDER_ENDPOINT = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const products = [
  {
    name: "BR Mood PC", symbol: "BR", label: "POPULAR",
    description: "Choose a duration that matches your order.",
    plans: [["1 day", 35], ["10 days", 90], ["15 days", 150], ["30 days", 200], ["1 year", 1500], ["Permanent", 2500]]
  },
  {
    name: "Fake Lag PC ", symbol: "FL", label: "DIGITAL",
    description: "Duration-based digital product listing.",
    plans: [["1 month", 350], ["Lifetime", 1500]]
  },
  {
    name: "BR Mood Bypass", symbol: "BP", label: "BYPASS",
    description: "Select a listed duration to continue to checkout.",
    plans: [["7 days", 220], ["30 days", 410]]
  },
  {
    name: "Dustu Aim Kill", symbol: "AK", label: "FEATURED",
    description: "Choose one of the available plans below.",
    plans: [["7 days", 400], ["30 days", 650]]
  },
  {
    name: "Emote PAanel", symbol: "EMOTE", label: "EMOTE",
    description: "Digital emote product with flexible durations.",
    plans: [["1 day", 30], ["7 days", 150], ["30 days", 300]]
  },
  {
    name: "Mod Menu Ultra PC", symbol: "PC", label: "PC",
    description: "PC digital product listing.",
    plans: [["7 days", 350], ["30 days", 600]]
  }
];

let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;

// Product cards
if (grid) {
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${index * 75}ms`;

    card.innerHTML = `
      <div class="product-art">
        <span class="art-label">${product.label}</span>
        <div class="art-symbol">${product.symbol}</div>
        <span class="art-index">0${index + 1} / ZERO</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="plans" role="group" aria-label="${product.name} plans">
          ${product.plans.map((plan, i) => `
            <button type="button"
              class="plan ${i === 0 ? "selected" : ""}"
              data-index="${i}">
              ${plan[0]} <b>${taka(plan[1])}</b>
            </button>
          `).join("")}
        </div>
        <button class="buy-button" type="button">
          BUY NOW <span>↗</span>
        </button>
      </div>
    `;

    let chosenPlan = product.plans[0];

    card.querySelectorAll(".plan").forEach(btn => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".plan").forEach(b =>
          b.classList.remove("selected")
        );
        btn.classList.add("selected");
        chosenPlan = product.plans[Number(btn.dataset.index)];
      });
    });

    card.querySelector(".buy-button").addEventListener("click", () => {
      openOrder(product, chosenPlan);
    });

    grid.appendChild(card);
  });
}

// Order modal
const backdrop = document.getElementById("modalBackdrop");

function openOrder(product, plan) {
  selectedProduct = {
    product: product.name.trim(),
    duration: plan[0],
    price: plan[1]
  };

  document.getElementById("selectedSummary").textContent =
    `${selectedProduct.product} · ${plan[0]} · ${taka(plan[1])}`;

  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}

function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeOrder);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeOrder();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOrder();
});

// Payment method buttons
document.querySelectorAll(".payment-option").forEach(btn => {
  btn.addEventListener("click", () => {
    chosenMethod = btn.dataset.method;

    document.querySelectorAll(".payment-option").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    updatePaymentDisplay();
  });
});

function updatePaymentDisplay() {
  document.getElementById("methodLabel").textContent = chosenMethod;
  document.getElementById("paymentNumber").textContent =
    PAYMENT_NUMBERS[chosenMethod] || "";
}

document.getElementById("year").textContent =
  new Date().getFullYear();

// Order form + screenshot upload through the secure backend
document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();

  const feedback = document.getElementById("formFeedback");
  const submitButton = e.submitter ||
    document.querySelector('#orderForm button[type="submit"]');
  const file = document.getElementById("screenshot").files[0];

  if (!selectedProduct) {
    feedback.textContent = "Please select a product first.";
    return;
  }

  if (!file) {
    feedback.textContent = "Please upload your payment screenshot.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    feedback.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedback.textContent = "Image must be 5 MB or smaller.";
    return;
  }

  const last4 = document.getElementById("last4").value.trim();
  const discord = document.getElementById("discord").value.trim();

  if (!/^\d{4}$/.test(last4)) {
    feedback.textContent = "Enter the last 4 transaction digits.";
    return;
  }

  if (!discord) {
    feedback.textContent = "Enter your Discord username.";
    return;
  }

  if (ORDER_ENDPOINT.includes("YOUR-WORKER-NAME")) {
    feedback.textContent =
      "Backend setup is not complete yet. Please try again later.";
    return;
  }

  const formData = new FormData();
  formData.append("product", selectedProduct.product);
  formData.append("duration", selectedProduct.duration);
  formData.append("price", String(selectedProduct.price));
  formData.append("paymentMethod", chosenMethod);
  formData.append("transactionLast4", last4);
  formData.append("discordUsername", discord);
  formData.append("screenshot", file, file.name);

  try {
    feedback.textContent = "Sending your order...";
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order submission failed.");
    }

    feedback.textContent = "Order submitted successfully!";
    document.getElementById("orderForm").reset();
    selectedProduct = null;
  } catch (error) {
    console.error("Order submission error:", error);
    feedback.textContent =
      "Order could not be sent. Please try again later.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Copy payment number
const copyBtn = document.getElementById("copyPaymentNumber");
const copyFeedback = document.getElementById("copyFeedback");

if (copyBtn && copyFeedback) {
  copyBtn.addEventListener("click", async () => {
    const number = document.getElementById("paymentNumber")
      .textContent.trim();

    if (!number || number === "....." || number.includes("ADD_YOUR_")) {
      copyFeedback.textContent = "Payment number not set!";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const input = document.createElement("textarea");
        input.value = number;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        const success = document.execCommand("copy");
        input.remove();

        if (!success) throw new Error("Copy failed");
      }

      copyBtn.textContent = "COPIED ✓";
      copyFeedback.textContent = "Number copied successfully!";

      setTimeout(() => {
        copyBtn.textContent = "COPY";
      }, 2000);
    } catch (error) {
      copyFeedback.textContent =
        "Copy failed! Please copy the number manually.";
    }
  });
}const PAYMENT_NUMBERS = {
  bKash: "01309079852",
  Nagad: "....." // এখানে আসল Nagad নম্বর বসাবি
};

const ORDER_ENDPOINT = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const products = [
  {
    name: "BR Mood PC", symbol: "BR", label: "POPULAR",
    description: "Choose a duration that matches your order.",
    plans: [["1 day", 35], ["10 days", 90], ["15 days", 150], ["30 days", 200], ["1 year", 1500], ["Permanent", 2500]]
  },
  {
    name: "Fake Lag PC ", symbol: "FL", label: "DIGITAL",
    description: "Duration-based digital product listing.",
    plans: [["1 month", 350], ["Lifetime", 1500]]
  },
  {
    name: "BR Mood Bypass", symbol: "BP", label: "BYPASS",
    description: "Select a listed duration to continue to checkout.",
    plans: [["7 days", 220], ["30 days", 410]]
  },
  {
    name: "Dustu Aim Kill", symbol: "AK", label: "FEATURED",
    description: "Choose one of the available plans below.",
    plans: [["7 days", 400], ["30 days", 650]]
  },
  {
    name: "Emote PAanel", symbol: "EMOTE", label: "EMOTE",
    description: "Digital emote product with flexible durations.",
    plans: [["1 day", 30], ["7 days", 150], ["30 days", 300]]
  },
  {
    name: "Mod Menu Ultra PC", symbol: "PC", label: "PC",
    description: "PC digital product listing.",
    plans: [["7 days", 350], ["30 days", 600]]
  }
];

let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;

// Product cards
if (grid) {
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${index * 75}ms`;

    card.innerHTML = `
      <div class="product-art">
        <span class="art-label">${product.label}</span>
        <div class="art-symbol">${product.symbol}</div>
        <span class="art-index">0${index + 1} / ZERO</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="plans" role="group" aria-label="${product.name} plans">
          ${product.plans.map((plan, i) => `
            <button type="button"
              class="plan ${i === 0 ? "selected" : ""}"
              data-index="${i}">
              ${plan[0]} <b>${taka(plan[1])}</b>
            </button>
          `).join("")}
        </div>
        <button class="buy-button" type="button">
          BUY NOW <span>↗</span>
        </button>
      </div>
    `;

    let chosenPlan = product.plans[0];

    card.querySelectorAll(".plan").forEach(btn => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".plan").forEach(b =>
          b.classList.remove("selected")
        );
        btn.classList.add("selected");
        chosenPlan = product.plans[Number(btn.dataset.index)];
      });
    });

    card.querySelector(".buy-button").addEventListener("click", () => {
      openOrder(product, chosenPlan);
    });

    grid.appendChild(card);
  });
}

// Order modal
const backdrop = document.getElementById("modalBackdrop");

function openOrder(product, plan) {
  selectedProduct = {
    product: product.name.trim(),
    duration: plan[0],
    price: plan[1]
  };

  document.getElementById("selectedSummary").textContent =
    `${selectedProduct.product} · ${plan[0]} · ${taka(plan[1])}`;

  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}

function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeOrder);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeOrder();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOrder();
});

// Payment method buttons
document.querySelectorAll(".payment-option").forEach(btn => {
  btn.addEventListener("click", () => {
    chosenMethod = btn.dataset.method;

    document.querySelectorAll(".payment-option").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    updatePaymentDisplay();
  });
});

function updatePaymentDisplay() {
  document.getElementById("methodLabel").textContent = chosenMethod;
  document.getElementById("paymentNumber").textContent =
    PAYMENT_NUMBERS[chosenMethod] || "";
}

document.getElementById("year").textContent =
  new Date().getFullYear();

// Order form + screenshot upload through the secure backend
document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();

  const feedback = document.getElementById("formFeedback");
  const submitButton = e.submitter ||
    document.querySelector('#orderForm button[type="submit"]');
  const file = document.getElementById("screenshot").files[0];

  if (!selectedProduct) {
    feedback.textContent = "Please select a product first.";
    return;
  }

  if (!file) {
    feedback.textContent = "Please upload your payment screenshot.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    feedback.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedback.textContent = "Image must be 5 MB or smaller.";
    return;
  }

  const last4 = document.getElementById("last4").value.trim();
  const discord = document.getElementById("discord").value.trim();

  if (!/^\d{4}$/.test(last4)) {
    feedback.textContent = "Enter the last 4 transaction digits.";
    return;
  }

  if (!discord) {
    feedback.textContent = "Enter your Discord username.";
    return;
  }

  if (ORDER_ENDPOINT.includes("YOUR-WORKER-NAME")) {
    feedback.textContent =
      "Backend setup is not complete yet. Please try again later.";
    return;
  }

  const formData = new FormData();
  formData.append("product", selectedProduct.product);
  formData.append("duration", selectedProduct.duration);
  formData.append("price", String(selectedProduct.price));
  formData.append("paymentMethod", chosenMethod);
  formData.append("transactionLast4", last4);
  formData.append("discordUsername", discord);
  formData.append("screenshot", file, file.name);

  try {
    feedback.textContent = "Sending your order...";
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order submission failed.");
    }

    feedback.textContent = "Order submitted successfully!";
    document.getElementById("orderForm").reset();
    selectedProduct = null;
  } catch (error) {
    console.error("Order submission error:", error);
    feedback.textContent =
      "Order could not be sent. Please try again later.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Copy payment number
const copyBtn = document.getElementById("copyPaymentNumber");
const copyFeedback = document.getElementById("copyFeedback");

if (copyBtn && copyFeedback) {
  copyBtn.addEventListener("click", async () => {
    const number = document.getElementById("paymentNumber")
      .textContent.trim();

    if (!number || number === "....." || number.includes("ADD_YOUR_")) {
      copyFeedback.textContent = "Payment number not set!";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const input = document.createElement("textarea");
        input.value = number;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        const success = document.execCommand("copy");
        input.remove();

        if (!success) throw new Error("Copy failed");
      }

      copyBtn.textContent = "COPIED ✓";
      copyFeedback.textContent = "Number copied successfully!";

      setTimeout(() => {
        copyBtn.textContent = "COPY";
      }, 2000);
    } catch (error) {
      copyFeedback.textContent =
        "Copy failed! Please copy the number manually.";
    }
  });
}const PAYMENT_NUMBERS = {
  bKash: "01309079852",
  Nagad: "....." // এখানে আসল Nagad নম্বর বসাবি
};

const ORDER_ENDPOINT = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const products = [
  {
    name: "BR Mood PC", symbol: "BR", label: "POPULAR",
    description: "Choose a duration that matches your order.",
    plans: [["1 day", 35], ["10 days", 90], ["15 days", 150], ["30 days", 200], ["1 year", 1500], ["Permanent", 2500]]
  },
  {
    name: "Fake Lag PC ", symbol: "FL", label: "DIGITAL",
    description: "Duration-based digital product listing.",
    plans: [["1 month", 350], ["Lifetime", 1500]]
  },
  {
    name: "BR Mood Bypass", symbol: "BP", label: "BYPASS",
    description: "Select a listed duration to continue to checkout.",
    plans: [["7 days", 220], ["30 days", 410]]
  },
  {
    name: "Dustu Aim Kill", symbol: "AK", label: "FEATURED",
    description: "Choose one of the available plans below.",
    plans: [["7 days", 400], ["30 days", 650]]
  },
  {
    name: "Emote PAanel", symbol: "EMOTE", label: "EMOTE",
    description: "Digital emote product with flexible durations.",
    plans: [["1 day", 30], ["7 days", 150], ["30 days", 300]]
  },
  {
    name: "Mod Menu Ultra PC", symbol: "PC", label: "PC",
    description: "PC digital product listing.",
    plans: [["7 days", 350], ["30 days", 600]]
  }
];

let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;

// Product cards
if (grid) {
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${index * 75}ms`;

    card.innerHTML = `
      <div class="product-art">
        <span class="art-label">${product.label}</span>
        <div class="art-symbol">${product.symbol}</div>
        <span class="art-index">0${index + 1} / ZERO</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="plans" role="group" aria-label="${product.name} plans">
          ${product.plans.map((plan, i) => `
            <button type="button"
              class="plan ${i === 0 ? "selected" : ""}"
              data-index="${i}">
              ${plan[0]} <b>${taka(plan[1])}</b>
            </button>
          `).join("")}
        </div>
        <button class="buy-button" type="button">
          BUY NOW <span>↗</span>
        </button>
      </div>
    `;

    let chosenPlan = product.plans[0];

    card.querySelectorAll(".plan").forEach(btn => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".plan").forEach(b =>
          b.classList.remove("selected")
        );
        btn.classList.add("selected");
        chosenPlan = product.plans[Number(btn.dataset.index)];
      });
    });

    card.querySelector(".buy-button").addEventListener("click", () => {
      openOrder(product, chosenPlan);
    });

    grid.appendChild(card);
  });
}

// Order modal
const backdrop = document.getElementById("modalBackdrop");

function openOrder(product, plan) {
  selectedProduct = {
    product: product.name.trim(),
    duration: plan[0],
    price: plan[1]
  };

  document.getElementById("selectedSummary").textContent =
    `${selectedProduct.product} · ${plan[0]} · ${taka(plan[1])}`;

  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}

function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeOrder);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeOrder();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOrder();
});

// Payment method buttons
document.querySelectorAll(".payment-option").forEach(btn => {
  btn.addEventListener("click", () => {
    chosenMethod = btn.dataset.method;

    document.querySelectorAll(".payment-option").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    updatePaymentDisplay();
  });
});

function updatePaymentDisplay() {
  document.getElementById("methodLabel").textContent = chosenMethod;
  document.getElementById("paymentNumber").textContent =
    PAYMENT_NUMBERS[chosenMethod] || "";
}

document.getElementById("year").textContent =
  new Date().getFullYear();

// Order form + screenshot upload through the secure backend
document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();

  const feedback = document.getElementById("formFeedback");
  const submitButton = e.submitter ||
    document.querySelector('#orderForm button[type="submit"]');
  const file = document.getElementById("screenshot").files[0];

  if (!selectedProduct) {
    feedback.textContent = "Please select a product first.";
    return;
  }

  if (!file) {
    feedback.textContent = "Please upload your payment screenshot.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    feedback.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedback.textContent = "Image must be 5 MB or smaller.";
    return;
  }

  const last4 = document.getElementById("last4").value.trim();
  const discord = document.getElementById("discord").value.trim();

  if (!/^\d{4}$/.test(last4)) {
    feedback.textContent = "Enter the last 4 transaction digits.";
    return;
  }

  if (!discord) {
    feedback.textContent = "Enter your Discord username.";
    return;
  }

  if (ORDER_ENDPOINT.includes("YOUR-WORKER-NAME")) {
    feedback.textContent =
      "Backend setup is not complete yet. Please try again later.";
    return;
  }

  const formData = new FormData();
  formData.append("product", selectedProduct.product);
  formData.append("duration", selectedProduct.duration);
  formData.append("price", String(selectedProduct.price));
  formData.append("paymentMethod", chosenMethod);
  formData.append("transactionLast4", last4);
  formData.append("discordUsername", discord);
  formData.append("screenshot", file, file.name);

  try {
    feedback.textContent = "Sending your order...";
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order submission failed.");
    }

    feedback.textContent = "Order submitted successfully!";
    document.getElementById("orderForm").reset();
    selectedProduct = null;
  } catch (error) {
    console.error("Order submission error:", error);
    feedback.textContent =
      "Order could not be sent. Please try again later.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Copy payment number
const copyBtn = document.getElementById("copyPaymentNumber");
const copyFeedback = document.getElementById("copyFeedback");

if (copyBtn && copyFeedback) {
  copyBtn.addEventListener("click", async () => {
    const number = document.getElementById("paymentNumber")
      .textContent.trim();

    if (!number || number === "....." || number.includes("ADD_YOUR_")) {
      copyFeedback.textContent = "Payment number not set!";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const input = document.createElement("textarea");
        input.value = number;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        const success = document.execCommand("copy");
        input.remove();

        if (!success) throw new Error("Copy failed");
      }

      copyBtn.textContent = "COPIED ✓";
      copyFeedback.textContent = "Number copied successfully!";

      setTimeout(() => {
        copyBtn.textContent = "COPY";
      }, 2000);
    } catch (error) {
      copyFeedback.textContent =
        "Copy failed! Please copy the number manually.";
    }
  });
}const PAYMENT_NUMBERS = {
  bKash: "01309079852",
  Nagad: "....." // এখানে আসল Nagad নম্বর বসাবি
};

const ORDER_ENDPOINT = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const products = [
  {
    name: "BR Mood PC", symbol: "BR", label: "POPULAR",
    description: "Choose a duration that matches your order.",
    plans: [["1 day", 35], ["10 days", 90], ["15 days", 150], ["30 days", 200], ["1 year", 1500], ["Permanent", 2500]]
  },
  {
    name: "Fake Lag PC ", symbol: "FL", label: "DIGITAL",
    description: "Duration-based digital product listing.",
    plans: [["1 month", 350], ["Lifetime", 1500]]
  },
  {
    name: "BR Mood Bypass", symbol: "BP", label: "BYPASS",
    description: "Select a listed duration to continue to checkout.",
    plans: [["7 days", 220], ["30 days", 410]]
  },
  {
    name: "Dustu Aim Kill", symbol: "AK", label: "FEATURED",
    description: "Choose one of the available plans below.",
    plans: [["7 days", 400], ["30 days", 650]]
  },
  {
    name: "Emote PAanel", symbol: "EMOTE", label: "EMOTE",
    description: "Digital emote product with flexible durations.",
    plans: [["1 day", 30], ["7 days", 150], ["30 days", 300]]
  },
  {
    name: "Mod Menu Ultra PC", symbol: "PC", label: "PC",
    description: "PC digital product listing.",
    plans: [["7 days", 350], ["30 days", 600]]
  }
];

let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;

// Product cards
if (grid) {
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${index * 75}ms`;

    card.innerHTML = `
      <div class="product-art">
        <span class="art-label">${product.label}</span>
        <div class="art-symbol">${product.symbol}</div>
        <span class="art-index">0${index + 1} / ZERO</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="plans" role="group" aria-label="${product.name} plans">
          ${product.plans.map((plan, i) => `
            <button type="button"
              class="plan ${i === 0 ? "selected" : ""}"
              data-index="${i}">
              ${plan[0]} <b>${taka(plan[1])}</b>
            </button>
          `).join("")}
        </div>
        <button class="buy-button" type="button">
          BUY NOW <span>↗</span>
        </button>
      </div>
    `;

    let chosenPlan = product.plans[0];

    card.querySelectorAll(".plan").forEach(btn => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".plan").forEach(b =>
          b.classList.remove("selected")
        );
        btn.classList.add("selected");
        chosenPlan = product.plans[Number(btn.dataset.index)];
      });
    });

    card.querySelector(".buy-button").addEventListener("click", () => {
      openOrder(product, chosenPlan);
    });

    grid.appendChild(card);
  });
}

// Order modal
const backdrop = document.getElementById("modalBackdrop");

function openOrder(product, plan) {
  selectedProduct = {
    product: product.name.trim(),
    duration: plan[0],
    price: plan[1]
  };

  document.getElementById("selectedSummary").textContent =
    `${selectedProduct.product} · ${plan[0]} · ${taka(plan[1])}`;

  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}

function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeOrder);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeOrder();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOrder();
});

// Payment method buttons
document.querySelectorAll(".payment-option").forEach(btn => {
  btn.addEventListener("click", () => {
    chosenMethod = btn.dataset.method;

    document.querySelectorAll(".payment-option").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    updatePaymentDisplay();
  });
});

function updatePaymentDisplay() {
  document.getElementById("methodLabel").textContent = chosenMethod;
  document.getElementById("paymentNumber").textContent =
    PAYMENT_NUMBERS[chosenMethod] || "";
}

document.getElementById("year").textContent =
  new Date().getFullYear();

// Order form + screenshot upload through the secure backend
document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();

  const feedback = document.getElementById("formFeedback");
  const submitButton = e.submitter ||
    document.querySelector('#orderForm button[type="submit"]');
  const file = document.getElementById("screenshot").files[0];

  if (!selectedProduct) {
    feedback.textContent = "Please select a product first.";
    return;
  }

  if (!file) {
    feedback.textContent = "Please upload your payment screenshot.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    feedback.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedback.textContent = "Image must be 5 MB or smaller.";
    return;
  }

  const last4 = document.getElementById("last4").value.trim();
  const discord = document.getElementById("discord").value.trim();

  if (!/^\d{4}$/.test(last4)) {
    feedback.textContent = "Enter the last 4 transaction digits.";
    return;
  }

  if (!discord) {
    feedback.textContent = "Enter your Discord username.";
    return;
  }

  if (ORDER_ENDPOINT.includes("YOUR-WORKER-NAME")) {
    feedback.textContent =
      "Backend setup is not complete yet. Please try again later.";
    return;
  }

  const formData = new FormData();
  formData.append("product", selectedProduct.product);
  formData.append("duration", selectedProduct.duration);
  formData.append("price", String(selectedProduct.price));
  formData.append("paymentMethod", chosenMethod);
  formData.append("transactionLast4", last4);
  formData.append("discordUsername", discord);
  formData.append("screenshot", file, file.name);

  try {
    feedback.textContent = "Sending your order...";
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order submission failed.");
    }

    feedback.textContent = "Order submitted successfully!";
    document.getElementById("orderForm").reset();
    selectedProduct = null;
  } catch (error) {
    console.error("Order submission error:", error);
    feedback.textContent =
      "Order could not be sent. Please try again later.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Copy payment number
const copyBtn = document.getElementById("copyPaymentNumber");
const copyFeedback = document.getElementById("copyFeedback");

if (copyBtn && copyFeedback) {
  copyBtn.addEventListener("click", async () => {
    const number = document.getElementById("paymentNumber")
      .textContent.trim();

    if (!number || number === "....." || number.includes("ADD_YOUR_")) {
      copyFeedback.textContent = "Payment number not set!";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const input = document.createElement("textarea");
        input.value = number;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        const success = document.execCommand("copy");
        input.remove();

        if (!success) throw new Error("Copy failed");
      }

      copyBtn.textContent = "COPIED ✓";
      copyFeedback.textContent = "Number copied successfully!";

      setTimeout(() => {
        copyBtn.textContent = "COPY";
      }, 2000);
    } catch (error) {
      copyFeedback.textContent =
        "Copy failed! Please copy the number manually.";
    }
  });
}const PAYMENT_NUMBERS = {
  bKash: "01309079852",
  Nagad: "....." // এখানে আসল Nagad নম্বর বসাবি
};

const ORDER_ENDPOINT = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const products = [
  {
    name: "BR Mood PC", symbol: "BR", label: "POPULAR",
    description: "Choose a duration that matches your order.",
    plans: [["1 day", 35], ["10 days", 90], ["15 days", 150], ["30 days", 200], ["1 year", 1500], ["Permanent", 2500]]
  },
  {
    name: "Fake Lag PC ", symbol: "FL", label: "DIGITAL",
    description: "Duration-based digital product listing.",
    plans: [["1 month", 350], ["Lifetime", 1500]]
  },
  {
    name: "BR Mood Bypass", symbol: "BP", label: "BYPASS",
    description: "Select a listed duration to continue to checkout.",
    plans: [["7 days", 220], ["30 days", 410]]
  },
  {
    name: "Dustu Aim Kill", symbol: "AK", label: "FEATURED",
    description: "Choose one of the available plans below.",
    plans: [["7 days", 400], ["30 days", 650]]
  },
  {
    name: "Emote PAanel", symbol: "EMOTE", label: "EMOTE",
    description: "Digital emote product with flexible durations.",
    plans: [["1 day", 30], ["7 days", 150], ["30 days", 300]]
  },
  {
    name: "Mod Menu Ultra PC", symbol: "PC", label: "PC",
    description: "PC digital product listing.",
    plans: [["7 days", 350], ["30 days", 600]]
  }
];

let chosenMethod = "bKash";
let selectedProduct = null;

const grid = document.getElementById("productGrid");
const taka = n => `৳${n}`;

// Product cards
if (grid) {
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${index * 75}ms`;

    card.innerHTML = `
      <div class="product-art">
        <span class="art-label">${product.label}</span>
        <div class="art-symbol">${product.symbol}</div>
        <span class="art-index">0${index + 1} / ZERO</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="plans" role="group" aria-label="${product.name} plans">
          ${product.plans.map((plan, i) => `
            <button type="button"
              class="plan ${i === 0 ? "selected" : ""}"
              data-index="${i}">
              ${plan[0]} <b>${taka(plan[1])}</b>
            </button>
          `).join("")}
        </div>
        <button class="buy-button" type="button">
          BUY NOW <span>↗</span>
        </button>
      </div>
    `;

    let chosenPlan = product.plans[0];

    card.querySelectorAll(".plan").forEach(btn => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".plan").forEach(b =>
          b.classList.remove("selected")
        );
        btn.classList.add("selected");
        chosenPlan = product.plans[Number(btn.dataset.index)];
      });
    });

    card.querySelector(".buy-button").addEventListener("click", () => {
      openOrder(product, chosenPlan);
    });

    grid.appendChild(card);
  });
}

// Order modal
const backdrop = document.getElementById("modalBackdrop");

function openOrder(product, plan) {
  selectedProduct = {
    product: product.name.trim(),
    duration: plan[0],
    price: plan[1]
  };

  document.getElementById("selectedSummary").textContent =
    `${selectedProduct.product} · ${plan[0]} · ${taka(plan[1])}`;

  document.getElementById("formFeedback").textContent = "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updatePaymentDisplay();
}

function closeOrder() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeOrder);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeOrder();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOrder();
});

// Payment method buttons
document.querySelectorAll(".payment-option").forEach(btn => {
  btn.addEventListener("click", () => {
    chosenMethod = btn.dataset.method;

    document.querySelectorAll(".payment-option").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    updatePaymentDisplay();
  });
});

function updatePaymentDisplay() {
  document.getElementById("methodLabel").textContent = chosenMethod;
  document.getElementById("paymentNumber").textContent =
    PAYMENT_NUMBERS[chosenMethod] || "";
}

document.getElementById("year").textContent =
  new Date().getFullYear();

// Order form + screenshot upload through the secure backend
document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();

  const feedback = document.getElementById("formFeedback");
  const submitButton = e.submitter ||
    document.querySelector('#orderForm button[type="submit"]');
  const file = document.getElementById("screenshot").files[0];

  if (!selectedProduct) {
    feedback.textContent = "Please select a product first.";
    return;
  }

  if (!file) {
    feedback.textContent = "Please upload your payment screenshot.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    feedback.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedback.textContent = "Image must be 5 MB or smaller.";
    return;
  }

  const last4 = document.getElementById("last4").value.trim();
  const discord = document.getElementById("discord").value.trim();

  if (!/^\d{4}$/.test(last4)) {
    feedback.textContent = "Enter the last 4 transaction digits.";
    return;
  }

  if (!discord) {
    feedback.textContent = "Enter your Discord username.";
    return;
  }

  if (ORDER_ENDPOINT.includes("YOUR-WORKER-NAME")) {
    feedback.textContent =
      "Backend setup is not complete yet. Please try again later.";
    return;
  }

  const formData = new FormData();
  formData.append("product", selectedProduct.product);
  formData.append("duration", selectedProduct.duration);
  formData.append("price", String(selectedProduct.price));
  formData.append("paymentMethod", chosenMethod);
  formData.append("transactionLast4", last4);
  formData.append("discordUsername", discord);
  formData.append("screenshot", file, file.name);

  try {
    feedback.textContent = "Sending your order...";
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order submission failed.");
    }

    feedback.textContent = "Order submitted successfully!";
    document.getElementById("orderForm").reset();
    selectedProduct = null;
  } catch (error) {
    console.error("Order submission error:", error);
    feedback.textContent =
      "Order could not be sent. Please try again later.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// Copy payment number
const copyBtn = document.getElementById("copyPaymentNumber");
const copyFeedback = document.getElementById("copyFeedback");

if (copyBtn && copyFeedback) {
  copyBtn.addEventListener("click", async () => {
    const number = document.getElementById("paymentNumber")
      .textContent.trim();

    if (!number || number === "....." || number.includes("ADD_YOUR_")) {
      copyFeedback.textContent = "Payment number not set!";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const input = document.createElement("textarea");
        input.value = number;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        const success = document.execCommand("copy");
        input.remove();

        if (!success) throw new Error("Copy failed");
      }

      copyBtn.textContent = "COPIED ✓";
      copyFeedback.textContent = "Number copied successfully!";

      setTimeout(() => {
        copyBtn.textContent = "COPY";
      }, 2000);
    } catch (error) {
      copyFeedback.textContent =
        "Copy failed! Please copy the number manually.";
    }
  });
}
