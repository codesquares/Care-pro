# CarePro Location & Address Implementation Guide

This guide provides a comprehensive roadmap for implementing address capture and location-based services in the CarePro platform to enable direction services and distance calculations between caregivers and clients.

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Database Schema Enhancements](#database-schema-enhancements)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend API Enhancements](#backend-api-enhancements)
5. [Coordinate Extraction Implementation](#coordinate-extraction-implementation)
6. [Integration Points for Directions](#integration-points-for-directions)
7. [Migration Strategy](#migration-strategy)
8. [Additional Features](#additional-features)

## 🔍 Current State Analysis

### Existing Address Fields

#### **Caregiver Side:**
- ✅ `HomeAddress` and `Location` fields exist in `Caregiver` entity
- ✅ Backend DTOs include these fields
- ✅ Update endpoints exist for location updates

#### **Client Side:**
- ✅ Only `HomeAddress` field exists in `Client` entity
- ❌ No service location capture
- ❌ No coordinates system for distance calculations

#### **Service/Order System:**
- ❌ Orders don't capture service location
- ❌ No distance/direction calculations
- ❌ No transportation fee system

## 🗄️ Database Schema Enhancements

### 1. Caregiver Entity Enhancement

```csharp
// Add to Domain.Entities.Caregiver
public class Caregiver 
{
    // ...existing fields...
    public string? HomeAddress { get; set; } // Existing
    public string? Location { get; set; } // Existing
    
    // NEW FIELDS TO ADD:
    public string? ServiceArea { get; set; } // Areas they're willing to serve
    public double? HomeLatitude { get; set; }
    public double? HomeLongitude { get; set; }
    public double? MaxServiceRadius { get; set; } // in kilometers
    public bool? WillTravelToClients { get; set; }
    public decimal? TransportationRate { get; set; } // Rate per km for travel
}
```

### 2. Client Entity Enhancement

```csharp
// Add to Domain.Entities.Client
public class Client
{
    // ...existing fields...
    public string? HomeAddress { get; set; } // Existing
    
    // NEW FIELDS TO ADD:
    public double? HomeLatitude { get; set; }
    public double? HomeLongitude { get; set; }
    public string? PreferredServiceLocation { get; set; } // Default service location
    public double? ServiceLatitude { get; set; }
    public double? ServiceLongitude { get; set; }
}
```

### 3. Order Entity Enhancement

```csharp
// Add to Domain.Entities.ClientOrder
public class ClientOrder
{
    // ...existing fields...
    
    // NEW FIELDS TO ADD:
    public string? ServiceAddress { get; set; } // Where service will be rendered
    public double? ServiceLatitude { get; set; }
    public double? ServiceLongitude { get; set; }
    public double? DistanceFromCaregiver { get; set; } // in kilometers
    public decimal? TransportationFee { get; set; } // Additional transportation cost
    public bool? RequiresTransportation { get; set; }
}
```

## 🎨 Frontend Implementation

### 1. Caregiver Settings Enhancement

**File:** `/frontend/vite-project/src/main-app/components/caregiver_settings/CaregiverSettings.jsx`

Add to the existing settings form:

```jsx
// Add these form groups to the caregiver settings
<div className="form-group">
  <label htmlFor="homeAddress">Home Address</label>
  <input
    type="text"
    id="homeAddress"
    name="homeAddress"
    value={profile.homeAddress || ''}
    onChange={handleProfileChange}
    placeholder="Enter your complete home address"
  />
  <button type="button" onClick={handleGeocodeAddress}>
    📍 Get Coordinates
  </button>
</div>

<div className="form-group">
  <label htmlFor="serviceArea">Service Areas</label>
  <textarea
    id="serviceArea" 
    name="serviceArea"
    value={profile.serviceArea || ''}
    onChange={handleProfileChange}
    placeholder="List areas you're willing to provide services (e.g., Lagos Island, Victoria Island, Lekki)"
  />
</div>

<div className="form-group">
  <label htmlFor="maxServiceRadius">Maximum Service Distance (km)</label>
  <input
    type="number"
    id="maxServiceRadius"
    name="maxServiceRadius"
    value={profile.maxServiceRadius || 10}
    onChange={handleProfileChange}
    min="1"
    max="50"
  />
</div>

<div className="form-group">
  <label>
    <input
      type="checkbox"
      name="willTravelToClients"
      checked={profile.willTravelToClients || false}
      onChange={handleProfileChange}
    />
    I'm willing to travel to client locations
  </label>
</div>

{profile.willTravelToClients && (
  <div className="form-group">
    <label htmlFor="transportationRate">Transportation Rate (₦ per km)</label>
    <input
      type="number"
      id="transportationRate"
      name="transportationRate"
      value={profile.transportationRate || 50}
      onChange={handleProfileChange}
      min="0"
      step="10"
    />
  </div>
)}
```

### 2. Client Profile Enhancement

**File:** `/frontend/vite-project/src/main-app/pages/client/profile/ClientProfile.jsx`

Add to the profile editing form:

```jsx
// Add these form groups to the client profile
<div className="form-group">
  <label>Home Address</label>
  <input
    type="text"
    name="homeAddress"
    value={editedProfile?.homeAddress || ''}
    onChange={handleChange}
    placeholder="Enter your complete home address"
  />
  <button type="button" onClick={() => geocodeAddress('home')}>
    📍 Get Coordinates
  </button>
</div>

<div className="form-group">
  <label>Preferred Service Location</label>
  <input
    type="text"
    name="preferredServiceLocation"
    value={editedProfile?.preferredServiceLocation || ''}
    onChange={handleChange}
    placeholder="Where do you usually need care services? (Can be same as home)"
  />
  <button type="button" onClick={() => geocodeAddress('service')}>
    📍 Get Coordinates
  </button>
</div>

<div className="form-group">
  <label>
    <input
      type="checkbox"
      name="useHomeAsServiceLocation"
      checked={editedProfile?.useHomeAsServiceLocation || false}
      onChange={handleChange}
    />
    Service location is same as home address
  </label>
</div>
```

### 3. Service Booking Enhancement

**File:** `/frontend/vite-project/src/main-app/pages/client/cart/Cart.jsx`

Add before payment section:

```jsx
// Add this service location section
<div className="service-location-section">
  <h3>Service Location</h3>
  <div className="location-options">
    <label>
      <input
        type="radio"
        name="serviceLocationType"
        value="home"
        checked={serviceLocationType === 'home'}
        onChange={handleLocationTypeChange}
      />
      At my registered home address
    </label>
    <label>
      <input
        type="radio"
        name="serviceLocationType"
        value="custom"
        checked={serviceLocationType === 'custom'}
        onChange={handleLocationTypeChange}
      />
      Different location
    </label>
  </div>
  
  {serviceLocationType === 'custom' && (
    <div className="custom-location">
      <input
        type="text"
        name="customServiceAddress"
        value={customServiceAddress}
        onChange={handleServiceAddressChange}
        placeholder="Enter service address"
      />
      <button type="button" onClick={geocodeServiceAddress}>
        📍 Verify Address
      </button>
    </div>
  )}
  
  {distanceInfo && (
    <div className="distance-info">
      <p>Distance from caregiver: {distanceInfo.distance} km</p>
      {distanceInfo.transportationFee > 0 && (
        <p>Transportation fee: ₦{distanceInfo.transportationFee}</p>
      )}
    </div>
  )}
</div>
```

### 4. Geocoding Service

**Create:** `/frontend/vite-project/src/main-app/services/geocodingService.js`

```javascript
class GeocodingService {
  static async getCoordinatesFromAddress(address) {
    try {
      // Using Google Maps Geocoding API
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: data.results[0].formatted_address
        };
      }
      
      throw new Error('No results found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
  
  static calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
  
  static deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

export default GeocodingService;
```

## 🔧 Backend API Enhancements

### 1. New DTOs

Add to `Application/DTOs/CaregiverDTO.cs`:

```csharp
public class UpdateCaregiverLocationRequest
{
    public string? HomeAddress { get; set; }
    public double? HomeLatitude { get; set; }
    public double? HomeLongitude { get; set; }
    public string? ServiceArea { get; set; }
    public double? MaxServiceRadius { get; set; }
    public bool? WillTravelToClients { get; set; }
    public decimal? TransportationRate { get; set; }
}
```

Add to `Application/DTOs/ClientDTO.cs`:

```csharp
public class UpdateClientLocationRequest
{
    public string? HomeAddress { get; set; }
    public double? HomeLatitude { get; set; }
    public double? HomeLongitude { get; set; }
    public string? PreferredServiceLocation { get; set; }
    public double? ServiceLatitude { get; set; }
    public double? ServiceLongitude { get; set; }
}
```

Add to `Application/DTOs/ClientOrderDTO.cs`:

```csharp
public class CreateOrderWithLocationRequest : AddClientOrderRequest
{
    public string? ServiceAddress { get; set; }
    public double? ServiceLatitude { get; set; }
    public double? ServiceLongitude { get; set; }
    public bool? RequiresTransportation { get; set; }
}
```

### 2. New Service Methods

Add to `ICareGiverService` interface:

```csharp
Task<string> UpdateCaregiverLocationAsync(string caregiverId, UpdateCaregiverLocationRequest request);
Task<IEnumerable<CaregiverResponse>> GetCaregiversByLocationAsync(double latitude, double longitude, double radiusKm);
```

Add to `IClientService` interface:

```csharp
Task<string> UpdateClientLocationAsync(string clientId, UpdateClientLocationRequest request);
```

Add to `IClientOrderService` interface:

```csharp
Task<Result<ClientOrderDTO>> CreateOrderWithLocationAsync(CreateOrderWithLocationRequest request);
Task<double> CalculateDistanceAsync(string caregiverId, double serviceLatitude, double serviceLongitude);
```

### 3. Location Service

**Create:** `/backend/Infrastructure/Services/LocationService.cs`

```csharp
public interface ILocationService
{
    Task<(double latitude, double longitude)> GeocodeAddressAsync(string address);
    double CalculateDistance(double lat1, double lng1, double lat2, double lng2);
    Task<IEnumerable<CaregiverResponse>> FindNearbyCaregiversAsync(double lat, double lng, double radiusKm);
}

public class LocationService : ILocationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    
    public LocationService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }
    
    public double CalculateDistance(double lat1, double lng1, double lat2, double lng2)
    {
        var R = 6371; // Earth's radius in kilometers
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }
    
    private static double ToRadians(double degrees)
    {
        return degrees * (Math.PI / 180);
    }
    
    public async Task<(double latitude, double longitude)> GeocodeAddressAsync(string address)
    {
        var apiKey = _configuration["GoogleMaps:ApiKey"];
        var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeDataString(address)}&key={apiKey}";
        
        var response = await _httpClient.GetStringAsync(url);
        var result = JsonSerializer.Deserialize<GoogleGeocodeResponse>(response);
        
        if (result.Results?.Any() == true)
        {
            var location = result.Results[0].Geometry.Location;
            return (location.Lat, location.Lng);
        }
        
        throw new Exception("Address not found");
    }
}
```

### 4. New API Controllers

Add to `CareGiversController.cs`:

```csharp
[HttpPut]
[Route("UpdateLocation/{caregiverId}")]
public async Task<IActionResult> UpdateCaregiverLocationAsync(string caregiverId, UpdateCaregiverLocationRequest request)
{
    try
    {
        var result = await careGiverService.UpdateCaregiverLocationAsync(caregiverId, request);
        return Ok(new { message = result });
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = ex.Message });
    }
}

[HttpGet]
[Route("Nearby")]
public async Task<IActionResult> GetNearbyCaregiversAsync(double latitude, double longitude, double radiusKm = 10)
{
    try
    {
        var caregivers = await careGiverService.GetCaregiversByLocationAsync(latitude, longitude, radiusKm);
        return Ok(caregivers);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = ex.Message });
    }
}
```

## 🗺️ Integration Points for Directions

### 1. Caregiver Direction Feature

Add to order details components:

```jsx
// Add directions button to order details
<div className="order-actions">
  <button 
    className="directions-btn"
    onClick={() => openDirections(order.serviceLatitude, order.serviceLongitude)}
  >
    🗺️ Get Directions to Client
  </button>
  <p>Distance: {order.distanceFromCaregiver} km</p>
  {order.transportationFee > 0 && (
    <p>Transportation fee: ₦{order.transportationFee}</p>
  )}
</div>
```

JavaScript implementation:

```javascript
const openDirections = (lat, lng) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
};
```

### 2. Distance Display for Clients

In service listing components:

```jsx
<div className="caregiver-distance">
  <span className="distance-badge">
    📍 {caregiver.distanceFromYou} km away
  </span>
  {caregiver.willTravelToClients && (
    <span className="travel-available">
      ✅ Will travel to you (+₦{caregiver.transportationRate}/km)
    </span>
  )}
</div>
```

### 3. Service Area Visualization

```jsx
const ServiceAreaMap = ({ caregiver }) => {
  return (
    <div className="service-area-info">
      <h4>Service Areas:</h4>
      <p>{caregiver.serviceArea}</p>
      <p>Maximum distance: {caregiver.maxServiceRadius} km</p>
      <button onClick={() => showServiceAreaOnMap(caregiver)}>
        🗺️ View Service Area
      </button>
    </div>
  );
};
```

## 🚀 Migration Strategy

### Phase 1: Database Migration
```sql
-- Add new fields to Caregiver table
ALTER TABLE Caregivers ADD COLUMN ServiceArea NVARCHAR(500);
ALTER TABLE Caregivers ADD COLUMN HomeLatitude DECIMAL(10,8);
ALTER TABLE Caregivers ADD COLUMN HomeLongitude DECIMAL(11,8);
ALTER TABLE Caregivers ADD COLUMN MaxServiceRadius DECIMAL(5,2);
ALTER TABLE Caregivers ADD COLUMN WillTravelToClients BIT;
ALTER TABLE Caregivers ADD COLUMN TransportationRate DECIMAL(10,2);

-- Add new fields to Client table
ALTER TABLE Clients ADD COLUMN HomeLatitude DECIMAL(10,8);
ALTER TABLE Clients ADD COLUMN HomeLongitude DECIMAL(11,8);
ALTER TABLE Clients ADD COLUMN PreferredServiceLocation NVARCHAR(500);
ALTER TABLE Clients ADD COLUMN ServiceLatitude DECIMAL(10,8);
ALTER TABLE Clients ADD COLUMN ServiceLongitude DECIMAL(11,8);

-- Add new fields to ClientOrder table
ALTER TABLE ClientOrders ADD COLUMN ServiceAddress NVARCHAR(500);
ALTER TABLE ClientOrders ADD COLUMN ServiceLatitude DECIMAL(10,8);
ALTER TABLE ClientOrders ADD COLUMN ServiceLongitude DECIMAL(11,8);
ALTER TABLE ClientOrders ADD COLUMN DistanceFromCaregiver DECIMAL(5,2);
ALTER TABLE ClientOrders ADD COLUMN TransportationFee DECIMAL(10,2);
ALTER TABLE ClientOrders ADD COLUMN RequiresTransportation BIT;
```

### Phase 2: Gradual Rollout
1. **Week 1-2**: Deploy backend changes with optional fields
2. **Week 3-4**: Deploy frontend changes with address capture
3. **Week 5-6**: Encourage existing users to update locations
4. **Week 7-8**: Enable distance-based matching and fees

### Phase 3: Data Collection Incentives
- Show "Complete your profile" prompts
- Offer better matching for users with complete addresses
- Display distance benefits to encourage adoption

## ✨ Additional Features to Consider

### 1. Address Validation
```javascript
// Using Nigerian postal service APIs
const validateNigerianAddress = async (address) => {
  const response = await fetch(`/api/validate-address`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  return response.json();
};
```

### 2. Multiple Service Locations
```jsx
const MultipleServiceLocations = () => {
  const [serviceLocations, setServiceLocations] = useState([]);
  
  const addServiceLocation = (location) => {
    setServiceLocations([...serviceLocations, location]);
  };
  
  return (
    <div className="service-locations">
      <h3>Your Service Locations</h3>
      {serviceLocations.map((location, index) => (
        <div key={index} className="location-item">
          <span>{location.name}: {location.address}</span>
          <button onClick={() => removeLocation(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => setShowAddLocation(true)}>
        + Add New Location
      </button>
    </div>
  );
};
```

### 3. Real-time Travel Time
```javascript
const getTravelTime = async (origin, destination) => {
  const service = new google.maps.DistanceMatrixService();
  return new Promise((resolve, reject) => {
    service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      if (status === 'OK') {
        const result = response.rows[0].elements[0];
        resolve({
          distance: result.distance.text,
          duration: result.duration.text,
          durationInTraffic: result.duration_in_traffic?.text
        });
      } else {
        reject(status);
      }
    });
  });
};
```

### 4. Emergency Location Sharing
```jsx
const EmergencyLocationShare = () => {
  const shareCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      
      // Send location to emergency contact or caregiver
      sendEmergencyLocation({
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        userId: currentUser.id
      });
    });
  };
  
  return (
    <button 
      className="emergency-location-btn"
      onClick={shareCurrentLocation}
    >
      📍 Share Current Location
    </button>
  );
};
```

## 📝 Implementation Checklist

### Backend Tasks
- [ ] Add new fields to database entities
- [ ] Create migration scripts
- [ ] Implement LocationService
- [ ] Add new API endpoints for location updates
- [ ] Add distance calculation methods
- [ ] Update existing services to handle location data
- [ ] Add location-based queries for caregiver matching

### Frontend Tasks
- [ ] Create GeocodingService
- [ ] Update caregiver settings form with location fields
- [ ] Update client profile form with address capture
- [ ] Enhance service booking with location selection
- [ ] Add distance display in service listings
- [ ] Implement directions integration
- [ ] Add location validation and error handling

### Testing Tasks
- [ ] Test geocoding accuracy for Nigerian addresses
- [ ] Test distance calculations with real coordinates
- [ ] Test transportation fee calculations
- [ ] Test directions integration with various map providers
- [ ] Performance test with location-based queries
- [ ] Mobile responsiveness testing for location features

### DevOps Tasks
- [ ] Set up Google Maps API keys
- [ ] Configure environment variables for geocoding
- [ ] Update deployment scripts for database changes
- [ ] Set up monitoring for location-based features
- [ ] Create backup strategy for location data

## 🔗 External Dependencies

### Required API Keys
- **Google Maps Geocoding API**: For address to coordinates conversion
- **Google Maps Directions API**: For navigation integration
- **Google Maps Distance Matrix API**: For travel time calculations

### Environment Variables
```bash
# Add to .env files
REACT_APP_GOOGLE_MAPS_API_KEY=your_frontend_api_key
GOOGLE_MAPS_API_KEY=your_backend_api_key
ENABLE_LOCATION_FEATURES=true
DEFAULT_SERVICE_RADIUS=10
```

## 📞 Support and Maintenance

### Monitoring
- Track geocoding API usage and costs
- Monitor location update success rates
- Track user adoption of location features
- Monitor distance calculation accuracy

### Regular Tasks
- Update address validation rules
- Review and update service areas
- Optimize location-based queries
- Update transportation rates based on market conditions

---

**Note**: This implementation guide provides a comprehensive roadmap for adding location and address capture functionality to the CarePro platform. Implement in phases and test thoroughly with real Nigerian addresses to ensure accuracy and usability.
