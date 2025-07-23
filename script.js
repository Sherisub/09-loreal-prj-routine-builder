console.log("✅ JS Loaded");
const API_ENDPOINT = "https://llm-chat-app-template.mariposa06017.workers.dev/api/chat";

const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

let allProducts = [];
let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

let chatHistory = [
  {
    role: "system",
    content:
      "You are a helpful and friendly L'Oréal beauty advisor. Always give concise, personalized product advice using the selected items.",
  },
];

async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  renderProducts(allProducts);
  updateSelectedProductsDisplay();
}

function renderProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
      <div class="product-card ${selectedProducts.includes(product.id.toString()) ? "selected" : ""}" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
          <button class="toggle-description">Details</button>
          <div class="product-description">${product.description}</div>
        </div>
      </div>
    `
    )
    .join("");
}

function updateSelectedProductsDisplay() {
  selectedProductsList.innerHTML = selectedProducts
    .map((id) => {
      const product = allProducts.find((p) => p.id.toString() === id.toString());
      return `
        <div class="selected-item">
          ${product ? product.name : "Unknown"}
          <button class="remove-btn" data-id="${id}">✕</button>
        </div>`;
    })
    .join("");

  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      selectedProducts = selectedProducts.filter((pid) => pid !== id);
      updateSelectedProductsDisplay();
      renderProductsWithCurrentFilters();
    });
  });
}

productsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("toggle-description")) {
    const desc = e.target.closest(".product-info").querySelector(".product-description");
    desc.classList.toggle("active");
    return;
  }

  const card = e.target.closest(".product-card");
  if (card) {
    const productId = card.dataset.id;
    if (selectedProducts.includes(productId)) {
      selectedProducts = selectedProducts.filter((id) => id !== productId);
      card.classList.remove("selected");
    } else {
      selectedProducts.push(productId);
      card.classList.add("selected");
    }
    updateSelectedProductsDisplay();
  }
});

function renderProductsWithCurrentFilters() {
  const selectedCategory = categoryFilter.value;
  const keyword = productSearch.value.toLowerCase();

  const filtered = allProducts.filter(
    (p) =>
      (selectedCategory === "all" || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(keyword) || p.brand.toLowerCase().includes(keyword))
  );

  renderProducts(filtered);
}

categoryFilter.addEventListener("change", renderProductsWithCurrentFilters);
productSearch.addEventListener("input", renderProductsWithCurrentFilters);

async function sendChatMessage(message) {
  chatHistory.push({ role: "user", content: message });
  chatWindow.innerHTML += `<div><strong>You:</strong> ${message}</div>`;

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }),
    });

    const data = await res.json();
    console.log("🧪 Full response from GPT:", data); // 콘솔에서 전체 응답 확인

    const reply = data?.message?.content || JSON.stringify(data); // 없으면 전체 JSON 출력
    chatWindow.innerHTML += `<div><strong>Bot:</strong> ${reply}</div>`;
    chatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    console.error("❌ Error:", err);
    chatWindow.innerHTML += `<div><strong>Bot:</strong> ❌ Error: ${err.message}</div>`;
  }
}

generateRoutineBtn.addEventListener("click", () => {
  const selected = allProducts.filter((p) =>
    selectedProducts.includes(p.id.toString())
  );

  if (selected.length === 0) {
    chatWindow.innerHTML += `<div><strong>You:</strong> I didn’t select any products.</div>`;
    return;
  }

  const userPrompt = `Create a skincare routine using these products: ${selected.map((p) => p.name).join(", ")}.`;
  sendChatMessage(userPrompt);
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const userMessage = input.value.trim();
  if (!userMessage) return;
  input.value = "";
  sendChatMessage(userMessage);
});

loadProducts();
