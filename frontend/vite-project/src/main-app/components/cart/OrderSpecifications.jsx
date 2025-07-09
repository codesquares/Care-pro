import React, { useState } from 'react';
import ServiceProvider from './ServiceProvider';
import ServiceFrequency from './ServiceFrequency';
import TaskList from './TaskList';
import './OrderSpecifications.css';

const OrderSpecifications = () => {
  const [selectedFrequency, setSelectedFrequency] = useState('weekly');
  const [tasks, setTasks] = useState([
    'Help with physical therapy exercises or encourage light exercise like walking',
    'Walk my dogs and feed my cat for a month',
    'Catering and cooking international dishes for a month'
  ]);

  const serviceTitle = "I will clean your house and do your laundry twice a week";

  const handleAddTask = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  const handleRemoveTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="order-specifications">
      <h2 className="order-specifications__title">Order Specifications</h2>
      
      <div className="order-specifications__service-description">
        {serviceTitle}
      </div>

      <ServiceProvider />
      
      <ServiceFrequency 
        selectedFrequency={selectedFrequency}
        onFrequencyChange={setSelectedFrequency}
      />

      <TaskList 
        tasks={tasks}
        onAddTask={handleAddTask}
        onRemoveTask={handleRemoveTask}
      />
    </div>
  );
};

export default OrderSpecifications;