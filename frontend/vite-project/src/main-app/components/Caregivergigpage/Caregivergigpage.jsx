import React, { useState } from "react";
import star from '../../../assets/rating_star.png';
import experplaceholder from '../../../assets/expert-placeholder.jpg';
import videoPlaceholder from "../../../assets/Video.png";
import plancheck from "../../../assets/plan_check.png";
import careprologo  from "../../../assets/careproLogo.svg";
import redheart  from "../../../assets/red_heart.png";
import share  from "../../../assets/share_icon.png";
import home  from "../../../assets/home_icon.png";

import bell  from "../../../assets/bell_icon.png";
import emptyheart  from "../../../assets/empty_heart.png";
import message from "../../../assets/message_icon.png"


const Caregivergigpage = () => {
  const [selectedPlan, setSelectedPlan] = useState("Basic");
  const [likes, setLikes] = useState(201);
  const [isLiked, setIsLiked] = useState(false);

  const plansData = {
    Basic: {
      price: "₦30,000 / month",
      services: ["Washing dishes", "Taking care of your kids and baby"],
      backgroundColor: '#fff',
      textColor: '#555',
      buttonColor: '#333',
      buttonTextColor: '#fff',
      buttonBackgroundColor: '#333',
    },
    Standard: {
      price: "₦60,000 / month",
      services: [
        "Washing dishes",
        "Taking care of your kids and baby",
        "Laundry",
        "Grocery shopping",
        "Meal preparation",
      ],
      backgroundColor: '#fff',
      textColor: '#555',
      buttonColor: '#333',
      buttonTextColor: '#fff',
      buttonBackgroundColor: '#333',
    },
    Premium: {
      price: "₦90,000 / month",
      services: [
        "Washing dishes",
        "Taking care of your kids and baby",
        "Laundry",
        "Grocery shopping",
        "Meal preparation",
        "House cleaning",
        "Pet care",
      ],
      backgroundColor: '#fff',
      textColor: '#555',
      buttonColor: '#333',
      buttonTextColor: '#fff',
      buttonBackgroundColor: '#333',
    },
  };

  const allServices = [
    "Washing dishes",
    "Taking care of your kids and baby",
    "Laundry",
    "Grocery shopping",
    "Meal preparation",
    "House cleaning",
    "Pet care",
  ];

  const currentPlan = plansData[selectedPlan];

  const handlePlanSelect = (planName) => {
    setSelectedPlan(planName);
  };

  

  return (


    
<div>



<nav style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #eee',
      marginBottom: 50,
    }}>
      <img
        src={careprologo}
        alt="CarePro Logo"
        style={{ marginLeft: 70, height: '30px', marginRight: '20px' }}
      />
      <div style={{
        width: '50px',
        flexGrow: 1,
        marginLeft: 50,
        display: 'flex',
        alignItems: 'center',
        borderRadius: '5px',
        border: '1px solid #ccc',
        padding: '5px 10px',
        marginRight: '10px',
      }}>
        <input
          type="text"
          placeholder="What service are you looking for today ?"
          style={{
            
            border: 'none',
            outline: 'none',
            flexGrow: 1,
            fontSize: '16px',
            padding: '5px',
            color: '#555',
          }}
        />
        <button style={{
          background: '#555',
          color: 'white',
          border: 'none',
          padding: '5px 8px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'auto',
          height: 'auto',
          minWidth: 'auto',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: '5px', padding: '5px', marginRight: '15px' }}>
          <button style={{ border: 'none', background: 'transparent', padding: '5px', cursor: 'pointer' }}>
            <img src={bell} alt="Notifications" style={{ height: '20px', width: '20px', color: '#555' }} />
          </button>
          <button style={{ border: 'none', background: 'transparent', padding: '5px', cursor: 'pointer', marginLeft: '5px' }}>
            <img src={message} alt="Messages" style={{ height: '20px', width: '20px', color: '#555' }} />
          </button>
          <button style={{ border: 'none', background: 'transparent', padding: '5px', cursor: 'pointer', marginLeft: '5px' }}>
            <img src={emptyheart} alt="Favorites" style={{ height: '20px', width: '20px', color: '#555' }} />
          </button>
        </div>
        <button style={{
          border: '1px solid #ccc',
          borderRadius: '5px',
          padding: '3px 5px',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#555',
          marginRight: '10px',
          display: 'inline-flex',
          alignItems: 'center',
        }}>
          View Orders
        </button>
        <span style={{ marginRight: '10px', color: '#555', fontSize: '14px' }}>John Manfredi</span>
        <img
          src={experplaceholder}
          alt="User Avatar"
          style={{ marginRight: 50, height: '40px', width: '40px', borderRadius: '50%', objectFit: 'cover', marginLeft: '10px' }}
        />
      </div>
    </nav>





    
    <div style={{  marginLeft: 80, display: 'flex' }}>

      <div style={{ flex: '2', paddingRight: '20px' }}>

      <div style={{ marginBottom: 50, display: 'flex', alignItems: 'center', color: '#777', fontSize: '1.2em' }}>
  <img src={home} alt="Home" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
  <span style={{ marginRight: '8px' }}>/</span>
  <span style={{ fontSize: '1.2em' }}>Home care</span>
</div>

      <h2 style={{ textAlign: 'left', fontSize: '2.4em' }}>i will clean your house and do your laundry twice a week </h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <img
            src={experplaceholder}
            alt="Ahmed Rufai"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: '15px',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2 style={{ margin: '0', fontSize: '1.2em' }}>Ahmed Rufai</h2>
              <span style={{ backgroundColor: '#20c997', borderRadius: '50%', display: 'inline-block', width: '8px', height: '8px', marginLeft: '5px' }}></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px', fontSize: '0.9em', color: '#777' }}>
              <span style={{ color: '#20c997', marginRight: '5px' }}>Available</span>
              <div style={{ backgroundColor: '#343a40', color: 'white', borderRadius: '5px', padding: '2px 8px', marginRight: '5px', display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-geo-alt-fill" viewBox="0 0 16 16" style={{ marginRight: '3px' }}>
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                </svg>
                Yaba, Lagos
              </div>
              
              


              <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem',
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    border: '1.5px solid #ffc107',
    borderRadius: '20px',
    color: 'black',
    padding: '0.3rem 0.5rem',
  }}>
    <img
      src={star}
      alt="Star"
      style={{
        width: '1rem',
        height: 'auto',
        marginRight: '0.5rem',
      }}
    />
    4.5 (200)
  </div>
 
</div>

            </div>
          </div>
        </div>
        <div style={{ marginBottom: 50  }}>
          <h2 style={{ marginBottom: 40 }}>Introduction video</h2>
          <img
            src={videoPlaceholder}
            alt="Introduction Video"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '8px',
            }}
          />
         <p style={{ marginBottom: 70 ,fontSize: '1.7em', color: '#777', marginTop: '8px' }}>
  Lorem ipsum mi lorem ipsum mi Lorem ipsum mi lorem ipsum 
  sum miLorem ipsum mi lorem rem ipsum milorem ipsum mi
  Lorem ipsum mi lorem ipsum mi Lorem ipsum mi lorem ipsum 
  sum miLorem ipsum mi lorem rem ipsum milorem ipsum mi
  Lorem ipsum mi lorem ipsum mi Lorem ipsum mi lorem ipsum 
  sum miLorem ipsum mi lorem rem ipsum milorem ipsum mi
</p>
        </div>


        <h2 style={{ marginTop: '20px', textAlign: 'left' }}>Reviews</h2>
        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'flex-start' }}>
          <img
            src={experplaceholder}
            alt="Josiah Ruben"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: '10px',
            }}
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <h3 style={{ margin: '0', fontSize: '1em' }}>Josiah Ruben</h3>

              <div style={{
  display: 'flex',
  backgroundColor: '#fff8e1', /* Similar background color */
  padding: '0.2rem 0.4rem', /* Adjust padding as needed */
  borderRadius: '20px', /* To make it rounded like the example */
  border: '1.5px solid #ffc107', /* Similar border */
  alignItems: 'center', /* Vertically align items */
}}>
  <img src={star} alt="Star" style={{ width: '14px', height: '14px', marginRight: '2px' }} />
  <img src={star} alt="Star" style={{ width: '14px', height: '14px', marginRight: '2px' }} />
  <img src={star} alt="Star" style={{ width: '14px', height: '14px', marginRight: '2px' }} />
  <img src={star} alt="Star" style={{ width: '14px', height: '14px', marginRight: '2px' }} />
  <img src={star} alt="Star" style={{ width: '14px', height: '14px' }} />
</div>

            </div>
            <p style={{ margin: '0', fontSize: '0.9em', color: '#555' }}>
              I can't thank Rufai enough for the care and kindness she provided to my
              father. Her attention to detail and genuine concern for his well-being went
              above and beyond our expectations. She always made sure he was comf...
            </p>
          </div>
        </div>
        <div style={{ marginBottom: 50 , backgroundColor: '#f8f9fa', border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'flex-start' }}>
          <img
            src={experplaceholder}
            alt="Josiah Ruben"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: '10px',
            }}
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <h3 style={{ margin: '0', fontSize: '1em' }}>Josiah Ruben</h3>
             
              <div style={{
  display: 'flex',
  backgroundColor: '#fff8e1', /* Similar background color */
  padding: '0.2rem 0.4rem', /* Adjust padding as needed */
  borderRadius: '20px', /* To make it rounded like the example */
  border: '1.5px solid #ffc107', /* Similar border */
  alignItems: 'center', /* Vertically align items */
}}>
  <img src={star} alt="Star" style={{ width: '14px', height: '14px', marginRight: '2px' }} />
  <img src={star} alt="Star" style={{ width: '14px', height: '14px', marginRight: '2px' }} />
  <img src={star} alt="Star" style={{ width: '14px', height: '14px', marginRight: '2px' }} />
  <img src={star} alt="Star" style={{ width: '14px', height: '14px', marginRight: '2px' }} />
  <img src={star} alt="Star" style={{ width: '14px', height: '14px' }} />
</div>
            </div>
            <p style={{ margin: '0', fontSize: '0.9em', color: '#555' }}>
              I can't thank Rufai enough for the care and kindness she provided to my
              father. Her attention to detail and genuine concern for his well-being went
              above and beyond our expectations. She always made sure he was comf...
            </p>
          </div>
        </div>
      </div>
      <div style={{ flex: '1' , marginRight: 80}}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "red" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.69l-1.06-1.08a5.5 5.5 0 0 0-7.78 7.78l1.06 1.08L12 21.23l7.78-7.78 1.06-1.08a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              <span style={{ marginLeft: '5px' }}>{likes}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '5px' }}>share</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </div>
          </div>


          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '10px' }}>
  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '5px', padding: '5px 10px', marginRight: '10px' }}>
    <img src={redheart} alt="Like" style={{ width: '20px', height: '20px', marginRight: '5px' }} />
    <span style={{ color: 'black' }}>201</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '5px', padding: '5px 10px' }}>
    <span style={{ color: 'black', marginRight: '5px' }}>share</span>
    <img src={share} alt="Share" style={{ width: '20px', height: '20px', marginLeft: '5px' }} />
  </div>
</div>

          <div style={{ border: '1px solid #ccc', borderRadius: '8px', marginBottom: '15px', padding: '15px', backgroundColor: currentPlan.backgroundColor, color: currentPlan.textColor }}>
            <div style={{ marginBottom: '10px', borderBottom: '2px solid #ccc', paddingBottom: '10px', display: 'flex', justifyContent: 'space-around' }}>
              {Object.keys(plansData).map((planName, index, array) => (
                <React.Fragment key={planName}>
                  <button
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontWeight: selectedPlan === planName ? 'bold' : 'normal',
                      color: selectedPlan === planName ? currentPlan.textColor : '#ccc',
                      borderBottom: selectedPlan === planName ? `2px solid ${currentPlan.textColor}` : 'none',
                      paddingBottom: selectedPlan === planName ? '8px' : '10px',
                    }}
                    onClick={() => handlePlanSelect(planName)}
                  >
                    {planName}
                  </button>
                  {index < array.length - 1 && (
                    <div
                      style={{
                        width: '1px',
                        backgroundColor: '#ccc',
                        alignSelf: 'stretch',
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div  >
              <strong style={{ fontSize: '1.2em' }}>{currentPlan.price}</strong>
              <ul style={{ listStyleType: 'none', paddingLeft: '0', marginTop: '10px', fontSize: '0.9em' }}>
                {allServices.map((service) => {
                  const isIncluded = currentPlan.services.includes(service);
                  const textColor = isIncluded ? currentPlan.textColor : '#ccc';
                  const listItemStyle = {
                    color: textColor,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: isIncluded ? 1 : 0.7,
                  };

                  return (
                    <li key={service} style={listItemStyle}>
                      <img
                        src={plancheck}
                        alt="Check"
                        style={{
                          width: '16px',
                          height: '16px',
                          marginRight: '8px',
                        }}
                      />
                      {service}
                    </li>
                  );
                })}
              </ul>
              <button
                style={{
                  backgroundColor: currentPlan.buttonBackgroundColor,
                  color: currentPlan.buttonTextColor,
                  padding: '10px 15px',
                  border: 'none',
                  borderRadius: '5px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '15px',
                  fontSize: '0.9em',
                }}
              >
                Hire Ahmed Rufai <span style={{ marginLeft: '10px' }}>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Caregivergigpage;