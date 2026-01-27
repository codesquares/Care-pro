import { useEffect, useState } from 'react';
import ServiceProvider from './ServiceProvider';
import ServiceFrequency from './ServiceFrequency';
import TaskList from './TaskList';
import './OrderSpecifications.css';
import configs from '../../config';

const OrderSpecifications = ({
  service, 
  selectedFrequency,
  frequencyPerWeek,
  onFrequencyChange,
  tasks,
  onAddTask,
  onRemoveTask,
  taskValidationError,
  userTasksCount,
  validateTasks,
  onRatingClick
}) => {

  const userDetails = localStorage.getItem('userDetails');
  const clientId = userDetails ? JSON.parse(userDetails).id : null;

  useEffect(() => {
    // Fetch or update data based on the selected service
  }, []);
  
  if (!service) {
    return <div>Loading...</div>;
  }
  
  const serviceTitle = service ? service.title : 'Service Title Not Available';

  return (
    <div className="order-specifications">
      <h2 className="order-specifications__title">Order Specifications</h2>
      
      <div className="order-specifications__service-description">
        {serviceTitle}
      </div>

      <ServiceProvider service={service} onRatingClick={onRatingClick} />

      <ServiceFrequency
        selectedFrequency={selectedFrequency}
        frequencyPerWeek={frequencyPerWeek}
        onFrequencyChange={onFrequencyChange}
        service={service}
      />

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