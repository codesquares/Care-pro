# Username Generation System

## Overview
This system provides a centralized utility for generating consistent usernames across the Care-Pro application.

## Username Format
The generated username follows this pattern:
```
{firstName}{emailPrefix}{year}{hour}
```

Where:
- `firstName`: User's first name (lowercase)
- `emailPrefix`: First 2 letters from email address (before @ symbol)
- `year`: Last 2 digits of the year they joined
- `hour`: Hour they joined (24-hour format, padded with 0)

## Examples
- **User**: firstName="ola", email="ola@gmail.com", joined="2025-01-15T00:23:00Z"
- **Username**: "olaol2500"

- **User**: firstName="john", email="johnny@example.com", joined="2024-12-25T14:30:00Z" 
- **Username**: "johnnjo2414"

## Usage

### Import the utility
```javascript
import { generateUsername } from '../utils/usernameGenerator';
```

### Generate username
```javascript
const username = generateUsername(
  user.firstName,
  user.email, 
  user.createdAt // or memberSince
);
```

### Validate username format
```javascript
import { validateUsername } from '../utils/usernameGenerator';

const isValid = validateUsername(username); // returns boolean
```

## Implementation Locations

The username generation has been implemented in these components:

1. **Caregiver Dashboard**: `ProfileCard.jsx`
2. **Client Dashboard**: `ClientProfileCard.jsx` 
3. **Client Profile**: `ClientProfile.jsx`
4. **Caregiver Profile**: `ProfileHeader.jsx`

## Fallback Behavior

If required data is missing or invalid, the system generates a fallback username:
```
guest{6-digit-timestamp}
```

Example: `guest123456`

## Error Handling

- Missing or invalid inputs trigger fallback generation
- All errors are logged to console
- System gracefully handles edge cases like:
  - Invalid email formats
  - Missing join dates
  - Non-English characters
  - Short email addresses

## Testing

Run the test suite:
```javascript
import { runUsernameTests } from '../utils/usernameGenerator.test.js';
runUsernameTests();
```

## Storage

Generated usernames are automatically saved to `localStorage` with the key `"userName"` for consistent access across the application.
