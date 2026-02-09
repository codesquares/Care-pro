import './ServiceProvider.css';

const ServiceProvider = ({service, onRatingClick}) => {
  if (!service) {
    return <div>Loading...</div>;
  }
  return (
    <div className="service-provider">
      <div className="service-provider__avatar">
        <img 
          src={service.caregiverProfileImage || '/default-avatar.png'} 
          alt={service.caregiverName || 'Service Provider Avatar'} 
          className="service-provider__image"
        />
      </div>
      
      <div className="service-provider__info">
        <div className="service-provider__name-row">
          <span className="service-provider__name">{service.caregiverName || 'Unknown Caregiver'}</span>
          <span className="service-provider__status"></span>
        </div>
        
        <div className="service-provider__badges">
          <span className="service-provider__badge service-provider__badge--available">
            Available
          </span>
          <span className="service-provider__badge service-provider__badge--verified">
            carepro-verified
          </span>
          <div 
            className="service-provider__rating service-provider__rating--clickable" 
            onClick={onRatingClick}
            title="Click to view reviews"
          >
            <span className="service-provider__star">★</span>
            <span className="service-provider__rating-text">
              {service.caregiverRating?.toFixed(1) || '0.0'} ({service.caregiverReviewCount || 0})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProvider;