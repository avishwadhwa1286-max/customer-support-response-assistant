const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;

    loginError.innerText = "";

    try {

        const response = await fetch("http://127.0.0.1:5000/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })

        });

        const data = await response.json();

        if (data.success) {

            // Login successful
            localStorage.setItem("supportAILoggedIn", "true");
            localStorage.setItem("supportAIUsername", data.username);

            window.location.href = "index.html";

        } else {

            loginError.innerText =
                data.error || "Invalid username or password.";
        }

    } catch (error) {

        console.error("Login Error:", error);

        loginError.innerText =
            "Unable to connect to server.";
    }

});
const registerBox = document.getElementById("registerBox");
const registerForm = document.getElementById("registerForm");
const registerError = document.getElementById("registerError");

const showRegister = document.getElementById("showRegister");
const backToLogin = document.getElementById("backToLogin");

showRegister.addEventListener("click", function (event) {

    event.preventDefault();

    document.getElementById("loginForm").style.display = "none";
    registerBox.style.display = "block";

});

backToLogin.addEventListener("click", function (event) {

    event.preventDefault();

    registerBox.style.display = "none";
    document.getElementById("loginForm").style.display = "block";

});

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username =
        document.getElementById("registerUsername").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    registerError.innerText = "";

    try {

        const response = await fetch("http://127.0.0.1:5000/api/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })

        });

        const data = await response.json();

        if (data.success) {

            alert("Account created successfully!");

            registerForm.reset();

            registerBox.style.display = "none";
            document.getElementById("loginForm").style.display = "block";

        } else {

            registerError.innerText =
                data.error || "Registration failed.";

        }

    } catch (error) {

        console.error("Register Error:", error);

        registerError.innerText =
            "Unable to connect to server.";

    }

});