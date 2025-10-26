# Assessment System Upgrade

This document provides instructions on how to use the upgraded assessment system.

## Question Bank Generation

The system now supports generating and storing multiple-choice questions in the database according to the specifications in the `Assesment_prompt.md` file.

### Requirements

- Total of 200 questions:
  - 50 questions for Cleaners/Home Managers across 4 categories
  - 150 questions for Caregivers across 8 categories (including the cleaner categories)
- Each question has 4 multiple-choice options (A, B, C, D) with one correct answer
- Passing threshold has been increased from 50% to 70%

### Running the Generation Script

To generate the complete question bank, run:

```bash
cd node-API
node src/scripts/generateQuestionBank.js
```

The script will:
1. Generate questions in batches (10 questions per API call)
2. Store them in the MongoDB database via the .NET backend
3. Log progress and any errors to the `logs` directory

### Configuration

Before running the script, ensure:

1. The Node API server is running
2. The .NET backend API is running 
3. You have the proper admin authentication token set in your `.env` file:

```
ADMIN_TOKEN=your_admin_token_here
API_HOST=http://localhost:3000  # Change to match your Node API server
```

### Generation Process

The script will generate questions for the following categories:

**For Cleaners/Home Managers (50 Questions Total):**
- Respecting Client Privacy and Dignity (15 questions)
- Showing Respect and Professionalism in the Home (15 questions)
- Basic Emergency Awareness and Response (10 questions)
- Understanding Client Rights and Confidentiality (10 questions)

**For Caregivers (Additional 150 Questions):**
- Basic Caregiving Skills (40 questions)
- Emergency Response, CPR, and First Aid (30 questions)
- Accurate and Timely Reporting Skills (20 questions)
- Understanding of Medication Support and Observation (10 questions)

### Manual Generation

You can also manually generate questions for a specific category using the API:

```bash
curl -X POST http://localhost:3000/api/kyc/generate-question-bank \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "userType": "Caregiver",
    "category": "Basic Caregiving Skills",
    "count": 10
  }'
```

## Updated Assessment Flow

With the upgrade complete:

1. Assessments now pull random questions from the database instead of generating them on demand
2. Cleaners get 10 random questions from their 4 categories
3. Caregivers get 30 random questions from all 8 categories
4. The passing threshold is now 70% (previously 50%)
5. All responses are recorded for analysis and quality control

## Admin Interface

An admin interface will be implemented to:
- Review and edit questions in the bank
- View assessment statistics
- Flag questions that may need improvement based on user performance
