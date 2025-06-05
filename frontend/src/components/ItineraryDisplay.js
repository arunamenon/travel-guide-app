import React from 'react';
import MapDisplay from './MapDisplay'; // Import MapDisplay
import './ItineraryDisplay.css';

const ActivityItem = ({ activity }) => (
  <li className="activity-item">
    <strong>{activity.time}:</strong> {activity.description}
    <em> at {activity.placeName}</em>
    {activity.latitude && activity.longitude && (
      <small> (Lat: {activity.latitude.toFixed(4)}, Lng: {activity.longitude.toFixed(4)})</small>
    )}
  </li>
);

const DayCard = ({ dayData }) => (
  <div className="day-card">
    <h3>Day {dayData.day}{dayData.title && dayData.title !== `Day ${dayData.day}` ? `: ${dayData.title}` : ''}</h3>
    <ul className="activities-list">
      {dayData.activities.map((activity, index) => (
        <ActivityItem key={index} activity={activity} />
      ))}
    </ul>
  </div>
);

const ItineraryDisplay = ({ itinerary }) => {
  if (!itinerary || (!itinerary.recommendationSummary && (!itinerary.days || itinerary.days.length === 0))) {
    return null;
  }

  // Collect all activities from all days for the map
  const allActivities = itinerary.days ? itinerary.days.reduce((acc, day) => acc.concat(day.activities), []) : [];

  return (
    <div className="itinerary-display-container"> {/* Added a container */}
      <div className="itinerary-details">
        <h2>Travel Itinerary</h2>
        {itinerary.destinationName && itinerary.destinationName !== "Unknown Destination" && (
          <h3>Destination: {itinerary.destinationName}</h3>
        )}
        {itinerary.recommendationSummary && (
          <p className="recommendation-summary">{itinerary.recommendationSummary}</p>
        )}
        {itinerary.days && itinerary.days.length > 0 ? (
          itinerary.days.map((dayData) => (
            <DayCard key={dayData.day} dayData={dayData} />
          ))
        ) : (
          <p>No detailed itinerary available for this recommendation.</p>
        )}
      </div>
      {allActivities.length > 0 && (
        <MapDisplay activities={allActivities} destinationName={itinerary.destinationName} />
      )}
    </div>
  );
};

export default ItineraryDisplay;
