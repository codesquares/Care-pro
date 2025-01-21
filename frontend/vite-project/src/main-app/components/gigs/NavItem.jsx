import "./gigs.scss";
const NavItem = ({link, text}) => {
  return (
    <div className="nav-item">
      <a href={link}>{text}</a>
    </div>
  );
};
export default NavItem;