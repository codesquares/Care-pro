import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ContractService from "../../services/contractService";
import { createNotification } from "../../services/notificationService";
import "./ContractGenerationModal.css";

/**
 * ContractGenerationModal - Caregiver-initiated contract generation
 * 
 * In the new flow:
 * 1. Caregiver clicks "Generate Contract" on a paid order
 * 2. Caregiver inputs agreed schedule with client
 * 3. Adds service address & special requirements
 * 4. Contract sent to client for approval
 */
const ContractGenerationModal = ({ 
  isOpen, 
  onClose, 
  orderData,
  onContractGenerated,
  isRevision = false,
  existingContract = null
}) => {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [formData, setFormData] = useState({
    serviceAddress: "",
    specialClientRequirements: "",
    accessInstructions: "",
    additionalNotes: "",
    revisionNotes: ""
  });

  /**
   * Get visits per week from order data
   * The order contains:
   * - serviceType: "one-time", "weekly", or "monthly"
   * - frequencyPerWeek: 1-7 (number of visits per week)
   * 
   * For "one-time" orders, it's always 1 visit regardless of frequencyPerWeek
   * For "weekly"/"monthly" orders, use the frequencyPerWeek value
   */
  const getVisitsPerWeek = () => {
    if (!orderData) return 1;
    
    const serviceType = orderData.serviceType?.toLowerCase();
    
    // For one-time orders, always 1 visit
    if (serviceType === 'one-time') {
      return 1;
    }
    
    // For weekly/monthly orders, use frequencyPerWeek
    // Check multiple possible field names for backwards compatibility
    const frequency = orderData.frequencyPerWeek || 
                      orderData.visitsPerWeek || 
                      orderData.selectedPackage?.visitsPerWeek || 
                      orderData.packageDetails?.visitsPerWeek;
    
    // Default to 1 if no frequency found
    return frequency || 1;
  };
  
  const visitsPerWeek = getVisitsPerWeek();

  // Initialize schedule with correct number of visits
  useEffect(() => {
    if (isOpen) {
      if (isRevision && existingContract?.schedule) {
        // Pre-fill with existing schedule for revision
        setSchedule(existingContract.schedule.map(visit => ({
          dayOfWeek: visit.dayOfWeek,
          startTime: visit.startTime,
          endTime: visit.endTime
        })));
        setFormData({
          serviceAddress: existingContract.serviceAddress || "",
          specialClientRequirements: existingContract.specialClientRequirements || "",
          accessInstructions: existingContract.accessInstructions || "",
          additionalNotes: existingContract.caregiverAdditionalNotes || "",
          revisionNotes: ""
        });
      } else {
        // Initialize empty schedule entries
        const initialSchedule = Array(visitsPerWeek).fill(null).map(() => ({
          dayOfWeek: "",
          startTime: "",
          endTime: ""
        }));
        setSchedule(initialSchedule);
        setFormData({
          serviceAddress: "",
          specialClientRequirements: "",
          accessInstructions: "",
          additionalNotes: "",
          revisionNotes: ""
        });
      }
    }
  }, [isOpen, visitsPerWeek, isRevision, existingContract]);

  const daysOfWeek = ContractService.getDaysOfWeek();
  const timeOptions = ContractService.getTimeOptions();

  const handleScheduleChange = (index, field, value) => {
    setSchedule(prev => prev.map((visit, i) => 
      i === index ? { ...visit, [field]: value } : visit
    ));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateSchedule = () => {
    for (let i = 0; i < schedule.length; i++) {
      const visit = schedule[i];
      if (!visit.dayOfWeek || !visit.startTime || !visit.endTime) {
        toast.error(`Please complete visit ${i + 1} schedule`);
        return false;
      }
      const duration = ContractService.calculateVisitDuration(visit.startTime, visit.endTime);
      if (duration < 4 || duration > 6) {
        toast.error(`Visit ${i + 1} (${visit.dayOfWeek}) must be between 4 and 6 hours. Current: ${duration} hours`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSchedule()) return;
    
    if (!formData.serviceAddress.trim()) {
      toast.error("Service address is required");
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isRevision && existingContract?.id) {
        // Revise existing contract
        result = await ContractService.reviseContract({
          contractId: existingContract.id,
          revisedSchedule: schedule,
          serviceAddress: formData.serviceAddress,
          specialClientRequirements: formData.specialClientRequirements,
          accessInstructions: formData.accessInstructions,
          additionalNotes: formData.additionalNotes,
          revisionNotes: formData.revisionNotes
        });
      } else {
        // Generate new contract
        result = await ContractService.generateContractAsCaregiver({
          orderId: orderData?.id || orderData?.orderId,
          schedule: schedule,
          serviceAddress: formData.serviceAddress,
          specialClientRequirements: formData.specialClientRequirements,
          accessInstructions: formData.accessInstructions,
          additionalNotes: formData.additionalNotes
        });
      }

      if (result.success) {
        toast.success(isRevision ? "Contract revised and sent to client!" : "Contract generated and sent to client for approval!");
        onContractGenerated?.(result.data);

        // Send notification to the client about the contract
        try {
          const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
          const caregiverId = userDetails?.id;
          const clientId = orderData?.clientId;
          const theOrderId = orderData?.id || orderData?.orderId;

          if (caregiverId && clientId && theOrderId) {
            await createNotification({
              recipientId: clientId,
              senderId: caregiverId,
              type: isRevision ? 'ContractSent' : 'ContractSent',
              relatedEntityId: theOrderId,
              title: isRevision
                ? `📝 Revised contract sent for your review`
                : `📋 New contract sent for your review`,
              content: isRevision
                ? `Your caregiver has revised the contract for "${orderData?.gigTitle || orderData?.serviceName || 'your order'}". Please review and approve or request changes.`
                : `Your caregiver has sent you a contract for "${orderData?.gigTitle || orderData?.serviceName || 'your order'}". Please review and approve or request changes.`
            });
          }
        } catch (notifError) {
          console.error("Failed to send contract notification:", notifError);
          // Don't block the success flow for a notification failure
        }

        onClose();
      } else {
        toast.error(result.error || "Failed to process contract");
      }
    } catch (error) {
      console.error("Contract operation error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contract-modal-overlay" onClick={(e) => e.target.className === 'contract-modal-overlay' && onClose()}>
      <div className="contract-modal-content">
        <div className="contract-modal-header">
          <h2>{isRevision ? "📝 Revise Contract" : "📋 Generate Contract"}</h2>
          <button className="close-modal-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="contract-form">
          {/* Order Summary */}
          <div className="order-summary-section">
            <h3>Order Summary</h3>
            <div className="order-info-grid">
              <p><strong>Service:</strong> {orderData?.gigTitle || orderData?.serviceName || 'N/A'}</p>
              <p><strong>Client:</strong> {orderData?.clientName || 'N/A'}</p>
              <p><strong>Service Type:</strong> {orderData?.serviceType ? 
                orderData.serviceType.charAt(0).toUpperCase() + orderData.serviceType.slice(1).replace('-', ' ') : 
                'N/A'}</p>
              <p><strong>Visits per Week:</strong> {visitsPerWeek}</p>
              <p><strong>Total Amount:</strong> ₦{orderData?.totalAmount?.toLocaleString() || orderData?.amount?.toLocaleString() || 'N/A'}</p>
            </div>
          </div>

          {/* Client Review Comments (for revision) */}
          {isRevision && existingContract?.clientReviewComments && (
            <div className="client-feedback-section">
              <h3>⚠️ Client Requested Changes</h3>
              <div className="client-feedback-box">
                <p>{existingContract.clientReviewComments}</p>
              </div>
            </div>
          )}

          {/* Schedule Section */}
          <div className="schedule-section">
            <h3>📅 Service Schedule</h3>
            <p className="section-description">
              Schedule {visitsPerWeek} visit(s) per week. Each visit must be 4-6 hours.
            </p>
            
            {schedule.map((visit, index) => (
              <div key={index} className="visit-schedule-row">
                <div className="visit-label">Visit {index + 1}</div>
                
                <div className="schedule-inputs">
                  <div className="input-group">
                    <label>Day</label>
                    <select
                      value={visit.dayOfWeek}
                      onChange={(e) => handleScheduleChange(index, 'dayOfWeek', e.target.value)}
                      required
                    >
                      <option value="">Select day...</option>
                      {daysOfWeek.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Start Time</label>
                    <select
                      value={visit.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      required
                    >
                      <option value="">Select time...</option>
                      {timeOptions.map(time => (
                        <option key={time.value} value={time.value}>{time.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>End Time</label>
                    <select
                      value={visit.endTime}
                      onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                      required
                    >
                      <option value="">Select time...</option>
                      {timeOptions.map(time => (
                        <option key={time.value} value={time.value}>{time.label}</option>
                      ))}
                    </select>
                  </div>

                  {visit.startTime && visit.endTime && (
                    <div className="duration-badge">
                      {ContractService.calculateVisitDuration(visit.startTime, visit.endTime)} hrs
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Service Details Section */}
          <div className="service-details-section">
            <h3>📍 Service Details</h3>
            
            <div className="form-group">
              <label>Service Address <span className="required">*</span></label>
              <input
                type="text"
                value={formData.serviceAddress}
                onChange={(e) => handleFormChange('serviceAddress', e.target.value)}
                placeholder="Enter the full service address"
                required
              />
            </div>

            <div className="form-group">
              <label>Special Client Requirements</label>
              <textarea
                value={formData.specialClientRequirements}
                onChange={(e) => handleFormChange('specialClientRequirements', e.target.value)}
                placeholder="E.g., Client uses wheelchair, needs assistance with bathing..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Access Instructions</label>
              <textarea
                value={formData.accessInstructions}
                onChange={(e) => handleFormChange('accessInstructions', e.target.value)}
                placeholder="E.g., Gate code: 1234, Ring bell twice, Parking in visitor spot..."
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleFormChange('additionalNotes', e.target.value)}
                placeholder="Any other information the client should know..."
                rows="2"
              />
            </div>

            {isRevision && (
              <div className="form-group revision-notes">
                <label>Revision Notes <span className="required">*</span></label>
                <textarea
                  value={formData.revisionNotes}
                  onChange={(e) => handleFormChange('revisionNotes', e.target.value)}
                  placeholder="Explain what changes you made based on client's feedback..."
                  rows="2"
                  required={isRevision}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="contract-modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading 
                ? (isRevision ? "Revising..." : "Generating...") 
                : (isRevision ? "Send Revised Contract" : "Send Contract for Approval")
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractGenerationModal;
