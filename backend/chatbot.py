import os
from dotenv import load_dotenv

from flask import Flask, request, jsonify
import json
import csv
from flask_cors import CORS

import pandas as pd
import google.generativeai as genai
from sklearn.model_selection import train_test_split
from sentence_transformers import SentenceTransformer
from sentence_transformers import util
import numpy as np
from textblob import TextBlob
from datetime import datetime
import io
import matplotlib.pyplot as plt
from flask import send_file

app = Flask(__name__)
CORS(app)

load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

file_path = 'most_frequent_values.csv'
df = pd.read_csv(file_path)

train_df, test_df = train_test_split(df, test_size=0.1, random_state=42)

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
train_embeddings = model.encode(train_df['User Input'].tolist())
test_embeddings = model.encode(test_df['User Input'].tolist())

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
new_user_input = test_df.iloc[0]

# Follow-up questions categorized by keywords
follow_up_questions = {
    "sad": [
        "What specific thoughts are making you feel this way?",
        "Can you remember a specific moment when you felt particularly sad?"
    ],
    "anxious": [
        "What are the main sources of your anxiety right now?",
        "How does your anxiety affect your daily life?"
    ],
    "happy": [
        "What activities or people make you feel happy?",
        "Have you had any positive experiences lately that you would like to share?"
    ],
    "excited": [
        "What has been exciting you lately?",
        "Are there any new experiences or opportunities you’re looking forward to?"
    ],
    "frustrated": [
        "What is causing your frustration?",
        "How do you usually cope when you feel frustrated?"
    ],
    "overwhelmed": [
        "What aspects of your life are feeling overwhelming right now?",
        "Have you thought about how to manage these overwhelming feelings?"
    ],
    "tired": [
        "How well are you sleeping these days?",
        "Are there any stressors keeping you from getting enough rest?"
    ]
}

def analyze_response(response):
    # Analyze the response using TextBlob to derive sentiment
    analysis = TextBlob(response)
    sentiment_score = analysis.sentiment.polarity
    
    # Determine sentiment based on the score
    if sentiment_score < -0.6:
        return "sad"
    elif -0.6 <= sentiment_score < -0.2:
        return "frustrated"
    elif -0.2 <= sentiment_score < 0:
        return "anxious"
    elif 0 <= sentiment_score < 0.3:
        return "happy"
    elif sentiment_score >= 0.3:  # Adjusted threshold for "excited"
        return "excited"
    else:
        return "happy"  # Default to happy for neutral scores

def get_dynamic_questions(sentiment):
    # Return follow-up questions based on sentiment
    return follow_up_questions.get(sentiment, ["Can you share more about your feelings?"])

def get_dynamic_questions_list(user_input_one):
    
    sentiment = analyze_response(user_input_one)
    # Get dynamic follow-up questions based on sentiment
    dynamic_questions = get_dynamic_questions(sentiment)
    return dynamic_questions


def format_messages(messages):
    formatted_output = []
    
    for message in messages:
        if message['type'] == 'bot':
            formatted_output.append(f"Chatbot: {message['text']}")
        elif message['type'] == 'user':
            formatted_output.append(f"User: {message['text']}")
    
    return "\n".join(formatted_output)

list_questions = []

@app.route('/getlistquestions', methods=['POST'])
def get_list_questions():
    list_questions = []
    data = request.json
    message = data.get('message', '')
    list_questions = get_dynamic_questions_list(message)
    a = list_questions.copy()
    a.append("")
    return jsonify({'list_questions': a})


# Specify the file name
csv_file = 'response_data.csv'
headers = ['time', 'Polarity', 'Extracted Concern', 'Category', 'Intensity']

def write_data_to_csv(data):
    # Check if the file exists
    file_exists = False
    try:
        with open(csv_file, mode='r', newline='') as check_file:
            file_exists = True  # If we can read the file, it exists
    except FileNotFoundError:
        file_exists = False  # If the file does not exist, we will create it

    # Write the data to a CSV file
    with open(csv_file, mode='a', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        if not file_exists:
            writer.writeheader()  # Write the header only if the file didn't exist
        writer.writerow(data)

    return jsonify({'status': 'success'})

def find_top_closest_embeddings(new_input, top_n=5):
    new_embedding = model.encode(new_input)
    cosine_similarities = util.pytorch_cos_sim(new_embedding, train_embeddings)
    top_indices = np.argsort(cosine_similarities.numpy()[0])[-top_n:][::-1]
    closest_rows = df.iloc[top_indices]
    return closest_rows

def prompt_gemini_model(new_user_input, closest_rows):
    prompt = "Hey Gemini irrespective of the your previous knowledge, observe the relationship between the given 5 User Inputs and their Extracted Concern, Polarity, Category and Intensity\n"
    for index, row in closest_rows.iterrows():
        prompt += f"- User Input: {row['User Input']}\n"
        prompt += f"  Polarity: {row['Polarity']}, Extracted Concern: {row['Extracted Concern']}, Category: {row['Category']}, Intensity: {row['Intensity']}\n"
    prompt += "Now for the below user input, output the Polarity, Extracted Concern, Category and Intensity in a json format without any other essay\n"
    prompt += new_user_input
    return prompt

def get_gemini_response(chat_log):
    conversation_log = format_messages(chat_log)
    closest_info = find_top_closest_embeddings(conversation_log)
    
    # Generate a prompt from the Gemini model
    gemini_prompt = prompt_gemini_model(conversation_log, closest_info)
    response = genai.GenerativeModel('gemini-1.5-flash-001').generate_content(gemini_prompt)
    return response

# Saving the chat log and responses to a CSV file
@app.route('/saveResponses', methods=['POST'])
def save_response():
    request_data = request.json
    chat_log = request_data.get('messages', '')
    response = get_gemini_response(chat_log)
    
    # Extract the JSON data from the response
    modified_string = response.text[8:-4]
    valid_json_string = modified_string
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    data = json.loads(valid_json_string)
    data['time'] = current_time

    # Write the data to a CSV file
    write_data_to_csv(data)

    return jsonify({'reply': data})


import matplotlib
import matplotlib.dates as mdates
matplotlib.use('Agg')  # Set backend to non-interactive

@app.route('/plot')
def plot():
    # Check if the CSV file exists
    csv_file = 'response_data.csv'
    
    if not os.path.exists(csv_file):
        # If the file is not found, return a suitable message
        return jsonify({'error': 'CSV file not found'}), 404

    # Load the CSV data
    df = pd.read_csv(csv_file)

    # Convert 'time' column to datetime format and sort by time
    df['time'] = pd.to_datetime(df['time'])
    df = df.sort_values(by='time')

    # Get unique categories
    categories = df['Category'].unique()
    
    # Use the new recommended way to get colormap
    cmap = plt.colormaps['tab10']
    color_dict = {category: cmap(i/len(categories)) for i, category in enumerate(categories)}

    # Create figure and axis objects explicitly
    fig, ax = plt.subplots(figsize=(12, 6))  # Made wider to accommodate time labels
    
    # Create the scatter plot using axis object with time on x-axis
    for category in categories:
        category_data = df[df['Category'] == category]
        ax.scatter(category_data['time'], 
                  category_data['Intensity'],
                  color=color_dict[category], 
                  label=category, 
                  s=100)

    # Format x-axis to show dates nicely
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))  # Only show time
    plt.xticks(rotation=90) 
    
    # Add labels, title, and grid using axis object
    ax.set_xlabel('Time')
    ax.set_ylabel('Intensity')
    ax.set_title('Intensity over Time by Category')
    ax.grid(True, alpha=0.3)
    ax.legend(title="Categories", bbox_to_anchor=(1.05, 1), loc='upper left')

    # Adjust layout to prevent label cutoff
    fig.tight_layout()
    
    # Save plot to an in-memory bytes buffer
    img = io.BytesIO()
    fig.savefig(img, format='png', bbox_inches='tight')
    img.seek(0)

    # Clean up
    plt.close(fig)

    # Return the image as a response
    return send_file(img, mimetype='image/png')

@app.route('/hello',methods=['GET'])
def hello():
    print("Hello, World!")
    return jsonify({'message': 'Hello, World!'})
