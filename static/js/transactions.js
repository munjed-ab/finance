// transactions.js

document.addEventListener("DOMContentLoaded", () => {
  const transactionForm = document.getElementById("transactionForm");
  const transactionsTable = document
    .getElementById("transactionsTable")
    .getElementsByTagName("tbody")[0];
  const editTransactionForm = document.getElementById("editTransactionForm");
  const editTransactionModal = new bootstrap.Modal(
    document.getElementById("editTransactionModal")
  );

  // Fetch and display transactions
  async function fetchTransactions() {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/transactions/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const transactions = await response.json();
      transactionsTable.innerHTML = "";
      transactions.forEach((transaction) => {
        const row = transactionsTable.insertRow();
        row.insertCell(0).textContent = transaction.amount;
        row.insertCell(1).textContent = transaction.type;
        row.insertCell(2).textContent = transaction.category.name;
        row.insertCell(3).textContent = transaction.currency;
        row.insertCell(4).textContent = transaction.description;
        row.insertCell(5).textContent = transaction.date;
        const actionsCell = row.insertCell(6);
        actionsCell.innerHTML = `
                    <button style="border-radius:10px" class="btn btn-primary" onclick="editTransaction(${transaction.id})">Edit</button>
                    <button style="border-radius:10px" class="btn btn-danger" onclick="deleteTransaction(${transaction.id})">Delete</button>
                `;
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }

  // Add new transaction
  transactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const formData = new FormData(transactionForm);
    const data = {
      amount: parseFloat(formData.get("amount")),
      type: formData.get("type"),
      category_name: formData.get("category_name"),
      currency: formData.get("currency"),
      description: formData.get("description"),
      date: formData.get("date"),
    };
    try {
      const response = await fetch("/transactions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        transactionForm.reset();
        fetchTransactions();
      } else {
        console.error("Error adding transaction:", await response.json());
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  });

  // Edit transaction function
  window.editTransaction = function (id) {
    const row = document.querySelector(
      `button[onclick="editTransaction(${id})"]`
    ).parentNode.parentNode;
    const cells = row.getElementsByTagName("td");

    document.getElementById("edit-transaction-id").value = id;
    document.getElementById("edit-amount").value = cells[0].textContent;
    document.getElementById("edit-type").value = cells[1].textContent;
    document.getElementById("edit-category").value = cells[2].textContent;
    document.getElementById("edit-currency").value = cells[3].textContent;
    document.getElementById("edit-description").value = cells[4].textContent;
    document.getElementById("edit-date").value = cells[5].textContent;

    editTransactionModal.show();
  };

  // Submit updated transaction data
  editTransactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const transactionId = document.getElementById("edit-transaction-id").value;
    const formData = new FormData(editTransactionForm);
    const data = {
      amount: parseFloat(formData.get("amount")),
      type: formData.get("type"),
      category_name: formData.get("category_name"),
      currency: formData.get("currency"),
      description: formData.get("description"),
      date: formData.get("date"),
    };

    try {
      const response = await fetch(`/transactions/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        fetchTransactions();
        editTransactionModal.hide();
      } else {
        console.error("Error updating transaction:", await response.json());
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  });

  // Delete transaction function
  window.deleteTransaction = async function (id) {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/transactions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchTransactions();
      } else {
        console.error("Error deleting transaction:", await response.json());
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  // Initial fetch of transactions
  fetchTransactions();
});
