// Inventory Management UI Script with Amazon S3 Product Image Upload
document.addEventListener("DOMContentLoaded", async () => {
  await loadInventory();

  const addProductBtn = document.getElementById("addProductBtn");

  const productForm = document.getElementById("productForm");
  if (productForm) {
    productForm.addEventListener("submit", handleAddProduct);
  }
});

//   const addProductForm = document.getElementById('addProductForm');
//   if (addProductForm) {
//     addProductForm.addEventListener('submit', handleAddProduct);
//   }
// });

const addProductBtn = document.getElementById("addProductBtn");
if (addProductBtn) {
  addProductBtn.addEventListener("click", () => {
    document.getElementById("productModal").style.display = "flex";
  });
}

document.getElementById("closeModal")?.addEventListener("click", () => {
  document.getElementById("productModal").style.display = "none";
});

document.getElementById("cancelBtn")?.addEventListener("click", () => {
  document.getElementById("productModal").style.display = "none";
});

const productForm = document.getElementById("productForm");
if (productForm) {
  productForm.addEventListener("submit", handleAddProduct);
}

let allProducts = [];

async function loadInventory() {
  try {
    const data = await APIClient.getProducts();
    allProducts = data.products || [];
    renderInventoryTable(allProducts);
  } catch (err) {
    console.error("Failed to load inventory:", err);
  }
}

function renderInventoryTable(products) {
  // const tbody = document.getElementById('inventoryTableBody');
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No products found in inventory. Add your first item above!</td></tr>`;
    return;
  }

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>
        // <img src="${p.image_s3_url || "static/images/login-hero.jpg"}" alt="${p.product_name}" class="product-thumb" style="width:40px; height:40px; object-fit:cover; border-radius:6px;" onerror="this.onerror=null; this.src='static/images/login-hero.jpg'"'"/>
      </td>
      <td><strong>${p.product_name}</strong><br><small style="color:var(--text-muted);">${p.sku || "N/A"}</small></td>
      <td><span class="badge badge-category">${p.category}</span></td>
      <td><span class="badge ${p.quantity > 10 ? "badge-success" : "badge-warning"}">${p.quantity} units</span></td>
      <td>₵${Number(p.unit_cost).toFixed(2)}</td>
      <td><strong>₵${Number(p.selling_price).toFixed(2)}</strong></td>
      <td>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteProductItem('${p.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
}

async function handleAddProduct(e) {
  e.preventDefault();

  const productName = document.getElementById("productName").value;
  // const category = document.getElementById('productCategory').value;
  // const quantity = document.getElementById('productQuantity').value;
  // const unitCost = document.getElementById('productUnitCost').value;
  // const sellingPrice = document.getElementById('productSellingPrice').value;
  // const sku = document.getElementById('productSku')?.value || '';
  // const description = document.getElementById('productDescription')?.value || '';
  // const imageInput = document.getElementById('productImageFile');

  const category = document.getElementById("category").value;
  const quantity = document.getElementById("quantity").value;
  const unitCost = document.getElementById("unitCost").value;
  const sellingPrice = document.getElementById("sellingPrice").value;
  const sku = "";
  const description = "";
  const imageInput = null;

  let s3ImageUrl = "";

  if (imageInput && imageInput.files && imageInput.files[0]) {
    const file = imageInput.files[0];
    console.log("[S3 Upload] Uploading product image to Amazon S3 bucket...");
    s3ImageUrl = await S3Uploader.uploadFile(file, "products");
  }

  try {
    await APIClient.createProduct({
      product_name: productName,
      category,
      quantity,
      unit_cost: unitCost,
      selling_price: sellingPrice,
      sku,
      description,
      image_s3_url: s3ImageUrl,
    });

    // Reset form & reload inventory
    // document.getElementById('addProductForm').reset();
    // const modalEl = document.getElementById('addProductModal');
    // if (modalEl && window.bootstrap) {
    //   const modal = bootstrap.Modal.getInstance(modalEl);
    //   if (modal) modal.hide();
    // }

    document.getElementById("productForm").reset();
    document.getElementById("productModal").style.display = "none";

    await loadInventory();
  } catch (err) {
    alert("Failed to add product: " + err.message);
  }
}

async function deleteProductItem(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    await APIClient.deleteProduct(id);
    await loadInventory();
  } catch (err) {
    alert("Failed to delete product: " + err.message);
  }
}

window.deleteProductItem = deleteProductItem;
