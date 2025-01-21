import NavIcon from "./NavIcon";
import NavImage from "./NavImage";
import NavItem from "./NavItem";
import "./gigs.scss";

const GigsHeader = () => {
  return (
    <nav className="gigs-header">
      <div className="logo-area">
        <span className="logo">
          <NavImage img="/src/assets/careproLogo.svg" />
        </span>
        <NavItem link="/dashboard" text="Dashboard" />
        <NavItem link="/settings" text="Settings" />
      </div>

      <div className="nav-icons">
        <div className="icon">
          <NavIcon icon="🔔" />
        </div>

        <div className="icon">
          <NavIcon icon="👤" />
        </div>
        <div className="icon">
          <NavIcon icon="🔽" />
        </div>

      </div>
      <div className="nav-class-icons">
        <NavIcon icon="🔍" />
        <h4>View Orders</h4>
      </div>
      <div className="nav-class-icons">
        <NavIcon icon="🔍" />
        <h4>Earned #300,000.00</h4>
      </div>
      <div className="nav-class-icons nav-image">
        <h3>Ahmed Rufai</h3>
        <NavImage img="/src/assets/funmilola.jpeg" />
      </div>
    </nav>

  );
};

export default GigsHeader;
