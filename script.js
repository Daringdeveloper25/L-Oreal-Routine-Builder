/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Track selected products by their id */
let selectedProducts = [];

/* Store all loaded products for easy access */
let allProductsCache = [];

/* Restore selected products from localStorage on page load */
if (localStorage.getItem("selectedProducts")) {
  try {
    selectedProducts = JSON.parse(localStorage.getItem("selectedProducts"));
  } catch {
    selectedProducts = [];
  }
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  // Only fetch once, then use cache
  if (allProductsCache.length > 0) {
    return allProductsCache;
  }
  const response = await fetch("products.json");
  const data = await response.json();
  allProductsCache = data.products;
  return allProductsCache;
}

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-id="${product.id}" data-description="${product.description}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Add click and hover event listeners to each product card
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", async () => {
      const productId = card.getAttribute("data-id");
      // Toggle selection
      if (selectedProducts.includes(productId)) {
        selectedProducts = selectedProducts.filter((id) => id !== productId);
      } else {
        selectedProducts.push(productId);
      }
      saveSelectedProducts();
      updateProductCardStyles();
      const allProducts = await loadProducts();
      updateSelectedProductsList(allProducts);
    });

    // Show description tooltip on hover
    card.addEventListener("mouseenter", (e) => {
      showDescriptionTooltip(card);
    });
    card.addEventListener("mouseleave", (e) => {
      hideDescriptionTooltip();
    });
  });

  updateProductCardStyles();
  loadProducts().then(updateSelectedProductsList);
}

/* Show description tooltip */
function showDescriptionTooltip(card) {
  // Create tooltip element
  const tooltip = document.createElement("div");
  tooltip.className = "product-tooltip";
  tooltip.innerText = card.getAttribute("data-description");

  // Position tooltip near the card
  const rect = card.getBoundingClientRect();
  tooltip.style.position = "fixed";
  tooltip.style.left = rect.right + 10 + "px";
  tooltip.style.top = rect.top + "px";
  tooltip.style.zIndex = "1000";

  document.body.appendChild(tooltip);
}

/* Hide description tooltip */
function hideDescriptionTooltip() {
  const tooltip = document.querySelector(".product-tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

/* Highlight selected product cards */
function updateProductCardStyles() {
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    const productId = card.getAttribute("data-id");
    if (selectedProducts.includes(productId)) {
      card.style.border = "3px solid #000";
      card.style.background = "#f0f8ff";
    } else {
      card.style.border = "1px solid #ccc";
      card.style.background = "#fff";
    }
  });
}

/* Show selected products above the button, with remove and clear options */
function updateSelectedProductsList(allProducts) {
  // Find selected product objects by id
  const selectedObjs = allProducts.filter((p) =>
    selectedProducts.includes(String(p.id))
  );
  if (selectedObjs.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected</div>`;
    // Add Clear All button only if there are selected products
    if (document.getElementById("clearSelectedBtn")) {
      document.getElementById("clearSelectedBtn").remove();
    }
    return;
  }
  selectedProductsList.innerHTML = selectedObjs
    .map(
      (product) => `
        <div class="product-card" style="flex:0 1 180px; border:2px solid #000; background:#fafafa; position:relative;">
          <img src="${product.image}" alt="${product.name}" style="width:60px;height:60px;">
          <div class="product-info">
            <h3 style="font-size:14px;">${product.name}</h3>
            <p style="font-size:12px;">${product.brand}</p>
          </div>
          <button class="remove-selected-btn" data-id="${product.id}" title="Remove" style="position:absolute;top:8px;right:8px;background:#fff;border:1px solid #ccc;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:16px;line-height:20px;">&times;</button>
        </div>
      `
    )
    .join("");

  // Add Clear All button below selected products if not already present
  if (!document.getElementById("clearSelectedBtn")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.className = "generate-btn";
    clearBtn.style.background = "#fff";
    clearBtn.style.color = "#000";
    clearBtn.style.border = "2px solid #000";
    clearBtn.style.marginTop = "10px";
    clearBtn.style.fontSize = "16px";
    clearBtn.style.fontWeight = "400";
    clearBtn.style.width = "auto";
    clearBtn.style.padding = "8px 18px";
    clearBtn.onclick = () => {
      selectedProducts = [];
      saveSelectedProducts();
      updateProductCardStyles();
      updateSelectedProductsList(allProducts);
    };
    selectedProductsList.parentNode.insertBefore(
      clearBtn,
      selectedProductsList.nextSibling
    );
  }

  // Add event listeners for remove buttons
  const removeBtns = document.querySelectorAll(".remove-selected-btn");
  removeBtns.forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      selectedProducts = selectedProducts.filter(
        (pid) => pid !== id && pid !== String(id)
      );
      saveSelectedProducts();
      updateProductCardStyles();
      updateSelectedProductsList(allProducts);
    };
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Track chat history for follow-up questions */
let chatHistory = [
  {
    role: "system",
    content:
      // Instruct the AI to include current, real-world info and show links/citations
      "You are a helpful beauty advisor. Answer questions about products and routines using current, real-world information. When possible, include visible links or citations to reputable sources (such as official brand sites, medical resources, or product pages). Format links so users can click them. If you reference facts, show a source or a web search link (e.g. https://www.google.com/search?q=PRODUCT+NAME). Be friendly and explain things clearly for a beginner.",
  },
];

/* Chat form submission handler - sends user message to OpenAI and shows response */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message from the input field
  const userInput = document.getElementById("userInput").value;

  // Add user's message to chat history
  chatHistory.push({
    role: "user",
    content: userInput,
  });

  // Show loading message while waiting for response
  chatWindow.innerHTML = "Thinking...";

  // Check API key before making request
  let apiKey;
  try {
    apiKey = getOpenAIKeyOrError();
  } catch {
    return;
  }

  // Send request to OpenAI API using async/await
  try {
    const response = await fetch(
      "https://round-recipe-ded4.jhunt25.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: chatHistory,
          max_tokens: 1000, // Increased for longer chat replies
        }),
      }
    );

    const data = await response.json();

    // Check if we got a valid response and show it in the chat window
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Add assistant's reply to chat history
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });

      // Log the assistant's message content for debugging
      console.log("Assistant message:", data.choices[0].message.content);

      // Display the whole conversation in the chat window
      chatWindow.innerHTML = chatHistory
        .filter((msg) => msg.role !== "system")
        .map((msg) =>
          msg.role === "user"
            ? `<div><strong>You:</strong> ${msg.content}</div>`
            : `<div><strong>Advisor:</strong> ${msg.content}</div>`
        )
        .join("");
    } else {
      chatWindow.innerHTML =
        "Sorry, I couldn't get an answer. Please try again.";
    }
  } catch (error) {
    chatWindow.innerHTML =
      "Error connecting to OpenAI. Check your API key and try again.";
  }

  // Clear the input field after sending
  document.getElementById("userInput").value = "";
});

/*
  The API key for OpenAI is stored in secrets.js as OPENAI_API_KEY.
  Make sure secrets.js is loaded in index.html before script.js.
  We use this variable when making requests to the OpenAI API.
  If the API key is missing, show an error message.
*/

// Helper function to check API key before making requests
function getOpenAIKeyOrError() {
  if (typeof OPENAI_API_KEY === "undefined" || !OPENAI_API_KEY) {
    chatWindow.innerHTML =
      "Error: OpenAI API key is missing. Please make sure secrets.js is loaded and contains your API key.";
    throw new Error("OpenAI API key missing");
  }
  return OPENAI_API_KEY;
}

/* This function sends selected products to OpenAI and shows the routine in the chat */
generateRoutineBtn.addEventListener("click", async () => {
  // Use all products from cache
  const allProducts = await loadProducts();

  // Get selected product objects
  const selectedObjs = allProducts.filter((p) =>
    selectedProducts.includes(String(p.id))
  );

  // If no products are selected, show a message and stop
  if (selectedObjs.length === 0) {
    chatWindow.innerHTML =
      "Please select at least one product to generate a routine.";
    return;
  }

  // Build a simple message for OpenAI
  const productList = selectedObjs
    .map((p, i) => `${i + 1}. ${p.name} (${p.brand})`)
    .join("\n");

  // The messages array for OpenAI
  const messages = [
    {
      role: "system",
      content:
        // Instruct the AI to include current, real-world info and show links/citations
        "You are a helpful beauty advisor. Suggest a personalized routine using the selected products and current, real-world information. When possible, include visible links or citations to reputable sources (such as official brand sites, medical resources, or product pages). Format links so users can click them. If you reference facts, show a source or a web search link (e.g. https://www.google.com/search?q=PRODUCT+NAME). Be friendly and explain the steps clearly for a beginner.",
    },
    {
      role: "user",
      content: `Here are the products I've selected:\n${productList}\nCan you create a routine for me?`,
    },
  ];

  // Show loading message
  chatWindow.innerHTML = "Generating your routine...";

  // Check API key before making request
  let apiKey;
  try {
    apiKey = getOpenAIKeyOrError();
  } catch {
    return;
  }

  // Send request to OpenAI API
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 1000, // Increased for longer routine responses
      }),
    });

    const data = await response.json();

    // Check if we got a valid response
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      chatWindow.innerHTML = data.choices[0].message.content;
    } else {
      chatWindow.innerHTML =
        "Sorry, I couldn't generate a routine. Please try again.";
    }
  } catch (error) {
    chatWindow.innerHTML =
      "Error connecting to OpenAI. Check your API key and try again.";
  }
});

/* RTL support: detect language and toggle layout direction */
function updateDirectionByLang(lang) {
  // List of RTL language codes
  const rtlLangs = ["ar", "he", "fa", "ur"];
  const isRTL = rtlLangs.includes(lang.split("-")[0]);
  // Set direction on <html> and main containers
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.body.dir = isRTL ? "rtl" : "ltr";
  // Add/remove RTL class for styling
  document.body.classList.toggle("rtl", isRTL);
  // Update product grid and chatbox direction
  const productsGrid = document.getElementById("productsContainer");
  if (productsGrid) productsGrid.dir = isRTL ? "rtl" : "ltr";
  const selectedProductsSection = document.getElementById(
    "selectedProductsList"
  );
  if (selectedProductsSection)
    selectedProductsSection.dir = isRTL ? "rtl" : "ltr";
  const chatBox = document.querySelector(".chatbox");
  if (chatBox) chatBox.dir = isRTL ? "rtl" : "ltr";
}

// Detect language on page load
updateDirectionByLang(document.documentElement.lang || navigator.language);

// Listen for language changes (if user changes <html lang> dynamically)
const langObserver = new MutationObserver(() => {
  updateDirectionByLang(document.documentElement.lang || navigator.language);
});
langObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["lang"],
});

// On initial page load, show selected products from localStorage
loadProducts().then(updateSelectedProductsList);
