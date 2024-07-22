const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed
var transactionsLength = 0;
var month = document.getElementById("month-filter");
var options = [...month.options];
options.forEach(function (option) {
  if (option.value == currentMonth) {
    option.selected = true;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  fetchData();
  var project_name = $("#project-filter option:selected").text();
  var cur = $("#cur-filter").val();
  function fetchData() {
    var month = $("#month-filter").val();
    var year = $("#year-filter").val();
    var project_id = $("#project-filter").val();
    cur = $("#cur-filter").val();
    $.ajax({
      url: `/reports/expense-vs-income/data`,
      method: "GET",
      data: { month: month, year: year, cur: cur, project_id: project_id },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      success: function (response) {
        transactionsLength = response.transactions.length;
        populateIncomeExpenseTable(response.transactions, month, year);
      },
      error: function (xhr) {
        console.error(xhr.responseText);
      },
    });
  }

  function populateIncomeExpenseTable(transactions, month, year) {
    const tableBody = document.getElementById("income-expense-table-body");
    tableBody.innerHTML = "";

    let labels = [];
    let incomeAmount = [];
    let expenseAmount = [];

    if (month === "all") {
      // Yearly filter: Aggregate amounts by month for the selected year
      const monthlyData = aggregateMonthlyData(transactions, year);
      // Populate labels, incomeAmount, and expenseAmount from monthlyData
      labels = monthlyData.map((entry) => entry.month);
      incomeAmount = monthlyData.map((entry) => entry.totalIncome);
      expenseAmount = monthlyData.map((entry) => entry.totalExpense);
    } else {
      // Monthly filter: Filter transactions for the selected month and year
      const filteredData = filterTransactionsByMonth(transactions, month, year);
      // Populate labels, incomeAmount, and expenseAmount from filteredData
      labels = filteredData.map((tran) => new Date(tran.date)); // Convert dates to Date objects
      labels.sort((a, b) => a - b); // Sort dates in ascending order

      // Adjust incomeAmount and expenseAmount to match sorted labels
      incomeAmount = labels.map((date) =>
        filteredData
          .filter(
            (tran) =>
              tran.type === "Income" &&
              new Date(tran.date).getTime() === date.getTime()
          )
          .reduce((sum, tran) => sum + parseFloat(tran.amount || 0), 0)
      );

      expenseAmount = labels.map((date) =>
        filteredData
          .filter(
            (tran) =>
              tran.type === "Expense" &&
              new Date(tran.date).getTime() === date.getTime()
          )
          .reduce((sum, tran) => sum + parseFloat(tran.amount || 0), 0)
      );
      labels = labels.map((date) => formatDate(date));
    }

    for (let index = 0; index < labels.length; index++) {
      const row = document.createElement("tr");
      const income = incomeAmount[index];
      const expense = expenseAmount[index];
      const saving = income - expense;
      var saving_rate = 0;
      if (!(income == 0 && expense == 0)) {
        saving_rate = ((income - expense) / income) * 100;
      }
      row.innerHTML = `
                    <td>${labels[index]}</td>
                    <td>${new Intl.NumberFormat().format(
                      parseFloat(income).toFixed(2)
                    )} ${cur}</td>
                    <td>${new Intl.NumberFormat().format(
                      parseFloat(expense).toFixed(2)
                    )} ${cur}</td>
                    <td>${new Intl.NumberFormat().format(
                      parseFloat(saving).toFixed(2)
                    )} ${cur}</td>
                    <td>${new Intl.NumberFormat().format(
                      parseFloat(saving_rate).toFixed(2)
                    )}</td>
                `;
      tableBody.appendChild(row);
    }
  }

  function filterTransactionsByMonth(transactions, month, year) {
    // Ensure transactions is an array and not empty
    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.warn("Transactions array is empty or not valid.");
      return [];
    }

    // Filter transactions based on month and year
    const filteredTransactions = transactions.filter((tran) => {
      // Ensure tran.date is valid and in YYYY-MM-DD format or as expected
      if (!tran.date) {
        console.warn("Transaction date is missing or invalid:", tran);
        return false;
      }

      // Create a Date object from tran.date
      const transactionDate = new Date(tran.date);

      // Check if transactionDate matches the specified month and year
      // Adjust month comparison to handle zero-based index of getMonth()
      return (
        transactionDate.getMonth() + 1 === parseInt(month) &&
        transactionDate.getFullYear() === parseInt(year)
      );
    });

    return filteredTransactions;
  }

  function aggregateMonthlyData(transactions, year) {
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const totalIncome = transactions
        .filter(
          (tran) =>
            tran.type === "Income" &&
            new Date(tran.date).getFullYear() === parseInt(year) &&
            new Date(tran.date).getMonth() === parseInt(month) - 1
        )
        .reduce((sum, tran) => sum + parseFloat(tran.amount || 0), 0);

      const totalExpense = transactions
        .filter(
          (tran) =>
            tran.type === "Expense" &&
            new Date(tran.date).getFullYear() === parseInt(year) &&
            new Date(tran.date).getMonth() === parseInt(month) - 1
        )
        .reduce((sum, tran) => sum + parseFloat(tran.amount || 0), 0);

      monthlyData.push({
        month: `${month}/${year}`,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
      });
    }

    return monthlyData;
  }
  function formatDate(date) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }
  $("#month-filter, #year-filter, #cur-filter, #project-filter").change(
    fetchData
  );

  document
    .getElementById("downloadExcelBtn")
    .addEventListener("click", function () {
      /* Create worksheet from HTML DOM TABLE */
      var wb = XLSX.utils.table_to_book(
        document.getElementById("transactionsTable")
      );
      project_name = $("#project-filter option:selected").text();

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
        `expense_vs_income_report_in_${year}_${month}_in_${cur}_for_${project_name}.xlsb`
      );
    });
});
