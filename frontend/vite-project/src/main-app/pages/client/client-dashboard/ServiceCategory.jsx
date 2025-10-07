
import ServiceCard from "./ServiceCard";
import "./serviceCategory.css";

const ServiceCategory = ({ title, services, isPublic = false }) => (
  console.log("Rendering ServiceCategory with services:", services),
 
  <div className="service-category">
    <div className="category-header">
      <h2>{title}</h2>
      {/* <button className="btn-link">See all</button> */}
    </div>
    <div className="service-list">
      {services.map((service, index) => (
        <ServiceCard key={index} {...service} isPublic={isPublic} />
      ))}
    </div>
  </div>
);

export default ServiceCategory;
