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
  fetchCategoryExpenses();
  var cur = $("#cur-filter").val();
  function fetchCategoryExpenses() {
    var month = $("#month-filter").val();
    var year = $("#year-filter").val();
    cur = $("#cur-filter").val();
    $.ajax({
      url: `/reports/expense-by-category/data`,
      method: "GET",
      data: { month: month, year: year, cur: cur },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      success: function (response) {
        populateCategoryExpenseTable(response.expense_by_category);
      },
      error: function (xhr) {
        console.error(xhr.responseText);
      },
    });
  }

  function populateCategoryExpenseTable(categoryExpenses) {
    const tableBody = document.getElementById("category-expense-table-body");
    tableBody.innerHTML = "";

    Object.keys(categoryExpenses).forEach((category) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                    <td>${category}</td>
                    <td>${new Intl.NumberFormat().format(
                      parseFloat(categoryExpenses[category]).toFixed(2)
                    )} ${cur}</td>
                `;
      tableBody.appendChild(row);
    });
  }
  $("#month-filter, #year-filter, #cur-filter").change(fetchCategoryExpenses);
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
      var cur = $("#cur-filter").val();
      if (month == "all") {
        month = "_";
      }

      XLSX.writeFile(
        wb,
        `expense_by_category_report_in_${year}_${month}_in_${cur}.xlsb`
      );
    });
});
