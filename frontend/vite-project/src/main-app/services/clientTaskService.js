/**
 * Client Task Service
 * Handles task generation, management and saving to Azure
 */
import config from "../config"; // Centralized API configuration

const ClientTaskService = {
  /**
   * Generate tasks based on client preferences
   * @param {string} clientId - The client's ID
   * @param {Object} preferences - Client preferences
   * @returns {Promise<Array>} - Array of tasks
   */
  async generateTasks(clientId, preferences) {
    try {
      // Generate tasks based on preferences
      const tasks = this.createTasksFromPreferences(preferences);
      
      // Save tasks to Azure
      const saveResult = await this.saveTasks(clientId, tasks);
      
      if (!saveResult.success && saveResult.savedLocally) {
        console.log("Tasks saved locally but not to Azure:", saveResult.message);
      } else if (saveResult.success) {
        console.log("Tasks saved successfully to Azure");
      }
      
      return tasks;
    } catch (error) {
      console.error("Error in generateTasks:", error);
      
      // In case of error, try to return previously stored tasks
      try {
        const storedTasksJson = localStorage.getItem(`client_tasks_${clientId}`);
        if (storedTasksJson) {
          const parsed = JSON.parse(storedTasksJson);
          if (parsed && parsed.tasks && parsed.tasks.length > 0) {
            return parsed.tasks;
          }
        }
      } catch (fallbackError) {
        console.error("Failed to get stored tasks:", fallbackError);
      }
      
      return [];
    }
  },
  
  /**
   * Save tasks to Azure
   * @param {string} clientId - The client's ID
   * @param {Array} tasks - Array of tasks
   * @returns {Promise<Object>} - Response from Azure
   */
  async saveTasks(clientId, tasks) {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Authentication token not found, saving tasks locally only');
        // Store tasks locally even if we can't send to Azure
        localStorage.setItem(`client_tasks_${clientId}`, JSON.stringify({
          tasks: tasks,
          timestamp: new Date().toISOString()
        }));
        return { success: false, message: 'No authentication token', savedLocally: true };
      }
      
      // Use the Azure API endpoint
      const API_URL = `${config.BASE_URL}/ClientTasks`; // Using centralized API config
      
      const payload = {
        clientId: clientId,
        tasks: tasks,
        generatedFrom: 'preferences'
      };
      
      // Store tasks locally as a fallback
      localStorage.setItem(`client_tasks_${clientId}`, JSON.stringify({
        tasks: tasks,
        timestamp: new Date().toISOString()
      }));
      
      // Try sending to Azure API, with timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`API returned ${response.status} when saving tasks`);
          
          // Only try to parse JSON if the content type is JSON
          if (response.headers.get('content-type')?.includes('application/json')) {
            try {
              const errorData = await response.json();

            } catch (jsonError) {
              console.warn('No valid JSON in error response');
            }
          }
          
          // Return gracefully with info about the error
          return { 
            success: false, 
            status: response.status,
            message: `API returned ${response.status}`,
            savedLocally: true
          };
        }
        
        // Safely handle response
        try {
          const data = await response.json();
          return { ...data, success: true };
        } catch (parseError) {
          console.warn('Failed to parse successful response:', parseError);
          return { success: true, message: 'Saved, but response parsing failed' };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('API request timed out');
          return { success: false, message: 'Request timed out', savedLocally: true };
        }
        throw fetchError; // Re-throw other fetch errors
      }
    } catch (error) {
      console.warn("Error in saveTasks:", error);
      return { 
        success: false, 
        message: error.message || 'Unknown error saving tasks',
        savedLocally: true
      };
    }
  },
  
  /**
   * Get tasks for a client
   * @param {string} clientId - The client's ID
   * @returns {Promise<Array>} - Array of tasks
   */
  async getTasks(clientId) {
    try {
      // Check for locally stored tasks first
      const storedTasksJson = localStorage.getItem(`client_tasks_${clientId}`);
      let localTasks = [];
      
      if (storedTasksJson) {
        try {
          const parsed = JSON.parse(storedTasksJson);
          if (parsed && parsed.tasks && parsed.tasks.length > 0) {
            localTasks = parsed.tasks;
            console.log('Found locally stored tasks');
          }
        } catch (parseError) {
          console.warn('Failed to parse stored tasks:', parseError);
        }
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Authentication token not found, using locally stored tasks');
        return localTasks;
      }
      
      // Use the Azure API endpoint
      const API_URL = `${config.BASE_URL}/ClientTasks/${clientId}`; // Using centralized API config
      
      // Use timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // If not found on server (404), use local tasks if available
          if (response.status === 404) {
            console.log('No tasks found on server, using local tasks');
            return localTasks;
          }
          throw new Error(`Error fetching tasks: ${response.status}`);
        }
        
        // Safely parse the response
        try {
          const data = await response.json();
          const serverTasks = data.tasks || [];
          
          // If we have server tasks, update our local cache
          if (serverTasks.length > 0) {
            localStorage.setItem(`client_tasks_${clientId}`, JSON.stringify({
              tasks: serverTasks,
              timestamp: new Date().toISOString()
            }));
            return serverTasks;
          }
          
          // If server returned empty array but we have local tasks, use those
          return serverTasks.length > 0 ? serverTasks : localTasks;
        } catch (parseError) {
          console.warn('Failed to parse response:', parseError);
          return localTasks;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('API request timed out, using local tasks');
          return localTasks;
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error in getTasks:", error);
      
      // Try to get local tasks as a fallback
      try {
        const storedTasksJson = localStorage.getItem(`client_tasks_${clientId}`);
        if (storedTasksJson) {
          const parsed = JSON.parse(storedTasksJson);
          if (parsed && parsed.tasks) {
            return parsed.tasks;
          }
        }
      } catch (fallbackError) {
        console.error('Failed to get fallback tasks:', fallbackError);
      }
      
      return [];
    }
  },
  
  /**
   * Update task status
   * @param {string} clientId - The client's ID
   * @param {string} taskId - The task ID
   * @param {boolean} isComplete - New completion status
   * @returns {Promise<Object>} - Updated task
   */
  async updateTaskStatus(clientId, taskId, isComplete) {
    try {
      // Update task locally first to ensure a responsive UI
      this.updateLocalTaskStatus(clientId, taskId, isComplete);
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Authentication token not found, task updated locally only');
        return { 
          success: true, 
          message: 'Task updated locally only',
          isComplete: isComplete
        };
      }
      
      // Use the Azure API endpoint
      const API_URL = `${config.BASE_URL}/ClientTasks/${clientId}/task/${taskId}`; // Using centralized API config
      
      const payload = {
        isComplete: isComplete
      };
      
      // Use timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(API_URL, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`API returned ${response.status} when updating task status`);
          return { 
            success: false, 
            status: response.status,
            message: `API error, but task updated locally`,
            isComplete: isComplete
          };
        }
        
        // Safely parse the response
        try {
          const data = await response.json();
          return { ...data, success: true };
        } catch (parseError) {
          console.warn('Failed to parse response:', parseError);
          return { success: true, message: 'Task updated', isComplete: isComplete };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('API request timed out, task updated locally');
          return { success: false, message: 'API timeout, task updated locally', isComplete: isComplete };
        }
        console.warn('Fetch error:', fetchError);
        return { success: false, message: fetchError.message, isComplete: isComplete };
      }
    } catch (error) {
      console.error("Error in updateTaskStatus:", error);
      return { success: false, message: error.message, isComplete: isComplete };
    }
  },
  
  /**
   * Create tasks based on client preferences
   * @param {Object} preferences - Client preferences
   * @returns {Array} - Generated tasks
   */
  createTasksFromPreferences(preferences) {
    const tasks = [];
    const now = new Date();
    
    // Task 1: Complete care assessment - always recommended
    tasks.push({
      id: this.generateTaskId(),
      title: "Complete Care Assessment",
      description: "Complete a detailed care needs assessment to help us better understand your specific requirements.",
      priority: 1,
      isComplete: false,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      relatedTo: "assessment"
    });
    
    // Task 2: Based on service type
    if (preferences.serviceType) {
      tasks.push({
        id: this.generateTaskId(),
        title: `Research ${preferences.serviceType} Options`,
        description: `Learn more about ${preferences.serviceType.toLowerCase()} services available in your area.`,
        priority: 2,
        isComplete: false,
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        relatedTo: "education"
      });
    }
    
    // Task 3: Based on location
    if (preferences.location) {
      tasks.push({
        id: this.generateTaskId(),
        title: `Find Local Care Resources in ${preferences.location}`,
        description: `Identify community resources and support services in ${preferences.location} for additional assistance.`,
        priority: 3,
        isComplete: false,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        relatedTo: "community"
      });
    }
    
    // Task 4: Based on schedule
    if (preferences.schedule) {
      tasks.push({
        id: this.generateTaskId(),
        title: "Create Care Schedule",
        description: `Develop a detailed care schedule based on your ${preferences.schedule.toLowerCase()} preference.`,
        priority: 2,
        isComplete: false,
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
        relatedTo: "planning"
      });
    }
    
    // Task 5: Budget planning
    if (preferences.budget && (preferences.budget.min || preferences.budget.max)) {
      tasks.push({
        id: this.generateTaskId(),
        title: "Create Care Budget Plan",
        description: "Develop a comprehensive budget plan for your care needs based on your stated budget preferences.",
        priority: 2,
        isComplete: false,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        relatedTo: "financial"
      });
    }
    
    // Task 6: Special requirements
    if (preferences.specialRequirements) {
      tasks.push({
        id: this.generateTaskId(),
        title: "Address Special Requirements",
        description: "Create a detailed list of your special requirements to share with potential caregivers.",
        priority: 1,
        isComplete: false,
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        relatedTo: "requirements"
      });
    }
    
    // Task 7: Interview preparation - always recommended
    tasks.push({
      id: this.generateTaskId(),
      title: "Prepare Caregiver Interview Questions",
      description: "Develop a list of key questions to ask potential caregivers during interviews.",
      priority: 3,
      isComplete: false,
      dueDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
      relatedTo: "hiring"
    });
    
    return tasks;
  },
  
  /**
   * Update task status locally in localStorage
   * @param {string} clientId - The client's ID
   * @param {string} taskId - The task ID
   * @param {boolean} isComplete - New completion status
   */
  updateLocalTaskStatus(clientId, taskId, isComplete) {
    try {
      const storedTasksJson = localStorage.getItem(`client_tasks_${clientId}`);
      if (!storedTasksJson) return;
      
      const storedData = JSON.parse(storedTasksJson);
      if (!storedData || !storedData.tasks) return;
      
      // Update the task status
      const updatedTasks = storedData.tasks.map(task => 
        task.id === taskId ? { ...task, isComplete } : task
      );
      
      // Save back to localStorage
      localStorage.setItem(`client_tasks_${clientId}`, JSON.stringify({
        ...storedData,
        tasks: updatedTasks,
        lastUpdated: new Date().toISOString()
      }));
      
    } catch (error) {
      console.warn('Error updating task locally:', error);
    }
  },
  
  /**
   * Generate a unique task ID
   * @returns {string} - Task ID
   */
  generateTaskId() {
    return 'task-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

export default ClientTaskService;
