// API Client connecting Frontend UI to Amazon EC2 Express Backend REST API
class APIClient {
  static getHeaders(hasFile = false) {
    const token = localStorage.getItem("auth_token");
    const headers = {};
    if (!hasFile) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: this.getHeaders(options.isFormData),
    };

    const finalOptions = { ...defaultOptions, ...options };
    delete finalOptions.isFormData;

    try {
      const response = await fetch(url, finalOptions);
      const contentType = response.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (text.trim().startsWith("<") || text.includes("The page")) {
          throw new Error(
            `Backend API endpoint unavailable (HTTP ${response.status}). Please check API server connection.`,
          );
        }
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text || `HTTP error! status: ${response.status}`);
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `HTTP error! status: ${response.status}`,
        );
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth Methods
  static async login(email, password) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  }

  static async register(userData) {
    const data = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  }

  static logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }

  static async getMe() {
    const data = await this.request("/auth/me");
    if (data.user) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...currentUser, ...data.user };
      localStorage.setItem("user", JSON.stringify(updated));
    }
    return data;
  }

  static async updateProfile(profileData) {
    const data = await this.request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    if (data.user) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...currentUser, ...data.user };
      localStorage.setItem("user", JSON.stringify(updated));
    }
    return data;
  }

  static async updatePassword(passwordData) {
    return this.request("/auth/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }

  // Products Inventory Methods
  static async getProducts() {
    return this.request("/products");
  }

  static async createProduct(productData) {
    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  static async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  static async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // Sales Methods
  static async getSales() {
    return this.request("/sales");
  }

  static async recordSale(saleData) {
    return this.request("/sales", {
      method: "POST",
      body: JSON.stringify(saleData),
    });
  }

  static async deleteSale(id) {
    return this.request(`/sales/${id}`, {
      method: "DELETE",
    });
  }

  // Reports Summary
  static async getSummary() {
    return this.request("/reports/summary");
  }

  // S3 Asset Upload Stream
  static async uploadAssetToS3(file, folder = "products") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    return this.request("/upload/direct", {
      method: "POST",
      isFormData: true,
      body: formData,
    });
  }
  static async forgotPassword(email) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  static async resetPassword(token, new_password) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    });
  }
}

window.APIClient = APIClient;
