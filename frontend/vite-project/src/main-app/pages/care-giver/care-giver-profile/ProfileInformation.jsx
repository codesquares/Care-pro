

const ProfileInformation = () => {

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