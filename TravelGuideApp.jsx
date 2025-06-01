import { useState } from "react";

export default function TravelGuideApp() {
  const [location, setLocation] = useState("");
  const [preferences, setPreferences] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);

  const callOpenAI = async (destination, prefs, key) => {
    const prompt = `Create a 3-day itinerary for a trip to ${destination} considering these preferences: ${prefs}.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${errorText}`);
    }

    const result = await response.json();
    return { plan: result.choices[0].message.content.trim() };
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await callOpenAI(location, preferences, apiKey);
      setItinerary(data.plan || "No itinerary returned.");
    } catch (e) {
      console.error(e);
      setItinerary(`Error generating itinerary: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Travel Guide Generator</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="password"
          placeholder="Enter your OpenAI API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <input
          placeholder="Enter destination (e.g. Cancun, Paris)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <textarea
          placeholder="Describe your preferences (e.g. nature, nightlife, vegetarian food)"
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", minHeight: "100px", marginBottom: "0.5rem" }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !apiKey}
          style={{ padding: "0.75rem 1.5rem", backgroundColor: "#0070f3", color: "white", border: "none", cursor: "pointer" }}
        >
          {loading ? "Generating..." : "Generate Itinerary"}
        </button>
      </div>

      {itinerary && (
        <div style={{ backgroundColor: "#f4f4f4", padding: "1rem", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Suggested Itinerary</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>{itinerary}</pre>
        </div>
      )}
    </div>
  );
}
