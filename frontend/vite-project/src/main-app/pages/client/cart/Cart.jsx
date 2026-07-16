
import ReviewsModal from '../../../components/ReviewsModal/ReviewsModal';
import GigReviewService from '../../../services/gigReviewService';
import bookingCommitmentService from '../../../services/bookingCommitmentService';
import './Cart.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientGigService from '../../../services/clientGigService';
import config from '../../../config'; // Import centralized config for API URLs
import { mapUiErrorCode, UI_ERROR_CODES } from '../../../utils/uiErrorMapper';
import { getCommitmentGateEnabled } from '../../../services/publicConfigService';
import { useClientOnboarding } from '../../../context/ClientOnboardingContext';

// Helper to format price
const formatPrice = (amount) => `₦${(amount || 0).toLocaleString()}`;

const Cart = () => {
   const { id } = useParams();
    const {
      walkthrough,
      isRenderingStep4or5,
      isTipSeen,
      markTipSeen,
    } = useClientOnboarding();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Payment-specific error/state
    const [paymentError, setPaymentError] = useState(null);
    const [paymentDisabled, setPaymentDisabled] = useState(false);
    
    // Frequency and price data state — restore from sessionStorage if available
    const savedFreq = id ? sessionStorage.getItem(`cart_freq_${id}`) : null;
    const savedPerWeek = id ? sessionStorage.getItem(`cart_perweek_${id}`) : null;
    const [selectedFrequency, setSelectedFrequency] = useState(savedFreq || 'one-time');
    const [frequencyPerWeek, setFrequencyPerWeek] = useState(savedPerWeek ? Number(savedPerWeek) : 1);
    const [referralCode, setReferralCode] = useState('');
    
    // Reviews modal state
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [gigReviews, setGigReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    
    // Commitment fee state
    const [commitmentAccess, setCommitmentAccess] = useState(null);
    const [commitmentGateEnabled, setCommitmentGateEnabled] = useState(true);

    const navigate = useNavigate();
    const basePath = "/app/client";
    const isCommitmentRequired = commitmentGateEnabled && (!commitmentAccess || (!commitmentAccess.hasAccess && !commitmentAccess.commitmentNotRequired));
    const canProceedToPayment = !isCommitmentRequired;
    const [cartTipDismissed, setCartTipDismissed] = useState(false);
    const [cartTipInitiallySeen] = useState(() => isTipSeen('tip_cart_commitment_referral'));

    const showCartTip =
      walkthrough?.status === 'completed' &&
      !isRenderingStep4or5 &&
      !cartTipDismissed &&
      !cartTipInitiallySeen;

    useEffect(() => {
      if (!showCartTip) return;

      markTipSeen({
        tipKey: 'tip_cart_commitment_referral',
        context: {
          route: window.location.pathname,
          gigId: id,
        },
      });
    }, [id, markTipSeen, showCartTip]);

    useEffect(() => {
      let isMounted = true;

      const loadCommitmentGateConfig = async () => {
        const enabled = await getCommitmentGateEnabled();
        if (!isMounted) return;

        setCommitmentGateEnabled(enabled);
        if (!enabled) {
          setCommitmentAccess({ hasAccess: true, commitmentNotRequired: true, isAppliedToOrder: false });
        }
      };

      loadCommitmentGateConfig();

      return () => {
        isMounted = false;
      };
    }, []);

    // Handle frequency change
    const handleFrequencyChange = (type) => {
      setSelectedFrequency(type);
      if (type === 'one-time') setFrequencyPerWeek(1);
      if (id) sessionStorage.setItem(`cart_freq_${id}`, type);
      if (type === 'one-time' && id) sessionStorage.setItem(`cart_perweek_${id}`, '1');
    };

    // Handle opening reviews modal
    const handleOpenReviews = async () => {
      setShowReviewsModal(true);
      setReviewsLoading(true);
      try {
        const { reviews, stats } = await GigReviewService.getReviewsWithStats(id);
        setGigReviews(reviews);
        setReviewStats(stats);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setGigReviews([]);
        setReviewStats(null);
      } finally {
        setReviewsLoading(false);
      }
    };

    // Check commitment access when gig loads (used for fee deduction display in OrderDetails)
    useEffect(() => {
      if (!id) return;
      const checkCommitment = async () => {
        if (!commitmentGateEnabled) {
          setCommitmentAccess({ hasAccess: true, commitmentNotRequired: true, isAppliedToOrder: false });
          return;
        }

        try {
          const result = await bookingCommitmentService.checkAccess(id);
          if (result.success) {
            setCommitmentAccess(result.data);
          } else {
            setCommitmentAccess({ hasAccess: false });
          }
        } catch {
          setCommitmentAccess({ hasAccess: false });
        }
      };
      checkCommitment();
    }, [id, commitmentGateEnabled]);

    // Calculate estimated price.
    // commitmentNotRequired is true for CareRequest special gigs — no ₦5,000 deduction applies.
    const calculateEstimatedPrice = () => {
      const basePrice = service?.price || 0;
      let orderFee;
      switch (selectedFrequency) {
        case 'one-time': orderFee = basePrice; break;
        case 'monthly': orderFee = basePrice * frequencyPerWeek * 4; break;
        default: orderFee = basePrice;
      }
      const serviceFee = orderFee * 0.10;
      const commitmentCredit =
        (commitmentGateEnabled && commitmentAccess?.hasAccess &&
         !commitmentAccess?.isAppliedToOrder &&
         !commitmentAccess?.commitmentNotRequired)
          ? 5000
          : 0;
      const totalAmount = orderFee + serviceFee - commitmentCredit;
      return { orderFee, serviceFee, commitmentCredit, totalAmount };
    };

    const handleHire = async () => {
      if (!service) return;
      
      const user = JSON.parse(localStorage.getItem("userDetails"));

      // Clear any stale transaction data from a previous attempt (browser-back edge case)
      localStorage.removeItem('transactionReference');
      localStorage.removeItem('paymentBreakdown');
    
      try {
        const normalizedReferralCode = referralCode.trim();
        const payload = {
          gigId: id,
          serviceType: selectedFrequency,
          frequencyPerWeek: frequencyPerWeek,
          email: user?.email,
          redirectUrl: `${window.location.origin}/app/client/payment-success`,
          ...(selectedFrequency === 'monthly' && normalizedReferralCode ? { referralCode: normalizedReferralCode } : {}),
        };
    
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${config.BASE_URL}/payments/initiate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
          }
        );
    
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData.message || "Payment initiation failed";
          const uiErrorCode = mapUiErrorCode({ message: msg, status: response.status });

          if (uiErrorCode === UI_ERROR_CODES.COMMITMENT_REQUIRED_FOR_CHECKOUT) {
            setPaymentError(
              'You need to pay the ₦5,000 commitment fee before placing an order. ' +
              'Please use the "Unlock Chat" button above to pay the commitment fee first.'
            );
            return;
          }

          if (response.status === 400) {
            if (uiErrorCode === UI_ERROR_CODES.CHECKOUT_REPURCHASE_RECURRING_BLOCKED) {
              setPaymentError(msg);
              setPaymentDisabled(true);
              return;
            }
            if (uiErrorCode === UI_ERROR_CODES.CHECKOUT_DUPLICATE_ACTIVE_ORDER) {
              setPaymentError(msg);
              return;
            }
          }

          throw new Error(msg);
        }
    
        const data = await response.json();
    
        if (data.success && data.paymentLink) {
          localStorage.setItem("transactionReference", data.transactionReference);
          if (data.breakdown) {
            localStorage.setItem("paymentBreakdown", JSON.stringify(data.breakdown));
          }
          // Clean up persisted frequency selection
          sessionStorage.removeItem(`cart_freq_${id}`);
          sessionStorage.removeItem(`cart_perweek_${id}`);
          window.location.href = data.paymentLink;
        } else {
          throw new Error(data.message || "Failed to get payment link");
        }
      } catch (error) {
        console.error("Payment error:", error);
        setPaymentError(error.message);
      }
    };

    useEffect(() => {
        const fetchServiceDetails = async () => {
          try {
            setLoading(true);
            setError(null);
            const allGigs = await ClientGigService.getAllGigs();
            let foundGig = allGigs.find(gig => gig.id === id);
            // Special/private gigs (e.g. care-request offers) are excluded from
            // the marketplace list — fall back to a direct lookup by gig ID.
            if (!foundGig) {
              foundGig = await ClientGigService.getGigById(id);
            }
            if (!foundGig) {
              throw new Error("Service not found or no longer available");
            }
            setService(foundGig);
            // Don't reset frequency — preserve user's previous selection from sessionStorage
          } catch (error) {
            console.error("Error fetching service details:", error);
            setError(error.message);
          } finally {
            setLoading(false);
          }
        };
        fetchServiceDetails();
      }, [id]);
    
      if (loading) return (
        <div className="sd-overlay">
          <div className="sd-card"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>
        </div>
      );

      if (error) return (
        <div className="sd-overlay">
          <div className="sd-card"><p className="sd-error">{error}</p></div>
        </div>
      );

      const prices = calculateEstimatedPrice();
      const deliveryLabel = service?.packageDetails?.deliveryTime || 'Per Day';

      return (
        <div className="sd-overlay">
          <div className="sd-card">
            {/* Header */}
            <div className="sd-header">
              <h2 className="sd-header__title">Service Details</h2>
              <button className="sd-header__close" onClick={() => navigate(-1)} aria-label="Close">
                &times;
              </button>
            </div>

            {showCartTip && (
              <div className="client-tip-banner" role="note">
                <div>
                  <strong>Commitment and referral tip</strong>
                  <p>Referral applies on recurring plans. Commitment rules still follow checkout validation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCartTipDismissed(true);
                    markTipSeen({
                      tipKey: 'tip_cart_commitment_referral',
                      context: {
                        route: window.location.pathname,
                        gigId: id,
                        dismissed: true,
                      },
                    });
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Detail rows */}
            <div className="sd-details">
              <div className="sd-row">
                <span className="sd-row__label">Service Type:</span>
                <span className="sd-row__value">{service?.serviceType || service?.category || 'Care Service'}</span>
              </div>
              <div className="sd-row">
                <span className="sd-row__label">Gig:</span>
                <span className="sd-row__value">{service?.title || 'Service'}</span>
              </div>
              <div className="sd-row">
                <span className="sd-row__label">Basic Package:</span>
                <span className="sd-row__value sd-row__value--price">
                  <strong>{formatPrice(service?.price)}</strong>
                  <span className="sd-row__delivery">Delivery: {deliveryLabel}</span>
                </span>
              </div>
            </div>

            {/* Schedule section */}
            <div className="sd-schedule">
              <p className="sd-schedule__label">Schedule how often do you need this service</p>
              <div className="sd-schedule__options">
                <label className="sd-radio">
                  <input
                    type="radio"
                    name="frequency"
                    checked={selectedFrequency === 'one-time'}
                    onChange={() => handleFrequencyChange('one-time')}
                  />
                  <span className="sd-radio__custom" />
                  <span className="sd-radio__text">One-time</span>
                </label>
                <label className="sd-radio">
                  <input
                    type="radio"
                    name="frequency"
                    checked={selectedFrequency === 'monthly'}
                    onChange={() => handleFrequencyChange('monthly')}
                  />
                  <span className="sd-radio__custom" />
                  <span className="sd-radio__text">Recurrent</span>
                </label>
              </div>

              {/* Recurrent sub-options */}
              {selectedFrequency === 'monthly' && (
                <div className="sd-recurrent">
                  <p className="sd-recurrent__freq-label">How many times per week?</p>
                  <div className="sd-recurrent__freq-btns">
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`sd-freq-btn ${frequencyPerWeek === n ? 'sd-freq-btn--active' : ''}`}
                        onClick={() => { setFrequencyPerWeek(n); if (id) sessionStorage.setItem(`cart_perweek_${id}`, String(n)); }}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                  <p className="sd-recurrent__summary">
                    {`${frequencyPerWeek} visit${frequencyPerWeek > 1 ? 's' : ''}/week × 4 weeks = ${frequencyPerWeek * 4} visits/month`}
                  </p>
                </div>
              )}

              <div className="sd-referral-box">
                <label htmlFor="referralCode" className="sd-referral-box__label">Referral Code</label>
                <input
                  id="referralCode"
                  type="text"
                  className="sd-referral-box__input"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={selectedFrequency !== 'monthly'}
                  placeholder={selectedFrequency === 'monthly' ? 'Enter referral code (optional)' : 'Available for recurring plans only'}
                />
                {selectedFrequency !== 'monthly' && (
                  <p className="sd-referral-box__hint">Referral code is only applicable to recurring plans.</p>
                )}
              </div>
            </div>

            {/* Price summary (only show expanded if recurrent or commitment credit) */}
            {(selectedFrequency !== 'one-time' || prices.commitmentCredit > 0) && (
              <div className="sd-price-summary">
                <div className="sd-price-row">
                  <span>Order fee</span>
                  <span>{formatPrice(prices.orderFee)}</span>
                </div>
                <div className="sd-price-row">
                  <span>Service fee (10%)</span>
                  <span>{formatPrice(prices.serviceFee)}</span>
                </div>
                {prices.commitmentCredit > 0 && (
                  <div className="sd-price-row sd-price-row--credit">
                    <span>Commitment fee credit</span>
                    <span>−₦5,000</span>
                  </div>
                )}
                <div className="sd-price-row sd-price-row--total">
                  <span>Estimated total</span>
                  <span>{formatPrice(prices.totalAmount)}</span>
                </div>
              </div>
            )}

            {/* Payment error */}
            {paymentError && (
              <div className="sd-error">{paymentError}</div>
            )}

            {/* Info notice for CareRequest bookings — no commitment fee required */}
            {commitmentGateEnabled && commitmentAccess?.commitmentNotRequired && (
              <div className="sd-commitment-gate sd-commitment-gate--free">
                <p>✅ No commitment fee required for this booking. Your CareRequest hire allows you to proceed directly to payment.</p>
              </div>
            )}

            {/* Commitment gate — block payment if no commitment and not a free path */}
            {isCommitmentRequired && (
              <div className="sd-commitment-gate">
                <p>🔒 You must pay the ₦5,000 commitment fee before placing an order. This fee is deducted from your total when you hire.</p>
                <button
                  className="sd-commitment-gate__btn"
                  onClick={() => navigate(`/app/client/commitment-payment/${id}`)}
                >
                  🔓 Unlock Access — ₦5,000
                </button>
              </div>
            )}

            {/* CTA */}
            <button
              className="sd-cta"
              onClick={handleHire}
              disabled={paymentDisabled || !canProceedToPayment}
            >
              <span>
                {paymentDisabled
                  ? 'Payment unavailable'
                  : isCommitmentRequired
                    ? 'Pay commitment fee first'
                    : 'Proceed to Payment'}
              </span>
              {!paymentDisabled && canProceedToPayment && (
                <span className="sd-cta__arrow">&rarr;</span>
              )}
            </button>
          </div>

          {/* Reviews Modal */}
          <ReviewsModal
            isOpen={showReviewsModal}
            onClose={() => setShowReviewsModal(false)}
            reviews={gigReviews}
            stats={reviewStats}
            loading={reviewsLoading}
            gigTitle={service?.title}
          />
        </div>
      );
};

export default Cart;