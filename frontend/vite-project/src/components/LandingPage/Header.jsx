
import '../../styles/components/header.css'; 
import video from '../../assets/Video.png'
import { Link } from 'react-router-dom';
import arrow from '../../assets/arrow-right.svg'
import Button from '../atoms/Button'

const Header = () => {
    return (
        <header className="header">
            <div className="header-content">
                <h1 className="header-title">Premium care that truly satisfies</h1>
                <p className="header-subtitle">Hire caregivers who have been vetted, evaluated and trained to fit your caregiving needs at home.</p>
            </div>
            <div className="header-buttons">
                    {/* <a href="/book-caregiver" >Hire a Caregiver</a> */}
                    <Link to="/book-caregiver" className="btn-main">
                        Hire a Caregiver
                    </Link>
                    <Link to="/become-caregiver" className="btn-secondary" >Become a Caregiver</Link>
                </div>
            <div className="header-video">
                <img src={video} alt="Caregiver helping elderly" className="video-thumbnail" />
            </div>
        </header>
    );
};

export default Header;
