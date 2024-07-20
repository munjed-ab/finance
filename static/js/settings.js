document.addEventListener("DOMContentLoaded", () => {
  const settingsForm = document.getElementById("settingsForm");
  const passwordResetForm = document.getElementById("passwordResetForm");
  const msg1 = document.getElementById("message1");
  const msg2 = document.getElementById("message2");

  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const username = document.getElementById("username").value.trim();

      const payload = {};
      if (email) payload.email = email;
      if (username) payload.username = username;

      try {
        const response = await fetch("/update-settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("token", data.access_token);
          msg1.textContent = "Settings updated successfully!";
          msg1.style.color = "green";
        } else {
          const errorData = await response.json();
          msg1.textContent = errorData.detail;
          msg1.style.color = "red";
        }
      } catch (error) {
        msg1.textContent = "An error occurred. Please try again.";
        msg1.style.color = "red";
      }
    });
  }

  if (passwordResetForm) {
    passwordResetForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const current_password = document
        .getElementById("current_password")
        .value.trim();
      const password = document.getElementById("password").value.trim();
      const password2 = document.getElementById("password2").value.trim();

      const payload = { current_password, password, password2 };

      try {
        const response = await fetch("/reset-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          msg2.textContent = "Password reset successfully!";
          msg2.style.color = "green";
          passwordResetForm.reset();
        } else {
          const errorData = await response.json();
          msg2.textContent = errorData.detail;
          msg2.style.color = "red";
        }
      } catch (error) {
        msg2.textContent = "An error occurred. Please try again.";
        msg2.style.color = "red";
      }
    });
  }
});
