import React, { useState, useEffect, useRef } from "react";
import "./Styles/Chatbot.css";
import apiFetch from "../utils/apiFetch";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hi there! I'm your Rakshak Service assistant. I can help you learn about our services or book security guards. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    numGuards: "",
    durationType: "hours",
    durationValue: "",
    cameraRequired: false,
    vehicleRequired: false,
    firstAid: false,
    walkieTalkie: false,
    bulletProof: false,
    fireSafety: false,
    message: "",
  });
  const [currentField, setCurrentField] = useState(null);
  const [isCollectingData, setIsCollectingData] = useState(false);
  const [cost, setCost] = useState(0);
  const [processingInput, setProcessingInput] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Available services
  const services = [
    "Club Guards",
    "Event Security",
    "Personal Security",
    "Property Guards",
    "Corporate Security",
    "Gunmen & Guard Dogs",
  ];

  // Booking intent keywords
  const bookingKeywords = [
    "book",
    "hire",
    "need",
    "want",
    "looking for",
    "require",
    "get",
    "how much",
    "cost",
    "price",
    "quote",
  ];

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Calculate cost when form data changes
  useEffect(() => {
    if (formData.numGuards) {
      const baseGuardCost = 1000;
      const serviceCharge = 1000;
      const optionalCosts = {
        cameraRequired: 500,
        vehicleRequired: 2500,
        firstAid: 150,
        walkieTalkie: 500,
        bulletProof: 2000,
        fireSafety: 750,
      };

      let calculatedCost = parseInt(formData.numGuards) * baseGuardCost;
      Object.entries(optionalCosts).forEach(([key, value]) => {
        if (formData[key]) calculatedCost += value;
      });

      calculatedCost += serviceCharge;
      calculatedCost *= 1.18; // GST 18%
      setCost(Math.round(calculatedCost));
    }
  }, [formData]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const addMessage = (text, sender) => {
    setMessages((prevMessages) => [...prevMessages, { text, sender }]);
  };

  const hasBookingIntent = (userInput) => {
    const input = userInput.toLowerCase();
    for (const keyword of bookingKeywords) {
      if (input.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  // Prevent multiple messages from being processed at once
  const processUserInput = async (userInput) => {
    if (processingInput) return;
    setProcessingInput(true);

    try {
      if (isCollectingData) {
        await handleFormInput(userInput);
      } else {
        setIsTyping(true);

        try {
          // In a real environment, this would call your API. For now, we'll simulate a response
          setTimeout(() => {
            // Check if the message has booking intent
            if (hasBookingIntent(userInput)) {
              addMessage(
                "I'd be happy to help you with booking our security services. Rakshak Service provides professional security solutions for various needs.",
                "bot"
              );

              // After a short delay, prompt them to book
              setTimeout(() => {
                addMessage(
                  "Would you like to proceed with booking a security service now?",
                  "bot"
                );
                addQuickReplies(["Yes, book now", "No, just inquiring"]);
              }, 1000);
            } else {
              addMessage(
                "Rakshak Service offers professional security services across Delhi NCR and Bihar. Our guards are well-trained and equipped to handle various security situations. How can we assist you today?",
                "bot"
              );

              // Check if it's a good time to suggest booking
              if (messages.length > 3) {
                setTimeout(() => {
                  addMessage(
                    "Would you like to learn about our services or would you prefer to book security services?",
                    "bot"
                  );
                  addQuickReplies([
                    "Tell me about services",
                    "I'd like to book",
                  ]);
                }, 1000);
              }
            }

            setIsTyping(false);
          }, 1000);
        } catch (error) {
          console.error("Error in bot processing:", error);

          // Fallback response
          addMessage(
            "I'm here to help with Rakshak Service services. We offer security solutions in Delhi, Noida, Gurgaon, Faridabad, Ghaziabad, Patna, and Muzaffarpur. Would you like to book a service or learn more about what we offer?",
            "bot"
          );
          addQuickReplies(["Tell me about services", "I'd like to book"]);

          setIsTyping(false);
        }
      }
    } finally {
      setProcessingInput(false);
    }
  };

  const addQuickReplies = (options) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { options, sender: "bot-options" },
    ]);
  };

  const handleQuickReplyClick = (reply) => {
    addMessage(reply, "user");

    // Use setTimeout to ensure messages appear in the correct order
    setTimeout(() => {
      if (reply === "Yes, book now" || reply === "I'd like to book") {
        startBookingProcess();
      } else if (reply === "No, just inquiring") {
        addMessage(
          "No problem! Feel free to ask any questions about our security services. Rakshak Service offers a range of services including Club Guards, Event Security, Personal Security, Property Guards, Corporate Security and more. We serve Delhi, Noida, Gurgaon, Faridabad, Ghaziabad, Patna, and Muzaffarpur.",
          "bot"
        );
      } else if (reply === "Tell me about services") {
        addMessage("Rakshak Service offers the following services:", "bot");
        setTimeout(() => {
          addMessage(
            "- Club Guards: Trained personnel for nightclubs and entertainment venues\n- Event Security: Security for concerts, conferences, and private events\n- Personal Security: Bodyguards and personal protection\n- Property Guards: Security for residential and commercial properties\n- Corporate Security: Comprehensive security solutions for businesses\n- Gunmen & Guard Dogs: Armed guards and trained K9 units for high-security needs",
            "bot"
          );

          setTimeout(() => {
            addMessage(
              "Which service would you like to know more about?",
              "bot"
            );
            addQuickReplies(services);
          }, 500);
        }, 500);
      } else if (services.includes(reply)) {
        // Fixed service selection flow
        if (currentField === "service") {
          // If we're in the booking flow, update the form
          updateFormData("service", reply);
          askNextQuestion("numGuards");
        } else {
          // If we're not in booking flow, tell about the service
          const serviceInfo = {
            "Club Guards":
              "Our Club Guards are specially trained to handle high-energy environments like nightclubs, bars, and entertainment venues. They maintain order, check IDs, and ensure the safety of all patrons and staff.",
            "Event Security":
              "Event Security officers are experienced in crowd management for concerts, conferences, weddings, and corporate gatherings. They provide access control, VIP protection, and emergency response.",
            "Personal Security":
              "Our Personal Security professionals offer discreet bodyguard services for individuals, executives, and VIPs. They are trained in close protection tactics and threat assessment.",
            "Property Guards":
              "Property Guards protect residential complexes, commercial buildings, and private properties. They perform regular patrols, monitor surveillance systems, and control access points.",
            "Corporate Security":
              "Corporate Security solutions include office security, executive protection, information security protocols, and employee safety training tailored to your business needs.",
            "Gunmen & Guard Dogs":
              "For high-security needs, we provide armed guards and trained K9 units. All armed personnel are licensed and highly trained in weapons handling and threat neutralization.",
          };

          addMessage(serviceInfo[reply], "bot");

          setTimeout(() => {
            addMessage("Would you like to book this service?", "bot");
            addQuickReplies([
              "Yes, book now",
              "No, tell me more about other services",
            ]);
          }, 1500);
        }
      } else if (currentField === "durationType") {
        updateFormData("durationType", reply === "Hours" ? "hours" : "months");
        askNextQuestion("cameraRequired");
      } else if (reply === "Yes" && currentField) {
        updateFormData(currentField, true);
        askNextQuestion(getNextField(currentField));
      } else if (reply === "No" && currentField) {
        updateFormData(currentField, false);
        askNextQuestion(getNextField(currentField));
      } else if (reply === "Submit booking") {
        submitForm();
      } else if (reply === "Cancel") {
        cancelBooking();
      } else if (reply === "No, tell me more about other services") {
        addMessage(
          "Here are the security services offered by Rakshak Service:",
          "bot"
        );
        addQuickReplies(services);
      }
    }, 300);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || processingInput) return;

    addMessage(inputValue, "user");
    processUserInput(inputValue);
    setInputValue("");
  };

  const startBookingProcess = () => {
    setIsCollectingData(true);
    addMessage(
      "Great! Let's book a security service for you. I'll need to collect some information.",
      "bot"
    );

    // Use timeout to ensure messages appear in the correct order
    setTimeout(() => {
      askNextQuestion("name");
    }, 500);
  };

  const cancelBooking = () => {
    setIsCollectingData(false);
    setCurrentField(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      service: "",
      numGuards: "",
      durationType: "hours",
      durationValue: "",
      cameraRequired: false,
      vehicleRequired: false,
      firstAid: false,
      walkieTalkie: false,
      bulletProof: false,
      fireSafety: false,
      message: "",
    });
    addMessage(
      "Booking process cancelled. How else can I help you with Rakshak Service services?",
      "bot"
    );
  };

  const handleFormInput = async (input) => {
    if (!currentField) return;

    if (currentField === "service") {
      const matchedService = services.find(
        (service) => service.toLowerCase() === input.toLowerCase()
      );

      // More flexible service matching
      let serviceMatch = null;
      for (const service of services) {
        if (input.toLowerCase().includes(service.toLowerCase())) {
          serviceMatch = service;
          break;
        }
      }

      if (matchedService || serviceMatch) {
        const selectedService = matchedService || serviceMatch;
        updateFormData("service", selectedService);
        askNextQuestion("numGuards");
      } else {
        addMessage(
          `Please select a valid service from the options provided:`,
          "bot"
        );
        addQuickReplies(services);
      }
    } else if (currentField === "numGuards") {
      const guards = parseInt(input);
      if (!isNaN(guards) && guards > 0) {
        updateFormData("numGuards", guards.toString());
        askNextQuestion("durationValue");
      } else {
        addMessage("Please enter a valid number of guards.", "bot");
      }
    } else if (currentField === "durationValue") {
      const duration = parseInt(input);
      if (!isNaN(duration) && duration > 0) {
        updateFormData("durationValue", duration.toString());
        askNextQuestion("durationType");
      } else {
        addMessage("Please enter a valid duration.", "bot");
      }
    } else if (
      [
        "cameraRequired",
        "vehicleRequired",
        "firstAid",
        "walkieTalkie",
        "bulletProof",
        "fireSafety",
      ].includes(currentField)
    ) {
      const response = input.toLowerCase();
      if (response === "yes" || response === "y") {
        updateFormData(currentField, true);
        askNextQuestion(getNextField(currentField));
      } else if (response === "no" || response === "n") {
        updateFormData(currentField, false);
        askNextQuestion(getNextField(currentField));
      } else {
        addMessage("Please answer with 'yes' or 'no'.", "bot");
        addQuickReplies(["Yes", "No"]);
      }
    } else {
      updateFormData(currentField, input);
      askNextQuestion(getNextField(currentField));
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };
      console.log(`Updated ${field} to ${value}`);
      console.log("Current form data:", newFormData);
      return newFormData;
    });
  };

  const getNextField = (currentField) => {
    const fieldOrder = [
      "name",
      "email",
      "phone",
      "service",
      "numGuards",
      "durationValue",
      "durationType",
      "cameraRequired",
      "vehicleRequired",
      "firstAid",
      "walkieTalkie",
      "bulletProof",
      "fireSafety",
      "message",
      "confirm",
    ];

    const currentIndex = fieldOrder.indexOf(currentField);
    if (currentIndex < fieldOrder.length - 1) {
      return fieldOrder[currentIndex + 1];
    } else {
      return "confirm";
    }
  };

  const askNextQuestion = (field) => {
    setCurrentField(field);
    console.log(`Asking question for field: ${field}`);

    // Add a small delay to ensure UI updates properly
    setTimeout(() => {
      switch (field) {
        case "name":
          addMessage("What's your name?", "bot");
          break;
        case "email":
          addMessage("What's your email address?", "bot");
          break;
        case "phone":
          addMessage("What's your phone number?", "bot");
          break;
        case "service":
          addMessage("Which security service are you interested in?", "bot");
          addQuickReplies(services);
          break;
        case "numGuards":
          addMessage("How many security guards do you need?", "bot");
          break;
        case "durationValue":
          addMessage("What's the duration of service needed?", "bot");
          break;
        case "durationType":
          addMessage("Is that in hours or months?", "bot");
          addQuickReplies(["Hours", "Months"]);
          break;
        case "cameraRequired":
          addMessage("Do you need camera surveillance? (adds ₹500)", "bot");
          addQuickReplies(["Yes", "No"]);
          break;
        case "vehicleRequired":
          addMessage("Do you require a security vehicle? (adds ₹2500)", "bot");
          addQuickReplies(["Yes", "No"]);
          break;
        case "firstAid":
          addMessage(
            "Do you need guards with first aid training? (adds ₹150)",
            "bot"
          );
          addQuickReplies(["Yes", "No"]);
          break;
        case "walkieTalkie":
          addMessage("Do you need walkie-talkie equipment? (adds ₹500)", "bot");
          addQuickReplies(["Yes", "No"]);
          break;
        case "bulletProof":
          addMessage(
            "Do you require bulletproof vests for the guards? (adds ₹2000)",
            "bot"
          );
          addQuickReplies(["Yes", "No"]);
          break;
        case "fireSafety":
          addMessage(
            "Do you need guards with fire safety training? (adds ₹750)",
            "bot"
          );
          addQuickReplies(["Yes", "No"]);
          break;
        case "message":
          addMessage(
            "Any additional message or requirements? (Optional)",
            "bot"
          );
          break;
        case "confirm":
          showBookingSummary();
          break;
        default:
          break;
      }
    }, 300);
  };

  const showBookingSummary = () => {
    const summary = `📋 *BOOKING SUMMARY*

👤 *Personal Details*
• Name: ${formData.name}
• Email: ${formData.email}
• Phone: ${formData.phone}

🛡️ *Service Details*
• Service Type: ${formData.service}
• Number of Guards: ${formData.numGuards}
• Duration: ${formData.durationValue} ${formData.durationType}

📌 *Additional Features*
• Camera Surveillance: ${formData.cameraRequired ? "✅ Yes (+₹500)" : "❌ No"}
• Security Vehicle: ${formData.vehicleRequired ? "✅ Yes (+₹2,500)" : "❌ No"}
• First Aid Training: ${formData.firstAid ? "✅ Yes (+₹150)" : "❌ No"}
• Walkie-Talkie Equipment: ${formData.walkieTalkie ? "✅ Yes (+₹500)" : "❌ No"}
• Bulletproof Vests: ${formData.bulletProof ? "✅ Yes (+₹2,000)" : "❌ No"}
• Fire Safety Training: ${formData.fireSafety ? "✅ Yes (+₹750)" : "❌ No"}
${formData.message ? `\n📝 *Additional Message*\n"${formData.message}"` : ""}

💰 *Estimated Cost: ₹${cost.toLocaleString("en-IN")}*
(Including 18% GST)
`;

    addMessage(summary, "bot");
    addMessage("Would you like to submit this booking?", "bot");
    addQuickReplies(["Submit booking", "Cancel"]);
  };

  const submitForm = async () => {
    setIsTyping(true);

    try {
      // Prepare the data for submission
      const bookingData = {
        ...formData,
        cost: cost,
        submitted_at: new Date().toISOString(),
        status: "Pending",
      };

      console.log(
        "Submitting booking data:",
        JSON.stringify(bookingData, null, 2)
      );

      const response = await apiFetch("/api/add-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        addMessage(
          "✅ Thank you for choosing Rakshak Service! Your booking has been submitted successfully. Our team will contact you soon to confirm the details.",
          "bot"
        );
        // Reset state after successful submission
        setIsCollectingData(false);
        setCurrentField(null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          service: "",
          numGuards: "",
          durationType: "hours",
          durationValue: "",
          cameraRequired: false,
          vehicleRequired: false,
          firstAid: false,
          walkieTalkie: false,
          bulletProof: false,
          fireSafety: false,
          message: "",
        });
      } else {
        const errData = await response.json();
        addMessage(
          "❌ Sorry, there was an error submitting your booking: " +
            (errData.error || "Unknown error."),
          "bot"
        );
      }
    } catch (error) {
      console.error("Network error:", error);
      addMessage(
        "❌ Sorry, there was a network error submitting your booking. Please try again later.",
        "bot"
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot-container">
      <button
        className={`chatbot-button ${isOpen ? "open" : ""}`}
        onClick={toggleChat}
      >
        {isOpen ? "×" : "Chat with us"}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Rakshak Service Assistant</h3>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index}>
                {message.sender === "bot" && (
                  <div className="bot-message">
                    <div className="message-content">{message.text}</div>
                  </div>
                )}

                {message.sender === "user" && (
                  <div className="user-message">
                    <div className="message-content">{message.text}</div>
                  </div>
                )}

                {message.sender === "bot-options" && (
                  <div className="quick-replies">
                    {message.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickReplyClick(option)}
                        disabled={processingInput}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="bot-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type your message..."
              ref={inputRef}
              disabled={processingInput}
            />
            <button type="submit" disabled={processingInput}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
