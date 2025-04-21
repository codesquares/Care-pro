import './profile-information.css'

const ProfileInformation = () => {
 //Please use the following caregiverServices as an array of objects from where a caregiver can select the services they provide
 // and the description of each service will be displayed in a tooltip when hovering over the service name.
  const caregiverServices = [
    {
      id: 1,
      name: "Companionship",
      description: "Providing social interaction and emotional support to reduce loneliness."
    },
    {
      id: 2,
      name: "Meal preparation",
      description: "Preparing nutritious meals tailored to dietary needs and preferences."
    },
    {
      id: 3,
      name: "Mobility assistance",
      description: "Helping with walking, transferring, and using mobility aids safely."
    },
    {
      id: 4,
      name: "Medication reminders",
      description: "Ensuring timely medication intake as prescribed."
    },
    {
      id: 5,
      name: "Light housekeeping",
      description: "Assisting with laundry, vacuuming, dishwashing, and tidying up."
    },
    {
      id: 6,
      name: "Toileting and hygiene support",
      description: "Helping with toilet use, personal hygiene, and incontinence care."
    },
    {
      id: 7,
      name: "Bathing and grooming",
      description: "Supporting with showers, baths, hair care, and grooming tasks."
    },
    {
      id: 8,
      name: "Dressing assistance",
      description: "Helping clients get dressed and undressed comfortably and safely."
    },
    {
      id: 9,
      name: "Transportation to appointments",
      description: "Driving or accompanying clients to medical or personal appointments."
    },
    {
      id: 10,
      name: "Errands and shopping",
      description: "Assisting with grocery shopping and picking up prescriptions or supplies."
    },
    {
      id: 11,
      name: "Physical therapy support",
      description: "Helping clients complete exercises prescribed by physical therapists."
    },
    {
      id: 12,
      name: "Cognitive stimulation activities",
      description: "Engaging in puzzles, memory games, and conversation to support mental health."
    },
    {
      id: 13,
      name: "Respite care",
      description: "Providing short-term relief for family caregivers."
    },
    {
      id: 14,
      name: "Palliative care support",
      description: "Comfort-focused care for those with serious or terminal illnesses."
    },
    {
      id: 15,
      name: "Fall prevention monitoring",
      description: "Assessing risks and helping clients move safely to prevent falls."
    },
    {
      id: 16,
      name: "Disability support services",
      description: "Customized assistance for individuals with physical or developmental disabilities."
    },
    {
      id: 17,
      name: "Post-surgery care",
      description: "Helping clients recover safely and comfortably after surgery."
    },
    {
      id: 18,
      name: "Alzheimer’s and dementia care",
      description: "Specialized support for individuals experiencing memory loss."
    },
    {
      id: 19,
      name: "Emotional support and check-ins",
      description: "Providing regular visits and emotional care to boost well-being."
    },
    {
      id: 20,
      name: "Overnight supervision",
      description: "Ensuring safety and care during nighttime hours."
    },
    {
      id: 21,
      name: "Chronic illness management",
      description: "Supporting individuals with conditions like diabetes, arthritis, or COPD."
    },
    {
      id: 22,
      name: "Assistive device training",
      description: "Teaching safe and proper use of walkers, wheelchairs, or other aids."
    },
    {
      id: 23,
      name: "Incontinence care",
      description: "Sensitive and hygienic assistance with continence management."
    },
    {
      id: 24,
      name: "Home safety assessment",
      description: "Identifying risks and recommending improvements for safer living."
    },
    {
      id: 25,
      name: "Recreational activities assistance",
      description: "Helping clients engage in hobbies and leisure activities."
    },
    {
      id: 26,
      name: "Behavioral support",
      description: "Managing behaviors associated with mental health or cognitive conditions."
    },
    {
      id: 27,
      name: "Exercise and fitness support",
      description: "Guiding safe physical activity tailored to client ability."
    },
    {
      id: 28,
      name: "Feeding assistance",
      description: "Helping clients eat safely and comfortably."
    },
    {
      id: 29,
      name: "Language or communication support",
      description: "Assisting with communication tools or non-verbal interaction."
    },
    {
      id: 30,
      name: "Medical appointment coordination",
      description: "Scheduling and preparing for medical visits, with follow-up support."
    },
    {
      id: 31,
      name: "Wound care",
      description: "Providing safe and sterile care for wounds post-surgery or injury."
    },
    {
      id: 32,
      name: "Cleaning",
      description: "Deep or routine cleaning of living spaces to maintain hygiene."
    },
    {
      id: 33,
      name: "Cooking",
      description: "Preparing home-cooked meals tailored to dietary preferences."
    },
    {
      id: 34,
      name: "Babysitting",
      description: "Supervising and caring for children in a safe environment."
    },
    {
      id: 35,
      name: "Pet minding",
      description: "Caring for pets during short-term or long-term absences."
    },
    {
      id: 36,
      name: "Dog walking",
      description: "Taking dogs for exercise and outdoor time regularly."
    },
    {
      id: 37,
      name: "Dementia care",
      description: "Providing safe and structured care for individuals with dementia."
    },
    {
      id: 38,
      name: "Autism support",
      description: "Offering personalized care and activities for individuals on the autism spectrum."
    },
    {
      id: 39,
      name: "Massage therapy",
      description: "Relieving pain and stress through professional therapeutic massage."
    },
    {
      id: 40,
      name: "Nursing care",
      description: "Skilled medical care provided by a licensed nurse."
    }
  ];
  
        const services = [
          "Rehabilitation services",
          "Dental care",
          "Cooking",
          "Acupuncture",
          "Nursing care",
          "Emergency response",
          "Home care",
        ];

        const certifications = [
            { name: "WHO nursing certificate 2021", link: "#" },
            { name: "Caring for the elderly: NHS Programme 2020", link: "#" },
          ];

  return (
    <div> 
    <div className="description">
    <h3>Description</h3>
    <p>Lorem ipsum dolor sit amet...</p>
    <button>Edit</button>
  </div>
  <hr></hr>
  <div className="services">
      <h3>Services</h3>
      <ul>
        {services.map((service, index) => (
          <li key={index}>{service}</li>
        ))}
      </ul>
    </div>
    <hr></hr>
    <div className="certifications">
      <h3>Certifications</h3>
      <ul>
        {certifications.map((certification, index) => (
          <li key={index}>
            <a href={certification.link}>{certification.name}</a>
          </li>
        ))}
      </ul>
    </div>
  </div>
  )
}

export default ProfileInformation