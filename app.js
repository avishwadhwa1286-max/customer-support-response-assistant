let lastMessage = "";
let lastResponse = "";

// ===============================
// GENERATE AI RESPONSE
// ===============================

async function generateResponse() {

    const message =
        document.getElementById("customerMessage").value.trim();

    const tone =
        document.getElementById("tone").value;

    const language =
        document.getElementById("language").value;

    const length =
        document.getElementById("length").value;

    const responseBox =
        document.getElementById("responseBox");


    if (!message) {

        alert("Please enter a customer message.");

        return;
    }


    lastMessage = message;


    responseBox.innerHTML = `
        <div class="empty-state">
            <div class="ai-icon">🤖</div>
            <h3>AI is thinking...</h3>
            <p>Generating personalized response...</p>
        </div>
    `;


    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/generate",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message,
                    tone: tone,
                    language: language,
                    length: length
                })
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error || "Something went wrong."
            );
        }


        // Save generated response
        lastResponse = data.response;


        // Display response
        responseBox.innerHTML = `
            <p>${formatResponse(data.response)}</p>
        `;


        // Update AI analysis
        if (data.analysis) {

            document.getElementById("intent").innerText =
                data.analysis.intent || "Not detected";

            document.getElementById("sentiment").innerText =
                data.analysis.sentiment || "Not detected";

            document.getElementById("confidence").innerText =
                (data.analysis.confidence || 0) + "%";

            document.getElementById("score").innerText =
                (data.analysis.score || 0) + "/100";
        }


        // Save to history
        saveToHistory({

            message: message,

            response: data.response,

            tone: tone,

            language: language,

            length: length,

            score: data.analysis
                ? data.analysis.score
                : 0,

            time: new Date().toLocaleString()
        });


    } catch (error) {

        console.error("Backend Error:", error);


        responseBox.innerHTML = `
            <div class="empty-state">

                <div class="ai-icon">⚠️</div>

                <h3>Connection Error</h3>

                <p>
                    Unable to connect to the backend.
                    Please make sure Flask is running.
                </p>

            </div>
        `;
    }
}


// ===============================
// FORMAT RESPONSE
// ===============================

function formatResponse(text) {

    return text.replace(/\n/g, "<br>");
}


// ===============================
// COPY RESPONSE
// ===============================

function copyResponse() {

    const text =
        document.getElementById("responseBox").innerText;


    if (!text.trim()) {

        alert("Generate a response first.");

        return;
    }


    navigator.clipboard.writeText(text);

    alert("Response copied successfully!");
}


// ===============================
// REGENERATE
// ===============================

function regenerate() {

    if (!lastMessage) {

        alert("Generate a response first.");

        return;
    }


    generateResponse();
}


// ===============================
// SAVE HISTORY
// ===============================

function saveToHistory(item) {

    let history =
        JSON.parse(
            localStorage.getItem("supportAIHistory")
        ) || [];


    history.unshift(item);


    localStorage.setItem(
        "supportAIHistory",
        JSON.stringify(history)
    );
}


// ===============================
// LOAD HISTORY
// ===============================

function loadHistory() {

    const historyList =
        document.getElementById("historyList");


    if (!historyList) return;


    let history =
        JSON.parse(
            localStorage.getItem("supportAIHistory")
        ) || [];


    if (history.length === 0) {

        historyList.innerHTML = `
            <div class="empty-state">

                <div class="ai-icon">🕘</div>

                <h3>No history yet</h3>

                <p>
                    Generate your first AI response
                    to see it here.
                </p>

            </div>
        `;

        return;
    }


    historyList.innerHTML = history.map(
        (item, index) => `

        <div class="history-item"
             style="
                padding:20px;
                margin:15px 0;
                border:1px solid #ddd;
                border-radius:12px;
             ">

            <h3>
                📝 Customer Message
            </h3>

            <p>
                ${escapeHTML(item.message)}
            </p>

            <hr>

            <h3>
                🤖 AI Response
            </h3>

            <p>
                ${formatResponse(
                    escapeHTML(item.response)
                )}
            </p>

            <p>
                <strong>Tone:</strong>
                ${escapeHTML(item.tone)}
                &nbsp; | &nbsp;

                <strong>Language:</strong>
                ${escapeHTML(item.language)}
                &nbsp; | &nbsp;

                <strong>Length:</strong>
                ${escapeHTML(item.length)}
            </p>

            <small>
                🕒 ${escapeHTML(item.time)}
            </small>

        </div>

        `
    ).join("");
}


// ===============================
// CLEAR HISTORY
// ===============================

function clearHistory() {

    const confirmDelete =
        confirm(
            "Are you sure you want to clear all history?"
        );


    if (!confirmDelete) return;


    localStorage.removeItem(
        "supportAIHistory"
    );


    loadHistory();

    updateAnalytics();

    alert("History cleared successfully.");
}


// ===============================
// DASHBOARD / HISTORY / ANALYTICS
// ===============================

function showSection(section) {

    const sections =
        document.querySelectorAll(".page-section");


    sections.forEach(
        item => item.style.display = "none"
    );


    const selected =
        document.getElementById(section);


    if (selected) {

        selected.style.display = "block";
    }


    if (section === "history") {

        loadHistory();
    }


    if (section === "analytics") {

        updateAnalytics();
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ===============================
// PROFILE
// ===============================

function showProfile() {

    alert(
        "SupportAI User Profile\n\n" +
        "Role: Customer Support Agent\n" +
        "AI Assistant: Gemini\n" +
        "Status: Active"
    );
}


// ===============================
// ANALYTICS
// ===============================

function updateAnalytics() {

    let history =
        JSON.parse(
            localStorage.getItem("supportAIHistory")
        ) || [];


    const total =
        history.length;


    let totalScore = 0;


    history.forEach(item => {

        totalScore +=
            Number(item.score) || 0;

    });


    const average =
        total > 0
            ? Math.round(totalScore / total)
            : 0;


    const helpful =
        Number(
            localStorage.getItem(
                "supportAIHelpful"
            )
        ) || 0;


    const improve =
        Number(
            localStorage.getItem(
                "supportAIImprove"
            )
        ) || 0;


    const totalElement =
        document.getElementById(
            "totalResponses"
        );


    const helpfulElement =
        document.getElementById(
            "helpfulResponses"
        );


    const improveElement =
        document.getElementById(
            "improveResponses"
        );


    const averageElement =
        document.getElementById(
            "averageScore"
        );


    if (totalElement)
        totalElement.innerText = total;


    if (helpfulElement)
        helpfulElement.innerText = helpful;


    if (improveElement)
        improveElement.innerText = improve;


    if (averageElement)
        averageElement.innerText =
            average + "/100";
}


// ===============================
// HELPFUL FEEDBACK
// ===============================

function likeResponse() {

    let count =
        Number(
            localStorage.getItem(
                "supportAIHelpful"
            )
        ) || 0;


    count++;


    localStorage.setItem(
        "supportAIHelpful",
        count
    );


    alert("Thanks for your feedback! 👍");

    updateAnalytics();
}


// ===============================
// IMPROVE FEEDBACK
// ===============================

function dislikeResponse() {

    let count =
        Number(
            localStorage.getItem(
                "supportAIImprove"
            )
        ) || 0;


    count++;


    localStorage.setItem(
        "supportAIImprove",
        count
    );


    alert(
        "Thanks! We'll use your feedback to improve the response. 👎"
    );


    updateAnalytics();
}


// ===============================
// SECURITY HELPER
// ===============================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ===============================
// INITIAL LOAD
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showSection("dashboard");

        updateAnalytics();

    }
);
function logout() {
    localStorage.removeItem("supportAILoggedIn");
    window.location.href = "login.html";
}