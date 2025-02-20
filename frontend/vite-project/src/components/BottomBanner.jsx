import '../styles/components/top-banner.scss';


const BottomBanner = ({ 
    title = "Hire a Caregiver today!", 
    description = "As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home.",
    buttonText = "Hire a Caregiver",
    imageUrl,
    backgroundColor = "#373732",
    onButtonClick 
  }) => {
    return (

      <div className='banner-container' style={{ padding: '75px', margin: '0 auto'  }}> 
        <div className='banner' style={{ backgroundColor, borderRadius: '50px', overflow: 'hidden' }}>
          <div className='content'>
            <div className='text-content'>
              <h1 style={{ color: 'white' }}>{title}</h1>
              <p style={{ color: 'white' }}>{description}</p>
              <button className='hire-button' onClick={onButtonClick}>
                {buttonText} <span className='arrow'>→</span>
              </button>
            </div>
          </div>
          <div className='image-content'>
            {imageUrl && (
              <img src={imageUrl} alt="Caregiver assisting a senior" />
            )}
          </div>
        </div>
      </div>
    );
  };
  
  export default BottomBanner;
  