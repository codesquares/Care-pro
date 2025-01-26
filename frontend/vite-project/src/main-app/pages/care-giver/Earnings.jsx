import React from 'react';
import './earnings.css';

const Earnings = () => {
  return (
    <div className="earnings-container">
      <h2 className="earnings-title">Earnings</h2>

      <div className="earnings-summary">
        <div className="funds-card">
          <p>Balance left:</p>
          <h3>₦100,000.00</h3>
          <div className="card-buttons">
            <button className="btn">Update bank details</button>
            <button className="btn withdraw">Withdraw</button>
          </div>
        </div>
        <div className="total-card">
          <p>All Earnings</p>
          <h3>₦350,000.00</h3>
          <button className="btn">Print Statement</button>
        </div>
      </div>

      <h3 className="transactions-title">All Transactions</h3>
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Activity</th>
            <th>Description</th>
            <th>Order</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>11/15/2023</td>
            <td>Withdrawal</td>
            <td>Transferred successfully</td>
            <td>FO113A033787</td>
            <td className="amount negative">-₦60,000.00</td>
          </tr>
          <tr>
            <td>11/10/2023</td>
            <td>Earning</td>
            <td>Order</td>
            <td>YO113A033782</td>
            <td className="amount positive">+₦60,000.00</td>
          </tr>
          <tr>
            <td>11/10/2023</td>
            <td>Earning</td>
            <td>Order</td>
            <td>YY113A033712</td>
            <td className="amount positive">+₦40,000.00</td>
          </tr>
          <tr>
            <td>11/15/2023</td>
            <td>Withdrawal</td>
            <td>Transferred successfully</td>
            <td>FO113A033787</td>
            <td className="amount negative">-₦20,000.00</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Earnings;
