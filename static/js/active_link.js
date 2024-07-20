document.addEventListener("DOMContentLoaded", function () {
  // Function to set active link based on current path
  function setActiveLink() {
    var path = window.location.pathname;
    var navLinks = document.querySelectorAll("#sidebar .nav-link");

    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === path) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  // Set active link when page loads
  setActiveLink();

  // Handle click events on navigation links
  document.querySelectorAll("#sidebar .nav-link").forEach(function (link) {
    link.addEventListener("click", function (event) {
      // Remove 'active' class from all links
      document.querySelectorAll("#sidebar .nav-link").forEach(function (link) {
        link.classList.remove("active");
      });

      // Add 'active' class to the clicked link
      link.classList.add("active");
    });
  });
});
