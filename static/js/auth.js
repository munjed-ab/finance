document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const password2 = document.getElementById("password2").value;
      const message = document.getElementById("message");
      try {
        const response = await fetch("/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            password2: password2,
          }),
        });
        if (response.ok) {
          message.textContent = "Sign up successful! Please log in.";
          message.style.color = "green";
        } else {
          const errorData = await response.json();
          message.textContent = errorData.detail;
          message.style.color = "red";
        }
      } catch (error) {
        message.textContent = "An error occurred. Please try again.";
        message.style.color = "red";
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const message = document.getElementById("message");
      try {
        const response = await fetch("/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: email,
            password: password,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("token", data.access_token);
          setCookie("Authorization", data.access_token, 1);
          message.textContent = "Login successful!";
          message.style.color = "green";
          // Redirect to profile or dashboard after login
          window.location.href = "/transactions"; // Redirect to a profile page
        } else {
          const errorData = await response.json();
          message.textContent = errorData.detail;
          message.style.color = "red";
        }
      } catch (error) {
        message.textContent = "An error occurred. Please try again.";
        message.style.color = "red";
      }
    });
  }

  // Function to fetch user profile data
  async function fetchUserProfile() {
    const token = localStorage.getItem("token");
    console.log(token);
    if (!token) {
      window.location.href = "/login"; // Redirect to login if no token
      return;
    }

    try {
      const response = await fetch("/users/me/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Display user data
        document.getElementById(
          "username"
        ).textContent = `Welcome, ${data.username}`;
        console.log(data.username);

        document.getElementById(
          "is_superuser"
        ).textContent = `Welcome, ${data.is_superuser}`;

        document.getElementById("email").textContent = `Welcome, ${data.email}`;
        console.log(data.email);
      } else {
        // Handle errors (e.g., token expired, invalid token)
        const errorData = await response.json();
        console.error("Error:", errorData.detail);
        window.location.href = "/login"; // Redirect to login on error
      }
    } catch (error) {
      console.error("An error occurred:", error);
      window.location.href = "/login"; // Redirect to login on error
    }
  }

  // Call fetchUserProfile if on profile page
  if (window.location.pathname === "/profile") {
    fetchUserProfile();
  }

  // Logout function
  async function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  // Attach logout function to logout link
  const logoutLink = document.querySelector('a[href="/logout"]');
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }
});
