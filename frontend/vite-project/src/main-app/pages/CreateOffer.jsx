import { useState } from 'react';
import './CreateOffer.scss';

const CreateOffer = () => {
  const [formData, setFormData] = useState({
    offerCategory: '',
    physicalCare: '',
    responsibilities: '',
    tasks: [],
    pricing: ''
  });

  const [newTask, setNewTask] = useState('');

  const categories = [
    'Children Care',
    'Physical Care',
    'Elderly Care',
    'Disability Support',
    'Mental Health Support',
    'Companionship',
    'Household Tasks'
  ];

  const physicalCareOptions = [
    'Basic Physical Care',
    'Advanced Physical Care',
    'Mobility Assistance',
    'Personal Hygiene',
    'Medication Management'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTask = () => {
    if (newTask.trim() && !formData.tasks.includes(newTask.trim())) {
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask.trim()]
      }));
      setNewTask('');
    }
  };

  const removeTask = (taskToRemove) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task !== taskToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Offer data:', formData);
    // Handle form submission
  };

  return (
    <div className="create-offer">
      <div className="create-offer-container">
        <div className="create-offer-header">
          <button className="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1>Create an Offer</h1>
          <div className="header-actions">
            <button className="cancel-button">Cancel</button>
            <button className="report-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
              </svg>
              Report
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-offer-form">
          <div className="form-content">
            <div className="form-intro">
              <p>Fill in the following details and the caregiver would accept or reject your offer</p>
            </div>

            <div className="form-group">
              <label htmlFor="offerCategory">Offer category</label>
              <div className="select-group">
                <select
                  id="offerCategory"
                  value={formData.offerCategory}
                  onChange={(e) => handleInputChange('offerCategory', e.target.value)}
                  required
                >
                  <option value="">Children Care</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={formData.physicalCare}
                  onChange={(e) => handleInputChange('physicalCare', e.target.value)}
                  required
                >
                  <option value="">Physical Care</option>
                  {physicalCareOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="responsibilities">Overview of responsibilities</label>
              <textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                placeholder="I take care of my father who needs personal and general home care including cooking laundry and maintaining a..."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Tasks (optional)</label>
              <p className="field-description">
                Help with physical therapy exercises or encourage light exercise like walking
              </p>
              
              <div className="tasks-container">
                {formData.tasks.map((task, index) => (
                  <div key={index} className="task-tag">
                    <span>{task}</span>
                    <button 
                      type="button"
                      onClick={() => removeTask(task)}
                      className="remove-task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ))}
                
                <div className="add-task-container">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Walk my dogs and feed my cat for a month"
                    className="add-task-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTask();
                      }
                    }}
                  />
                  {newTask && (
                    <button 
                      type="button"
                      onClick={addTask}
                      className="add-task-button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </button>
                  )}
                </div>
                
                <button type="button" className="add-new-task" onClick={() => document.querySelector('.add-task-input').focus()}>
                  Add a new task...
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pricing">Enter pricing</label>
              <div className="pricing-input">
                <span className="currency">₦</span>
                <input
                  type="number"
                  id="pricing"
                  value={formData.pricing}
                  onChange={(e) => handleInputChange('pricing', e.target.value)}
                  placeholder="30000.00"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="send-offer-button">
              Send Offer to Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOffer;
