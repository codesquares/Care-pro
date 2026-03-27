import { useState, useEffect } from "react";
import { FaWallet } from "react-icons/fa";
import ClientWalletService from "../../../services/clientWalletService";
import "./ClientWallet.css";

const ClientWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      const result = await ClientWalletService.getWallet();
      if (result.success) {
        setWallet(result.data);
      } else {
        setError(result.error || "Failed to load wallet.");
      }
      setLoading(false);
    };
    fetchWallet();
  }, []);

  if (loading) {
    return (
      <div className="cl-wallet-page">
        <div className="cl-wallet-container">
          <div className="cl-wallet__loading">Loading wallet…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cl-wallet-page">
        <div className="cl-wallet-container">
          <div className="cl-wallet__error">{error}</div>
        </div>
      </div>
    );
  }

  const fmt = ClientWalletService.formatCurrency;

  return (
    <div className="cl-wallet-page">
      <div className="cl-wallet-container">
        <h1 className="cl-wallet__title">
          <FaWallet style={{ marginRight: 8 }} /> My Wallet
        </h1>

        <div className="cl-wallet__balance-card">
          <span className="cl-wallet__balance-label">Available Credit</span>
          <span className="cl-wallet__balance-value">
            {fmt(wallet?.creditBalance ?? 0)}
          </span>
          <p className="cl-wallet__balance-hint">
            Credits from cancelled visits. Applied automatically to future services.
          </p>
        </div>

        <div className="cl-wallet__stats">
          <div className="cl-wallet__stat">
            <span className="cl-wallet__stat-label">Total Credited</span>
            <span className="cl-wallet__stat-value">
              {fmt(wallet?.totalCredited ?? 0)}
            </span>
          </div>
          <div className="cl-wallet__stat">
            <span className="cl-wallet__stat-label">Total Spent</span>
            <span className="cl-wallet__stat-value">
              {fmt(wallet?.totalSpent ?? 0)}
            </span>
          </div>
        </div>

        {wallet?.updatedAt && (
          <p className="cl-wallet__updated">
            Last updated: {new Date(wallet.updatedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClientWallet;
