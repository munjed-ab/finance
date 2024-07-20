const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed

var month = document.getElementById("month-filter");
var options = [...month.options];
options.forEach(function (option) {
  if (option.value == currentMonth) {
    option.selected = true;
  }
});

var cur = $("#cur-filter").val();

$.ajaxSetup({
  beforeSend: function (xhr, settings) {
    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
    }
  },
});

function csrfSafeMethod(method) {
  // These HTTP methods do not require CSRF protection
  return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
}

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

$(document).ready(function () {
  let chart = null;
  let pie_chart = null;
  let line_chart = null;
  function handleFilterChange() {
    var month = $("#month-filter").val();
    var year = $("#year-filter").val();
    cur = $("#cur-filter").val();
    var token = localStorage.getItem("token");

    $.ajax({
      url: `/dashboard/data`,
      method: "GET",
      data: {
        year: year,
        cur: cur,
        month: month,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        updateCards(response);
        updateFinanceChart(
          response.income_by_category,
          response.expense_by_category
        );
        updatePieChart(response.expense_by_category);

        updateLineChart(response.transactions, month, year);
      },

      error: function (xhr, status, error) {
        console.error(xhr.responseText);
      },
    });
  }

  $("#month-filter, #year-filter, #cur-filter").change(function () {
    handleFilterChange();
  });

  // Initial load
  handleFilterChange();

  function updateCards(response) {
    const income = response.total_income;
    const expense = response.total_expense;
    const saving = income - expense;
    var saving_rate = 0;
    if (!(income == 0 && expense == 0)) {
      saving_rate = ((income - expense) / income) * 100;
    }
    $("#total-income").text(
      `${new Intl.NumberFormat().format(parseFloat(income).toFixed(2))} ${cur}`
    );
    $("#total-expense").text(
      `${new Intl.NumberFormat().format(parseFloat(expense).toFixed(2))} ${cur}`
    );
    $("#saving").text(
      `${new Intl.NumberFormat().format(parseFloat(saving).toFixed(2))} ${cur}`
    );
    $("#saving-rate").text(
      `${new Intl.NumberFormat().format(parseFloat(saving_rate).toFixed(2))} %`
    );
  }
  function updateFinanceChart(income_by_category, expense_by_category) {
    // Destroy the previous chart if it exists
    if (chart) {
      chart.destroy();
    }
    const incomeLabels = Object.keys(income_by_category);
    const expenseLabels = Object.keys(expense_by_category);

    const labels = Array.from(new Set([...incomeLabels, ...expenseLabels]));

    const incomeData = labels.map((label) =>
      parseFloat(income_by_category[label] || 0)
    );
    const expenseData = labels.map((label) =>
      parseFloat(expense_by_category[label] || 0)
    );

    const data = {
      labels: labels,
      size: 30,
      fontSize: 20,
      datasets: [
        {
          label: "Expense",
          data: expenseData,
          fill: true,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgb(255, 99, 132)",
          pointBackgroundColor: "rgb(255, 99, 132)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(255, 99, 132)",
          radius: 5,
        },
        {
          label: "Income",
          data: incomeData,
          fill: true,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgb(54, 162, 235)",
          pointBackgroundColor: "rgb(54, 162, 235)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(54, 162, 235)",
          radius: 5,
        },
      ],
    };

    const config = {
      type: "radar",
      data: data,
      options: {
        responsive: true,
        title: {
          display: true,
          text: "Expense vs Income by Category",
        },
        elements: {
          line: {
            borderWidth: 3,
          },
        },
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              var label = data.labels[tooltipItem.index] || "";
              return `${label}`;
            },
          },
        },
      },
    };

    Chart.defaults.global.defaultFontColor = "#000000c7"; //light black  000000c7 primary green 0f5132
    Chart.defaults.global.defaultFontSize = 16;
    const ctx = document.getElementById("chart").getContext("2d");

    chart = new Chart(ctx, config);
  }
  function updatePieChart(expenseByCategory) {
    if (pie_chart) {
      pie_chart.destroy();
    }
    const ctx = document.getElementById("pieChart").getContext("2d");
    pie_chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(expenseByCategory),
        datasets: [
          {
            data: Object.values(expenseByCategory),
            backgroundColor: [
              "rgba(153, 102, 255, 0.6)",
              "rgba(255, 159, 64, 0.6)",
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(75, 192, 192, 0.6)",
              "rgba(130, 5, 132, 0.6)",
              "rgba(201, 70, 50, 0.6)",

              "rgba(255, 240, 245, 0.6)",
              "rgba(124, 252, 0, 0.6)",
              "rgba(255, 250, 205, 0.6)",
              "rgba(240, 128, 128, 0.6)",
              "rgba(240, 255, 240, 0.6)",
              "rgba(30, 144, 255, 0.6)",
              "rgba(255, 248, 220, 0.6)",
              "rgba(240, 255, 255, 0.6)",
            ],
            borderColor: [
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(130, 5, 132, 1)",
              "rgba(201, 70, 50, 1)",
              "rgba(255, 240, 245, 1)",
              "rgba(124, 252, 0, 1)",
              "rgba(255, 250, 205, 1)",
              "rgba(240, 128, 128, 1)",
              "rgba(240, 255, 240, 1",
              "rgba(30, 144, 255, 1)",
              "rgba(255, 248, 220, 1)",
              "rgba(240, 255, 255, 1)",
            ],
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        title: {
          display: true,
          text: "Expense by Category",
        },
      },
    });
  }
  function updateLineChart(transactions, month, year) {
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

    // Destroy existing chart if it exists
    if (line_chart) {
      line_chart.destroy();
    }

    // Create Chart.js instance with sorted dates and corresponding amounts
    const ctx = document.getElementById("lineChart").getContext("2d");
    line_chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Income",
            data: incomeAmount,
            borderColor: "rgba(75, 192, 192, 1)",
            fill: false,
          },
          {
            label: "Expense",
            data: expenseAmount,
            borderColor: "rgba(255, 99, 132, 1)",
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        title: {
          display: true,
          text:
            month === "all"
              ? `Yearly Income vs Expense (${year})`
              : `Monthly Income vs Expense (${month}/${year})`,
        },
        scales: {
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: `Amount by ${cur}`,
              },
            },
          ],
        },
      },
    });
  }

  // Function to filter transactions by month and year
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

  // Function to aggregate monthly income and expense data for a year
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

  // Function to format date into human-readable format
  function formatDate(date) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }
});
