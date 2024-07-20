const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed

var month = document.getElementById("month-filter");
var options = [...month.options];
options.forEach(function (option) {
  if (option.value == currentMonth) {
    option.selected = true;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  fetchTransactions();
  function fetchTransactions() {
    var month = $("#month-filter").val();
    var year = $("#year-filter").val();

    $.ajax({
      url: `/reports/transactions/data`,
      method: "GET",
      data: { month: month, year: year },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      success: function (response) {
        populateTransactionTable(response.transactions);
      },
      error: function (xhr) {
        console.error(xhr.responseText);
      },
    });
  }

  function populateTransactionTable(transactions) {
    const tableBody = document.getElementById("transaction-table-body");
    tableBody.innerHTML = "";
    transactions.forEach((tran) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                    <td>${new Intl.NumberFormat().format(
                      parseFloat(tran.amount).toFixed(2)
                    )} ${tran.currency}</td>
                    <td>${tran.type}</td>
                    <td>${tran.category.name}</td>
                    <td>${tran.description}</td>
                    <td>${tran.date}</td>
                    <td>${new Date(tran.created_at).toUTCString()}</td>
                `;
      tableBody.appendChild(row);
    });
  }
  $("#month-filter, #year-filter, #cur-filter").change(fetchTransactions);

  document
    .getElementById("downloadExcelBtn")
    .addEventListener("click", function () {
      /* Create worksheet from HTML DOM TABLE */
      var wb = XLSX.utils.table_to_book(
        document.getElementById("transactionsTable")
      );

      // Process Data (add a new row)
      var ws = wb.Sheets["Sheet1"];
      XLSX.utils.sheet_add_aoa(ws, [["Created " + new Date().toISOString()]], {
        origin: -1,
      });
      ws["!cols"] = [
        { wpx: 80 },
        { wpx: 80 },
        { wpx: 80 },
        { wpx: 80 },
        { wpx: 80 },
        { wpx: 80 },
        { wpx: 80 },
        { wpx: 80 },
        { wpx: 80 },
        { wpx: 80 },
      ];
      ws["!rows"] = [{ hpx: 30 }];
      var month = $("#month-filter").val();
      var year = $("#year-filter").val();
      if (month == "all") {
        month = "_";
      }

      XLSX.writeFile(wb, `transactions_report_in_${year}_${month}.xlsb`);
    });
});
