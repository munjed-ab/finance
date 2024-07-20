// function fetchReportData(year) {
//   $.ajax({
//     url: "/report/data",
//     method: "GET",
//     data: { year: year },
//     success: function (response) {
//       displayMonthlyAverages(response.monthly_averages);
//       displayYearlyComparisons(
//         response.current_year_data,
//         response.previous_year_data
//       );
//     },
//     error: function (xhr) {
//       console.error(xhr.responseText);
//     },
//   });
// }

function displayMonthlyAverages(monthlyAverages) {
  let avgIncomeHtml = "";
  let avgExpenseHtml = "";

  monthlyAverages.forEach(function (month) {
    avgIncomeHtml += `<li>Month ${month.date__month}: ${parseFloat(
      month.avg_income || 0
    ).toFixed(2)}</li>`;
    avgExpenseHtml += `<li>Month ${month.date__month}: ${parseFloat(
      month.avg_expense || 0
    ).toFixed(2)}</li>`;
  });

  document.getElementById("average-income").innerHTML = avgIncomeHtml;
  document.getElementById("average-expense").innerHTML = avgExpenseHtml;
}

function displayYearlyComparisons(currentYearData, previousYearData) {
  const currentYearIncome = parseFloat(
    currentYearData.total_income || 0
  ).toFixed(2);
  const currentYearExpense = parseFloat(
    currentYearData.total_expense || 0
  ).toFixed(2);
  const previousYearIncome = parseFloat(
    previousYearData.total_income || 0
  ).toFixed(2);
  const previousYearExpense = parseFloat(
    previousYearData.total_expense || 0
  ).toFixed(2);

  document.getElementById(
    "current-year-income"
  ).innerText = `Current Year Income: ${currentYearIncome}`;
  document.getElementById(
    "current-year-expense"
  ).innerText = `Current Year Expense: ${currentYearExpense}`;
  document.getElementById(
    "previous-year-income"
  ).innerText = `Previous Year Income: ${previousYearIncome}`;
  document.getElementById(
    "previous-year-expense"
  ).innerText = `Previous Year Expense: ${previousYearExpense}`;
}

$(document).ready(function () {
  const currentYear = new Date().getFullYear();
  //   fetchReportData(currentYear);

  $("#year-filter").change(function () {
    const selectedYear = $(this).val();
    // fetchReportData(selectedYear);
  });
});
