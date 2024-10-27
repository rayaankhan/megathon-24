import { useState, useEffect } from "react";

const Chatbot = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "How have you been feeling lately?", type: "bot" },
  ]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFirstResponse, setIsFirstResponse] = useState(true);

  const [polarity, setPolarity] = useState("");
  const [concern, setConcern] = useState("");
  const [category, setCategory] = useState("");
  const [intensity, setIntensity] = useState("");

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return; // Avoid sending empty messages

    const newUserMessage = { text: message, type: "user" };

    // Update messages state
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newUserMessage];
      return updatedMessages; // Return the updated messages state
    });

    setMessage(""); // Clear input after setting the message

    // Handle the first user response
    if (isFirstResponse) {
      // Fetch questions after the first user response
      await fetchQuestions(); // Fetch questions after the first user input
      setIsFirstResponse(false); // Update the state to indicate the first response is handled
    } else {
      // Check if we have questions to ask
      if (questions.length > 0 && currentQuestionIndex < questions.length) {
        // Move to the next question
        console.log("current idx: ", currentQuestionIndex);
        setCurrentQuestionIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;

          // If there are still questions, prompt the next one
          if (nextIndex < questions.length) {
            setMessages((prevMessages) => [
              ...prevMessages,
              { text: questions[nextIndex], type: "bot" }, // Ask the next question
            ]);
          } else {
            console.log("No more questions to ask.");
          }
          return nextIndex; // Return the updated question index
        });
        console.log("current idx: ", currentQuestionIndex);

        // if its the last question, send responses to backend
        if (currentQuestionIndex >= questions.length - 2) {
          console.log("last question");
          setQuestions([]);
          setCurrentQuestionIndex(0);
          setIsFirstResponse(true);
          await sendResponsesToBackend();
          setMessages([
            { text: "How have you been feeling lately?", type: "bot" },
          ]);
        }
      }
    }
  };

  const sendResponsesToBackend = async () => {
    try {
      console.log("last", messages);
      const res = await fetch("https://megathon-24.onrender.com/saveResponses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }), // Send the responses as JSON
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Responses saved successfully:", data.reply);
        setPolarity(data.reply.Polarity);
        setConcern(data.reply["Extracted Concern"]);
        setCategory(data.reply.Category);
        setIntensity(data.reply.Intensity);
        // Optionally handle success message to user
      } else {
        console.error("Failed to save responses");
      }
    } catch (error) {
      console.error("Error sending responses to backend:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch("https://megathon-24.onrender.com/getlistquestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }), // Send the user's message
      });

      if (res.ok) {
        const js = await res.json();
        const data = js.list_questions; // Assuming data is an array of questions
        setQuestions(data); // Set the fetched questions

        // Start the conversation with the first question if available
        if (data.length > 0) {
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: data[0], type: "bot" }, // Ask the first question
          ]);
        }
      } else {
        console.error("Failed to get questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const [plotUrl, setPlotUrl] = useState("");

  useEffect(() => {
    // Fetch the plot from the backend
    const fetchPlot = async () => {
      const response = await fetch("https://megathon-24.onrender.com/plot"); // Change the URL based on your backend setup
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPlotUrl(url);
    };

    fetchPlot();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <nav className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Mental Health</div>
          <ul className="flex space-x-6">
            {/* <li>
              <a href="#" className="hover:text-yellow-500 transition">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-500 transition">
                Features
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-500 transition">
                Contact
              </a>
            </li> */}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-grow">
        <div className="w-[40vw] h-[90vh] p-4 overflow-hidden">
          <div className="h-full bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-md shadow ${
                      msg.type === "user"
                        ? "bg-gray-100 text-right"
                        : "bg-blue-100 text-left"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>
            <form
              onSubmit={handleSubmit}
              className="bg-gray-200 p-4 flex items-center"
            >
              <input
                type="text"
                value={message}
                onChange={handleChange}
                placeholder="Type a message..."
                className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-yellow-500"
              />
              <button
                type="submit"
                className="ml-3 bg-yellow-600 text-white p-3 rounded-md shadow hover:bg-yellow-700 transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="w-[60vw] h-[90vh] flex flex-col justify-center items-center p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-8 w-full max-w-md">
            {/* Polarity */}
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Polarity
              </h2>
              <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-center text-xl shadow-lg">
                {polarity}
              </div>
            </div>

            {/* Concern */}
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Concern
              </h2>
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-white text-center text-xl shadow-lg">
                {concern}
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Category
              </h2>
              <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center text-white text-center text-xl shadow-lg">
                {category}
              </div>
            </div>

            {/* Intensity */}
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Intensity
              </h2>
              <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center text-white text-center text-xl shadow-lg">
                {intensity}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold mb-4">
          {/* Category vs Intensity Plot */}
        </h2>
        {plotUrl ? (
          <img
            src={plotUrl}
            alt="Category vs Intensity Scatter Plot"
            className="border rounded shadow-lg"
          />
        ) : (
          <p>Loading plot...</p>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-auto shadow-inner">
        <div className="container mx-auto text-center">
          &copy; 2024 My Application. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Chatbot;
