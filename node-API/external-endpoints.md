# External API Endpoints

This document contains information about the external API endpoints that are used by the frontend application.

## Authentication Endpoints

### User Login

**Endpoint:** `/Authentications/UserLogin`

**Method:** POST

**Description:** Authenticates a user and provides access token

### Add Caregiver

**Endpoint:** `/api/auth/register/caregiver` or `/CareGivers/AddCaregiverUser`

**Method:** POST

**Request Body:**
```json
{
  "firstName": "string",
  "middleName": "string",
  "lastName": "string",
  "email": "string",
  "role": "string",
  "phoneNo": "string",
  "password": "string"
}
```

**Notes:**
- All fields are nullable
- This endpoint is used to register a new caregiver in the system

## Caregiver Endpoints

### Get All Caregivers

**Endpoint:** `/CareGivers/AllCaregivers`

**Method:** GET

**Description:** Retrieves a list of all caregivers

### Get Caregiver by ID

**Endpoint:** `/CareGivers/{caregiverId}`

**Method:** GET

**Description:** Retrieves details for a specific caregiver

### Update Caregiver Info

**Endpoint:** `/CareGivers/UpdateCaregiverInfo/{caregiverId}`

**Method:** PUT

**Description:** Updates the general information for a caregiver

### Update Caregiver Availability

**Endpoint:** `/CareGivers/UpdateCaregiverAvailability/{caregiverId}`

**Method:** PUT

**Description:** Updates the availability schedule for a caregiver

### Soft Delete Caregiver

**Endpoint:** `/CareGivers/SoftDeleteCaregiver/{caregiverId}`

**Method:** PUT

**Description:** Marks a caregiver as deleted without removing from the database

### Update Caregiver About Me

**Endpoint:** `/CareGivers/UpdateCaregiverAboutMeInfo/{caregiverId}`

**Method:** PUT

**Description:** Updates the About Me section of a caregiver's profile

## Gig Endpoints

### Create Gig

**Endpoint:** `/Gigs`

**Method:** POST

**Description:** Creates a new gig/service offering

### Get All Gigs

**Endpoint:** `/Gigs`

**Method:** GET

**Description:** Retrieves a list of all gigs

### Get Caregiver's Gigs

**Endpoint:** `/Gigs/caregiver/{caregiverId}`

**Method:** GET

**Description:** Retrieves all gigs for a specific caregiver

### Get Caregiver's Service Gigs

**Endpoint:** `/Gigs/service/{caregiverId}`

**Method:** GET 

**Description:** Retrieves service-specific gigs for a caregiver

### Get Caregiver's Paused Gigs

**Endpoint:** `/Gigs/{caregiverId}/paused`

**Method:** GET

**Description:** Retrieves all paused gigs for a caregiver

### Get Caregiver's Draft Gigs

**Endpoint:** `/Gigs/{caregiverId}/draft`

**Method:** GET

**Description:** Retrieves all draft gigs for a caregiver

### Get Gig by ID

**Endpoint:** `/Gigs/{gigId}`

**Method:** GET

**Description:** Retrieves details for a specific gig

### Pause Gig

**Endpoint:** `/Gigs/UpdateGigStatusToPause/{gigId}`

**Method:** PUT

**Description:** Updates a gig's status to paused

### Update Gig

**Endpoint:** `/Gigs/UpdateGig/{gigId}`

**Method:** PUT

**Description:** Updates the details of a gig

## Client Endpoints

### Get Client by ID

**Endpoint:** `/Clients/{clientId}`

**Method:** GET

**Description:** Retrieves details for a specific client

### Get All Clients

**Endpoint:** `/Clients/AllClientUsers`

**Method:** GET

**Description:** Retrieves a list of all clients


For more detailed documentation on each endpoint, please refer to the Swagger documentation.

## API Base Information

- Base URL: [Your API base URL]
- API Version: 1.0.0
- Authentication: Most endpoints require authentication via JWT tokens or API keys

---

*Note: This document is a work in progress and will be updated with more detailed endpoint information as needed.*
