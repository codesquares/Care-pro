import React, { useEffect, useState } from 'react';
import ServiceProvider from './ServiceProvider';
import ServiceFrequency from './ServiceFrequency';
import TaskList from './TaskList';
import './OrderSpecifications.css';
import configs from '../../config';

const OrderSpecifications = ({
  service, 
  selectedFrequency, 
  onFrequencyChange,
  tasks,
  onAddTask,
  onRemoveTask,
  taskValidationError,
  userTasksCount,
  validateTasks
}) => {

  const userDetails = localStorage.getItem('userDetails');
  console.log('User details:', userDetails);
  const clientId = userDetails ? JSON.parse(userDetails).id : null;
  useEffect(() => {
    // Fetch or update data based on the selected service
    //fetch caregiver details or service specifications if needed
  }, []);
  
  if (!service) {
    return <div>Loading...</div>;
  }
  console.log('Service inside order specifications:', service);
  const [frequencyPriceData, setFrequencyPriceData] = useState(null);
  
  // Task management is now handled by parent (Cart)
  const serviceTitle = service? service.title : 'Service Title Not Available';

  // Enhanced frequency change handler - now just passes to parent
  const handleFrequencyChange = (frequencyId, priceData) => {
    setFrequencyPriceData(priceData); // Keep local copy for form inputs
    onFrequencyChange(frequencyId, priceData); // Pass to parent (Cart)
  };

  return (
    <div className="order-specifications">
      <h2 className="order-specifications__title">Order Specifications</h2>
      
      <div className="order-specifications__service-description">
        {serviceTitle}
      </div>

      <ServiceProvider service={service} />

      <ServiceFrequency
        selectedFrequency={selectedFrequency}
        onFrequencyChange={handleFrequencyChange}
        service={service}
      />

      {/* Frequency Price Data for OrderDetails or other components */}
      {frequencyPriceData && (
        <>
          <input 
            type="hidden" 
            name="frequencyPriceData" 
            value={JSON.stringify(frequencyPriceData)} 
          />
        </>
      )}

      {/* Task validation error */}
      {taskValidationError && (
        <div className="order-specifications__error">
          {taskValidationError}
        </div>
      )}

      {/* Hidden form inputs for task data */}
      <input 
        type="hidden" 
        name="userTasks" 
        value={JSON.stringify(tasks.filter(task => !task.isExplanatory).map(task => task.text))} 
      />
      <input 
        type="hidden" 
        name="taskCount" 
        value={userTasksCount} 
      />

      <TaskList 
        tasks={tasks}
        onAddTask={onAddTask}
        onRemoveTask={onRemoveTask}
        service={service}
        userTasksCount={userTasksCount}
        validateTasks={validateTasks}
      />
    </div>
  );
};

export default OrderSpecifications;