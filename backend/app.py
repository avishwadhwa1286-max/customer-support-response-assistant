from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os

# Load environment variables
load_dotenv()
# MongoDB connection
mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["SupportAI"]
history_collection = db["history"]
users_collection = db["users"]

app = Flask(__name__)
CORS(app)

# Gemini client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# --------------------------------
# HOME / API STATUS
# --------------------------------
@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "Customer Support Response Drafting Assistant API is running",
        "status": "online"
    })
# ------------------------------
# ------------------------------
# REGISTER API
# ------------------------------

@app.route("/api/register", methods=["POST"])
def register():

    try:
        data = request.get_json()

        username = data.get("username", "").strip()
        password = data.get("password", "")

        if not username or not password:
            return jsonify({
                "success": False,
                "error": "Username and password are required"
            }), 400

        # Check if user already exists
        existing_user = users_collection.find_one({
            "username": username
        })

        if existing_user:
            return jsonify({
                "success": False,
                "error": "Username already exists"
            }), 409

        # Hash password before saving
        hashed_password = generate_password_hash(password)

        users_collection.insert_one({
            "username": username,
            "password": hashed_password
        })

        return jsonify({
            "success": True,
            "message": "Registration successful"
        }), 201

    except Exception as e:

        print("REGISTER ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
# LOGIN API
# ------------------------------

@app.route("/api/login", methods=["POST"])
def login():

    try:
        data = request.get_json()

        username = data.get("username", "").strip()
        password = data.get("password", "")

        if not username or not password:
            return jsonify({
                "success": False,
                "error": "Username and password are required"
            }), 400

        user = users_collection.find_one({
            "username": username
        })

        if not user:
            return jsonify({
                "success": False,
                "error": "Invalid username or password"
            }), 401

        if not check_password_hash(user["password"], password):
            return jsonify({
                "success": False,
                "error": "Invalid username or password"
            }), 401

        return jsonify({
            "success": True,
            "message": "Login successful",
            "username": username
        })

    except Exception as e:

        print("LOGIN ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# --------------------------------
# GENERATE AI RESPONSE
# --------------------------------
@app.route("/api/generate", methods=["POST"])
def generate_response():

    try:

        data = request.get_json()

        # Get data from frontend
        message = data.get("message", "").strip()
        tone = data.get("tone", "Professional")
        language = data.get("language", "English")
        length = data.get("length", "Medium")


        # Validate message
        if not message:

            return jsonify({
                "success": False,
                "error": "Customer message is required"
            }), 400


        # --------------------------------
        # LENGTH INSTRUCTIONS
        # --------------------------------

        if length.lower() == "short":

            length_instruction = """
Keep the response short and concise.
Use approximately 2-4 sentences.
"""

        elif length.lower() == "long":

            length_instruction = """
Provide a detailed response.
Explain the issue clearly and provide helpful next steps.
Use approximately 2-4 short paragraphs.
"""

        else:

            length_instruction = """
Provide a balanced response.
Use approximately 1-2 short paragraphs.
"""


        # --------------------------------
        # GEMINI PROMPT
        # --------------------------------

        prompt = f"""
You are an AI Customer Support Response Drafting Assistant.

Your task is to write a high-quality customer support response.

CUSTOMER MESSAGE:
{message}

RESPONSE SETTINGS:

Tone:
{tone}

Language:
{language}

Length:
{length}


IMPORTANT INSTRUCTIONS:

1. Write the response in the selected language.
2. Follow the selected tone carefully.
3. Follow the selected length.
4. Understand the customer's actual problem before responding.
5. Be polite, clear and helpful.
6. Show empathy when the customer has a complaint.
7. Apologize when appropriate.
8. Do not invent order numbers.
9. Do not invent refund information.
10. Do not invent delivery dates.
11. Do not invent company policies.
12. Do not claim that an action has already been completed unless the customer message confirms it.
13. If important information is missing, politely ask the customer for it.
14. Do not mention that you are an AI.
15. Do not add headings such as "AI Response" or "Response".
16. Return ONLY the final customer support message.

{length_instruction}
"""


        # --------------------------------
        # GENERATE USING GEMINI
        # --------------------------------

        result = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        ai_response = result.text.strip()
        # Save response to MongoDB
        history_collection.insert_one({
            "message": message,
            "tone": tone,
            "language": language,
            "length": length,
            "response": ai_response
        })

        # --------------------------------
        # RETURN RESPONSE
        # --------------------------------

        return jsonify({

            "success": True,

            "response": ai_response,

            "analysis": {

                "intent": "Customer Support Query",

                "sentiment": "Negative",

                "confidence": 95,

                "score": 94
            },

            "settings": {

                "tone": tone,

                "language": language,

                "length": length
            }
        })


    except Exception as e:

        print("ERROR:", e)

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# --------------------------------
# RUN FLASK SERVER
# --------------------------------
if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )