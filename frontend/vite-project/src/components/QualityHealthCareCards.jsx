
import "../styles/components/qualityHealthcareCards.css";
import { useNavigate } from "react-router-dom";
import CategoryCard from "./category/CategoryCard";
import { categoryBrowseData } from "../main-app/constants/categoryBrowseData";

const QualityHealthCareCards = () => {
  const navigate = useNavigate();

  return (
    <div className="quality-healthcare-cards">
      <h2 className="quality-healthcare-title">Quality healthcare at your fingertips</h2>
      <div className="quality-healthcare-grid">
        {categoryBrowseData.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            showDescription={true}
            showPrice={true}
            onClick={() => navigate(`/marketplace?category=${category.slug}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default QualityHealthCareCards;