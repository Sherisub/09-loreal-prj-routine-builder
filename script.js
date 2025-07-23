/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

let allProducts = [];
let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
}

function renderProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card ${selectedProducts.includes(product.id) ? "selected" : ""}" data-id="${product.id}">
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
      const product = allProducts.find((p) => p.id === id);
      return `<div>${product ? product.name : "Unknown"}</div>`;
    })
    .join("");
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

productsContainer.addEventListener("click", (e) => {
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

  if (e.target.classList.contains("toggle-description")) {
    const desc = e.target.nextElementSibling;
    desc.classList.toggle("active");
  }
});

categoryFilter.addEventListener("change", () => {
  const selectedCategory = categoryFilter.value;
  const filtered = allProducts.filter((p) => p.category === selectedCategory);
  renderProducts(filtered);
});

productSearch.addEventListener("input", () => {
  const keyword = productSearch.value.toLowerCase();
  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(keyword) ||
    p.brand.toLowerCase().includes(keyword)
  );
  renderProducts(filtered);
});

generateRoutineBtn.addEventListener("click", async () => {
  const selected = allProducts.filter((p) => selectedProducts.includes(p.id));
  const res = await fetch("https://your-cloudflare-worker-endpoint/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a skincare assistant." },
        {
          role: "user",
          content: `Create a routine using these products: ${selected
            .map((p) => p.name)
            .join(", ")}`,
        },
      ],
    }),
  });
  const data = await res.json();
  chatWindow.innerHTML += `<div>${data.choices[0].message.content}</div>`;
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const userMessage = input.value;
  chatWindow.innerHTML += `<div><strong>You:</strong> ${userMessage}</div>`;
  input.value = "";

  const res = await fetch("https://your-cloudflare-worker-endpoint/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "user", content: userMessage },
      ],
    }),
  });
  const data = await res.json();
  chatWindow.innerHTML += `<div><strong>Bot:</strong> ${data.choices[0].message.content}</div>`;
});

loadProducts().then(() => {
  updateSelectedProductsDisplay();
});
