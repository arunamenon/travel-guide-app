const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'; // Example endpoint

// --- Helper Parsing Functions ---

function parseGeminiResponse(rawText) {
  const itinerary = {
    recommendationSummary: "",
    destinationName: "Unknown Destination", // Default
    days: []
  };

  try {
    // Extract Recommendation Summary
    const recSummaryMatch = rawText.match(/\*\*Recommendation:\*\*\s*([\s\S]*?)(?=\*\*Itinerary:\*\*|\*\*Day 1:\*\*|$)/i);
    if (recSummaryMatch && recSummaryMatch[1]) {
      itinerary.recommendationSummary = recSummaryMatch[1].trim();
    }

    // Attempt to extract destination name from summary or user's initial query (not available here)
    // This might need more sophisticated NLP or be part of the prompt's output structure.
    // For now, we'll try to get it from the first significant location if possible, or leave as default.

    // Extract Itinerary Days
    // Regex to find "Day X:" sections, then activities within each day
    const dayRegex = /\*\*Day\s*(\d+):\*\*\s*([\s\S]*?)(?=\*\*Day\s*\d+:\*\*|$)/gi;
    let dayMatch;
    while ((dayMatch = dayRegex.exec(rawText)) !== null) {
      const dayNumber = parseInt(dayMatch[1]);
      const dayContent = dayMatch[2].trim();
      const dayObject = { day: dayNumber, title: `Day ${dayNumber}`, activities: [] };

      // Extract activities within the day
      // Activities are expected to be list items like "- Morning: Description [Place Name, Lat: XX.XXXX, Lng: YY.YYYY]"
      const activityRegex = /-\s*(.*?):\s*(.*?)\s*\[(.*?),\s*Lat:\s*(-?\d+\.?\d*),\s*Lng:\s*(-?\d+\.?\d*)\s*\]/gi;
      let activityMatch;
      while ((activityMatch = activityRegex.exec(dayContent)) !== null) {
        const time = activityMatch[1].trim();
        const description = activityMatch[2].trim();
        const placeName = activityMatch[3].trim();
        const latitude = parseFloat(activityMatch[4]);
        const longitude = parseFloat(activityMatch[5]);

        if (!isNaN(latitude) && !isNaN(longitude)) {
          dayObject.activities.push({
            time,
            description,
            placeName,
            latitude,
            longitude
          });
          // Try to set destinationName from the first valid placeName if not already set by a more direct method
          if (itinerary.destinationName === "Unknown Destination" && placeName) {
            // This is a simple heuristic, might need improvement
            const possibleDestination = placeName.split(',')[0].trim(); // e.g. "Eiffel Tower, Paris" -> "Eiffel Tower"
            if (possibleDestination) itinerary.destinationName = possibleDestination;
          }
        }
      }
      if (dayObject.activities.length > 0) {
        itinerary.days.push(dayObject);
      }
    }

    // If no days were parsed but there's a recommendation, return that at least
    if (itinerary.days.length === 0 && !itinerary.recommendationSummary && rawText.length > 50) {
        // If parsing completely fails, return the raw text as the summary
        // and indicate that the itinerary couldn't be structured.
        itinerary.recommendationSummary = "Could not parse a structured itinerary. Raw AI Response: " +
          rawText.substring(0, 500) + (rawText.length > 500 ? "..." : "");
    } else if (itinerary.days.length === 0 && itinerary.recommendationSummary) {
        // Parsed summary but no itinerary items.
        // This is acceptable, Gemini might not always provide a full itinerary.
    }


  } catch (e) {
    console.error("Error parsing Gemini response:", e);
    // Fallback if parsing fails catastrophically
    itinerary.recommendationSummary = "Error while parsing the AI response. Raw data: " + rawText.substring(0, 500) + (rawText.length > 500 ? "..." : "");
    itinerary.days = [];
  }

  return itinerary;
}


// --- Main Service Function ---
const getTravelAdvice = async (userMessage) => {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Using mock response.');
    // Mock response for development when API key is not available
    const mockRawResponse = `
**Recommendation:**
For a trip to Paris, focusing on iconic landmarks and cultural experiences.

**Itinerary:**
**Day 1:** Arrival and Eiffel Tower
- Morning: Arrive in Paris, check into your hotel. [Hotel Le Example, Lat: 48.8584, Lng: 2.2945]
- Afternoon: Visit the Eiffel Tower for breathtaking views. [Eiffel Tower, Lat: 48.8584, Lng: 2.2945]
- Evening: Dinner cruise on the Seine River. [Bateaux Mouches, Lat: 48.8600, Lng: 2.3000]

**Day 2:** Louvre and Montmartre
- Morning: Explore the Louvre Museum and see the Mona Lisa. [Louvre Museum, Lat: 48.8606, Lng: 2.3376]
- Afternoon: Wander through the artistic streets of Montmartre. [Sacré-Cœur Basilica, Lat: 48.8867, Lng: 2.3431]
- Evening: Enjoy a traditional French dinner in Montmartre. [Le Consulat, Lat: 48.8865, Lng: 2.3397]

**Day 3:** Versailles
- Full Day: Day trip to the Palace of Versailles. [Palace of Versailles, Lat: 48.8049, Lng: 2.1204]
    `;
    const parsedMock = parseGeminiResponse(mockRawResponse);
    return {
      reply: parsedMock.recommendationSummary, // The summary from the parsed data
      itinerary: parsedMock, // The full structured itinerary
      rawText: mockRawResponse // Include raw text for debugging frontend if needed
    };
  }

  const prompt = `
You are a sophisticated travel planning AI. A user is looking for travel recommendations.
User's request: "${userMessage}"

Please provide:
1.  A concise **Recommendation:** summary for the trip.
2.  A detailed **Itinerary:** for at least 3 days.
    - For each day, label it clearly (e.g., **Day 1:**, **Day 2:**).
    - For each activity, use a bullet point list starting with "-".
    - Specify the time of day (e.g., Morning, Afternoon, Evening, Full Day).
    - Provide a description of the activity.
    - Include the specific **Place Name**.
    - Provide the **Latitude** and **Longitude** for the Place Name using "Lat: XX.XXXX" and "Lng: YY.YYYY" format.
    - Structure each activity like this: "- [Time]: [Description] [Place Name, Lat: XX.XXXX, Lng: YY.YYYY]"

Example of a day's activities:
**Day 1:** Theme Park Fun
- Morning: Explore Magic Kingdom. [Magic Kingdom, Lat: 28.4177, Lng: -81.5812]
- Afternoon: Lunch at Be Our Guest Restaurant. [Be Our Guest Restaurant, Lat: 28.4199, Lng: -81.5817]
- Evening: Fireworks over Cinderella Castle. [Cinderella Castle, Lat: 28.4191, Lng: -81.5812]

Ensure the entire response is plain text and follows this structure precisely.
Do not include any conversational text outside of this structured format after you begin the recommendation.
  `;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data && response.data.candidates && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0].text) {
      const rawTextResponse = response.data.candidates[0].content.parts[0].text;
      const parsedData = parseGeminiResponse(rawTextResponse);

      return {
        reply: parsedData.recommendationSummary || "Successfully received data, but summary was empty.", // Ensure there's always a reply
        itinerary: parsedData,
        rawText: rawTextResponse // For debugging or if frontend wants to show raw
      };
    } else {
      console.error('Unexpected response structure from Gemini API:', response.data);
      const fallbackItinerary = parseGeminiResponse("Error: Could not parse response from AI service due to unexpected structure.");
      return {
        reply: fallbackItinerary.recommendationSummary,
        itinerary: fallbackItinerary,
        rawText: "Error: Could not parse response from AI service due to unexpected structure."
      };
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
    let errorMessage = 'Failed to get recommendation from AI service.';
    if (error.response) {
        if (error.response.status === 403) errorMessage = 'AI service request forbidden. Check API key and permissions.';
        else if (error.response.status === 429) errorMessage = 'AI service rate limit exceeded. Please try again later.';
        else errorMessage = `AI service error: ${error.response.status} ${error.response.statusText}`;
    } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'AI service endpoint not found. Check the API URL.';
    }

    const errorItinerary = parseGeminiResponse(errorMessage); // Use parser to structure the error message
    return {
        reply: errorItinerary.recommendationSummary,
        itinerary: errorItinerary,
        rawText: errorMessage
    };
  }
};

module.exports = { getTravelAdvice, parseGeminiResponse }; // Exporting parser for potential testing
