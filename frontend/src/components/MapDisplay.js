import React from 'react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import './MapDisplay.css';

const MapDisplay = ({ activities, destinationName }) => {
  if (!activities || activities.length === 0) {
    return <p>No locations to display on map.</p>;
  }

  // Filter activities that have valid coordinates
  const validActivities = activities.filter(
    act => typeof act.latitude === 'number' && typeof act.longitude === 'number'
  );

  if (validActivities.length === 0) {
    return <p>No valid locations with coordinates to display on map for {destinationName || 'this itinerary'}.</p>;
  }

  // Calculate center of the map - use the first valid activity's location
  // A more sophisticated approach might calculate the bounding box of all activities
  const centerLat = validActivities[0].latitude;
  const centerLng = validActivities[0].longitude;

  // Determine a reasonable zoom level
  // This is a heuristic. If points are very spread out, this might need adjustment
  // or dynamic calculation based on the bounding box of all points.
  let zoomLevel = 10;
  if (validActivities.length === 1) {
    zoomLevel = 12;
  }


  return (
    <div className="map-container">
      <h4>Map of Itinerary Locations for {destinationName || "Selected Destination"}</h4>
      <Map
        height={400}
        center={[centerLat, centerLng]}
        zoom={zoomLevel}
        attribution={false} // Opt-out of default OpenStreetMap attribution if desired & allowed
        metaWheelZoom={true}
        metaWheelZoomWarning="Use Cmd/Ctrl + scroll to zoom map"
      >
        <ZoomControl />
        {validActivities.map((activity, index) => (
          <Marker
            key={index}
            width={40} // Increased marker size
            anchor={[activity.latitude, activity.longitude]}
            color="#007bff" // Marker color
            payload={activity} // Store activity data in payload
            onClick={({ event, anchor, payload }) => {
              // Basic click handler: log to console or could open an InfoWindow
              console.log(`Clicked on: ${payload.placeName}`, payload);
              // alert(`Location: ${payload.placeName}
Time: ${payload.time}
Activity: ${payload.description}`);
            }}
          />
        ))}
      </Map>
      <p className="map-tooltip-info">Click on a marker to see details in the console. Use Cmd/Ctrl + scroll to zoom.</p>
    </div>
  );
};

export default MapDisplay;
