import { useState } from "react";
import { toast } from "react-toastify";
import OrderTasksService from "../../services/orderTasksService";
import "./CreateOrderTasksModal.css";

const CreateOrderTasksModal = ({ 
  isOpen, 
  onClose, 
  orderData, 
  onOrderTasksCreated 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    packageSelection: {
      packageType: "Standard",
      visitsPerWeek: 3,
      pricePerVisit: 50.00,
      totalWeeklyPrice: 150.00,
      durationWeeks: 4
    },
    careTasks: [
      {
        title: "",
        description: "",
        category: "Medical",
        priority: "Medium",
        specialRequirements: "",
        estimatedDurationMinutes: 30
      }
    ],
    specialInstructions: "",
    preferredTimes: [""],
    emergencyContacts: [""]
  });

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePackageChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      packageSelection: {
        ...prev.packageSelection,
        [field]: value
      }
    }));
  };

  const addCareTask = () => {
    setFormData(prev => ({
      ...prev,
      careTasks: [
        ...prev.careTasks,
        {
          title: "",
          description: "",
          category: "Medical",
          priority: "Medium",
          specialRequirements: "",
          estimatedDurationMinutes: 30
        }
      ]
    }));
  };

  const updateCareTask = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      careTasks: prev.careTasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const removeCareTask = (index) => {
    if (formData.careTasks.length > 1) {
      setFormData(prev => ({
        ...prev,
        careTasks: prev.careTasks.filter((_, i) => i !== index)
      }));
    }
  };

  const addPreferredTime = () => {
    setFormData(prev => ({
      ...prev,
      preferredTimes: [...prev.preferredTimes, ""]
    }));
  };

  const updatePreferredTime = (index, value) => {
    setFormData(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.map((time, i) => 
        i === index ? value : time
      )
    }));
  };

  const removePreferredTime = (index) => {
    if (formData.preferredTimes.length > 1) {
      setFormData(prev => ({
        ...prev,
        preferredTimes: prev.preferredTimes.filter((_, i) => i !== index)
      }));
    }
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, ""]
    }));
  };

  const updateEmergencyContact = (index, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, i) => 
        i === index ? value : contact
      )
    }));
  };

  const removeEmergencyContact = (index) => {
    if (formData.emergencyContacts.length > 1) {
      setFormData(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (formData.careTasks.some(task => !task.title || !task.description)) {
        toast.error("Please fill in all task titles and descriptions");
        setLoading(false);
        return;
      }

      // Calculate total weekly price
      const calculatedWeeklyPrice = formData.packageSelection.visitsPerWeek * formData.packageSelection.pricePerVisit;
      
      // Prepare OrderTasks data following the API spec
      const orderTasksData = {
        clientId: orderData.clientId || orderData.userId,
        gigId: orderData.gigId,
        caregiverId: orderData.caregiverId,
        packageSelection: {
          ...formData.packageSelection,
          totalWeeklyPrice: calculatedWeeklyPrice
        },
        careTasks: formData.careTasks.filter(task => task.title && task.description),
        specialInstructions: formData.specialInstructions,
        preferredTimes: formData.preferredTimes.filter(time => time.trim()),
        emergencyContacts: formData.emergencyContacts.filter(contact => contact.trim())
      };

      const result = await OrderTasksService.createOrderTasks(orderTasksData);

      if (result.success) {
        toast.success("Task requirements created successfully!");
        onOrderTasksCreated(result.data);
        onClose();
      } else {
        toast.error(result.error || "Failed to create task requirements");
      }
    } catch (error) {
      console.error("Error creating OrderTasks:", error);
      toast.error("Failed to create task requirements");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-tasks-modal-overlay">
      <div className="order-tasks-modal-content">
        <div className="modal-header">
          <h3>Create Task Requirements</h3>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="order-tasks-form">
          {/* Package Selection */}
          <div className="form-section">
            <h4>Package Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Package Type</label>
                <select 
                  value={formData.packageSelection.packageType}
                  onChange={(e) => handlePackageChange('packageType', e.target.value)}
                >
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div className="form-group">
                <label>Visits Per Week</label>
                <input 
                  type="number" 
                  min="1" 
                  max="7"
                  value={formData.packageSelection.visitsPerWeek}
                  onChange={(e) => handlePackageChange('visitsPerWeek', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price Per Visit (₦)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.packageSelection.pricePerVisit}
                  onChange={(e) => handlePackageChange('pricePerVisit', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Duration (Weeks)</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.packageSelection.durationWeeks}
                  onChange={(e) => handlePackageChange('durationWeeks', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Care Tasks */}
          <div className="form-section">
            <div className="section-header">
              <h4>Care Tasks</h4>
              <button type="button" onClick={addCareTask} className="add-btn">
                + Add Task
              </button>
            </div>
            
            {formData.careTasks.map((task, index) => (
              <div key={index} className="care-task-item">
                <div className="task-header">
                  <h5>Task {index + 1}</h5>
                  {formData.careTasks.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeCareTask(index)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Task Title *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Medication Management"
                      value={task.title}
                      onChange={(e) => updateCareTask(index, 'title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      value={task.category}
                      onChange={(e) => updateCareTask(index, 'category', e.target.value)}
                    >
                      <option value="Medical">Medical</option>
                      <option value="Personal">Personal Care</option>
                      <option value="Household">Household</option>
                      <option value="Mobility">Mobility</option>
                      <option value="Social">Social</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea 
                    placeholder="Describe what this task involves..."
                    value={task.description}
                    onChange={(e) => updateCareTask(index, 'description', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select 
                      value={task.priority}
                      onChange={(e) => updateCareTask(index, 'priority', e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input 
                      type="number" 
                      min="5"
                      step="5"
                      value={task.estimatedDurationMinutes}
                      onChange={(e) => updateCareTask(index, 'estimatedDurationMinutes', parseInt(e.target.value) || 30)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Special Requirements</label>
                  <textarea 
                    placeholder="Any special requirements for this task..."
                    value={task.specialRequirements}
                    onChange={(e) => updateCareTask(index, 'specialRequirements', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Preferred Times */}
          <div className="form-section">
            <div className="section-header">
              <h4>Preferred Times</h4>
              <button type="button" onClick={addPreferredTime} className="add-btn">
                + Add Time
              </button>
            </div>
            
            {formData.preferredTimes.map((time, index) => (
              <div key={index} className="time-item">
                <input 
                  type="text" 
                  placeholder="e.g., 9:00 AM - 11:00 AM"
                  value={time}
                  onChange={(e) => updatePreferredTime(index, e.target.value)}
                />
                {formData.preferredTimes.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removePreferredTime(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Emergency Contacts */}
          <div className="form-section">
            <div className="section-header">
              <h4>Emergency Contacts</h4>
              <button type="button" onClick={addEmergencyContact} className="add-btn">
                + Add Contact
              </button>
            </div>
            
            {formData.emergencyContacts.map((contact, index) => (
              <div key={index} className="contact-item">
                <input 
                  type="text" 
                  placeholder="e.g., Daughter: (555) 123-4567"
                  value={contact}
                  onChange={(e) => updateEmergencyContact(index, e.target.value)}
                />
                {formData.emergencyContacts.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeEmergencyContact(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Special Instructions */}
          <div className="form-section">
            <h4>Special Instructions</h4>
            <div className="form-group">
              <textarea 
                placeholder="Any special instructions or preferences for the caregiver..."
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating...' : 'Create Task Requirements'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderTasksModal;