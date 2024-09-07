
import '../../styles/components/brand-list.scss';
import brandLogo1 from '../../assets/brandLogo1.png'
import brandLogo2 from '../../assets/brandLogo2.png'
import brandLogo3 from '../../assets/brandLogo3.png'
import brandLogo4 from '../../assets/brandLogo4.png'
import brandLogo5 from '../../assets/brandLogo5.png'
import brandLogo6 from '../../assets/brandLogo6.png'
const BrandList = () => {
  const brands = [
    { name: 'Aspen Online', logo: brandLogo1 },
    { name: 'Crop and Highlight', logo: brandLogo2 },
    { name: 'N', logo: brandLogo3 },
    { name: 'Millssy', logo: brandLogo4 },
    { name: 'Peppermint', logo: brandLogo5 },
    { name: 'Pixie Labs', logo: brandLogo6 },
  ];

  return (
    <div className="brand-list">
      {brands.map((brand, index) => (
        <div key={index} className="brand-item">
          <img src={brand.logo} alt={brand.name} />
        </div>
      ))}
    </div>
  );
};

export default BrandList;
