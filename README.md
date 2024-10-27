# Mental Health Concern Classification using NLP

This project aims to develop an end-to-end Natural Language Processing (NLP) solution for automatically extracting, classifying, and analyzing mental health concerns from user input. The solution uses models like RoBERTa and Mistral, along with custom Named Entity Recognition (NER) modules.

## Key Features:

* **Polarity Detection:** Tracks emotional polarity and shifts in sentiment over time.
* **Keyword Extraction (NER):** Identifies mental health-related phrases.
* **Concern Classification:** Categorizes extracted keywords into predefined concerns.
* **Intensity Scoring:** Assesses the severity of each concern on a scale of 1-10.
* **Timeline Sentiment Analysis:**  Visualizes the progression of mental health concerns over multiple inputs.

## Objectives:

The goal is to build an NLP pipeline that accurately:

* Detects and tracks emotional polarity.
* Extracts relevant mental health keywords.
* Classifies concerns into appropriate categories.
* Scores the intensity of concerns.
* Analyzes changes in concerns over time.

## Evaluation:

The project's success will be measured by the accuracy of each component and the overall pipeline's performance in processing raw user input into classified, scored, and time-analyzed output.  Specific metrics include:

* Polarity Detection Accuracy
* Extraction Accuracy
* Classification Precision
* Intensity Scoring Accuracy
* Timeline Analysis Effectiveness
* End-to-End Performance

This project is inspired by MindPeers, a mental health platform.  The images included show MindPeers' work and partnerships but are not directly related to the code or functionality of this NLP project.

## Project Workflow:

1. **User Interaction:**  User interacts with the chatbot on the frontend.
2. **Backend Analysis:**  The frontend sends the user's messages to the Flask backend.
3. **NLP Processing:** The backend performs sentiment analysis, dynamic question generation, and concern extraction/classification.
4. **Data Storage and Visualization:** The backend stores the data and generates a scatter plot.
5. **Frontend Display:**  The frontend displays the analysis results and the generated plot to the user.

## Technologies Used:

* **Frontend:** React, Tailwind CSS
* **Backend:** Flask, Python, TextBlob, Sentence Transformers, pandas, NumPy, Google Gemini, Matplotlib, scikit-learn
* **Deployment:** Render (for example)


## Frontend (React)

The frontend provides a chat interface where users can interact with a chatbot.  The chatbot initiates the conversation and gathers information about the user's feelings.  The user's input is then sent to the backend for analysis.  The frontend also displays the results of the analysis (polarity, concern, category, intensity) and a scatter plot visualizing the intensity of concerns over time.

## Backend (Flask)

The backend uses NLP techniques to process user input and extract relevant information.


## To run the project
```
git clone https://github.com/rayaankhan/megathon-24.git
```

### To run the Frontend
```
cd frontend
npm i
npm run dev
```

### To run the Backend
```
cd backend
pip3 install -r requirements.txt
python3 chatbot.py
```
- Create a `.env` file in this and add your Gemini API Key as: GOOGLE_API_KEY="<KEY>"

Open the frontend at http://localhost:5173