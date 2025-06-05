const { parseGeminiResponse } = require('./geminiService');

describe('parseGeminiResponse', () => {
  it('should parse a valid full response correctly', () => {
    const rawText = `
**Recommendation:**
This is a great trip to Paris.

**Itinerary:**
**Day 1:** Eiffel Tower
- Morning: Visit the Eiffel Tower. [Eiffel Tower, Lat: 48.8584, Lng: 2.2945]
- Afternoon: Lunch nearby. [Le Jules Verne, Lat: 48.8580, Lng: 2.2946]
**Day 2:** Louvre
- Full Day: Explore the Louvre. [Louvre Museum, Lat: 48.8606, Lng: 2.3376]
    `;
    const result = parseGeminiResponse(rawText);

    expect(result.recommendationSummary).toBe('This is a great trip to Paris.');
    expect(result.destinationName).toBe('Eiffel Tower'); // Takes first place name
    expect(result.days.length).toBe(2);
    expect(result.days[0].day).toBe(1);
    expect(result.days[0].activities.length).toBe(2);
    expect(result.days[0].activities[0].placeName).toBe('Eiffel Tower');
    expect(result.days[0].activities[0].latitude).toBe(48.8584);
    expect(result.days[0].activities[0].longitude).toBe(2.2945);
    expect(result.days[1].activities[0].time).toBe('Full Day');
  });

  it('should handle missing recommendation summary', () => {
    const rawText = `
**Itinerary:**
**Day 1:** Beach Day
- Morning: Sunbathing. [Main Beach, Lat: 34.0000, Lng: -118.0000]
    `;
    const result = parseGeminiResponse(rawText);
    expect(result.recommendationSummary).toBe('');
    expect(result.days.length).toBe(1);
    expect(result.days[0].activities[0].placeName).toBe('Main Beach');
  });

  it('should handle missing itinerary but present recommendation', () => {
    const rawText = `
**Recommendation:**
A relaxing beach vacation.
    `;
    const result = parseGeminiResponse(rawText);
    expect(result.recommendationSummary).toBe('A relaxing beach vacation.');
    expect(result.days.length).toBe(0);
  });

  it('should handle malformed activity string gracefully', () => {
    const rawText = `
**Itinerary:**
**Day 1:** Malformed
- Morning: This is not parsable.
- Afternoon: Good activity. [Good Place, Lat: 10.0, Lng: 20.0]
    `;
    const result = parseGeminiResponse(rawText);
    expect(result.days.length).toBe(1);
    expect(result.days[0].activities.length).toBe(1); // Only the valid one
    expect(result.days[0].activities[0].placeName).toBe('Good Place');
  });

  it('should handle empty or irrelevant text', () => {
    const rawText = 'This is just some random text.';
    const result = parseGeminiResponse(rawText);
    expect(result.recommendationSummary).toContain('Could not parse a structured itinerary. Raw AI Response:');
    expect(result.days.length).toBe(0);
  });

  it('should parse coordinates correctly, including negative and float values', () => {
    const rawText = `
**Itinerary:**
**Day 1:** Global Trek
- Morning: Equator. [Equator Line, Lat: 0.0000, Lng: -78.4558]
- Afternoon: South Pole. [South Pole, Lat: -90.0000, Lng: 0.0000]
    `;
    const result = parseGeminiResponse(rawText);
    expect(result.days[0].activities[0].latitude).toBe(0.0000);
    expect(result.days[0].activities[0].longitude).toBe(-78.4558);
    expect(result.days[0].activities[1].latitude).toBe(-90.0000);
  });

  it('should handle text with no valid activities but with day structure', () => {
    const rawText = `
**Recommendation:**
A test case.
**Itinerary:**
**Day 1:** No valid activities here
- Morning: Just talking about stuff.
- Afternoon: More talk.
**Day 2:** Still nothing
- Full Day: Blah.
    `;
    const result = parseGeminiResponse(rawText);
    expect(result.recommendationSummary).toBe('A test case.');
    expect(result.days.length).toBe(0); // No activities parsed means no days added
  });
});
