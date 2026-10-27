
import "./StatisticsCard.css";
import StatisticCard1 from "../../../../assets/statisticCard1.png";
import StatisticCard2 from "../../../../assets/statisticCard2.png";
import StatisticCard3 from "../../../../assets/statisticCard3.png";

const StatisticsCard = ({activeCount = 0, activeClientCount = null, pendingCount = 0, totalEarnings}) => {
  return (
    <div className="statistics-card">
      <div className="stat">
        <img src={StatisticCard1} alt="card1" className="stat-icon" />  
        <div className="stat-details">
          <p className="stat-title">Total Earnings</p>
          <h4 className="stat-value earnings-value">₦{Number(totalEarnings).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
        </div>
      </div>
      {/* RETIRED — placeholder "No. of Orders" stat (always 0), replaced by assignment counts. Preserved for restore.
      <div className="stat">
        <img src={StatisticCard2} alt="card2" className="stat-icon" />
        <div className="stat-details">
          <p className="stat-title">No. of Orders</p>
          <h4 className="stat-value">{totalOrders}</h4>
        </div>
      </div>
      */}
      <div className="stat">
        <img src={StatisticCard2} alt="card2" className="stat-icon" />
        <div className="stat-details">
          <p className="stat-title">Active Assignments</p>
          <h4 className="stat-value" data-testid="stat-active">{activeCount}</h4>
          {/* The number above counts real assignments; the list on this page is one row per client, so say how many clients that is. */}
          {activeClientCount != null && activeCount > 0 && (
            <small className="stat-sub" data-testid="stat-active-clients">
              across {activeClientCount} {activeClientCount === 1 ? 'client' : 'clients'}
            </small>
          )}
        </div>
      </div>
      <div className="stat">
        <img src={StatisticCard2} alt="card2" className="stat-icon" />
        <div className="stat-details">
          <p className="stat-title">Pending Offers</p>
          <h4 className="stat-value" data-testid="stat-pending">{pendingCount}</h4>
        </div>
      </div>
      {/* <div className="stat">
        <img src={StatisticCard3} alt="card3" className="stat-icon" />  
        <div className="stat-details">
          <p className="stat-title">Hours Spent</p>
          <h4 className="stat-value">32.5 hours</h4>
        </div>
      </div> */}
    </div>
  );
};

export default StatisticsCard;
