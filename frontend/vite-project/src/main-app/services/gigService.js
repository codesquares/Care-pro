import api from './api';
import config from '../config';

class GigService {
  // Helper method to get authenticated user ID
  static getAuthenticatedUserId() {
    try {
      const userDetails = localStorage.getItem('userDetails');
      if (userDetails) {
        const user = JSON.parse(userDetails);
        return user.id;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user details:', error);
      return null;
    }
  }

  // Save gig as draft
  static async saveDraft(gigData) {
    try {
      // Validate minimum required fields
      const caregiverId = gigData.caregiverId || GigService.getAuthenticatedUserId();
      if (!caregiverId) {
        throw new Error('User not authenticated - cannot save draft');
      }

      // Don't save if no meaningful data exists
      if (!gigData.title && !gigData.category && !gigData.description) {
        console.log('No meaningful data to save, skipping draft save');
        return { success: false, message: 'No data to save' };
      }

      const formData = new FormData();

      // Add basic fields (with defaults for required fields)
      formData.append('Title', gigData.title || 'Untitled Draft');
      formData.append('Category', gigData.category || '');
      formData.append('Description', gigData.description || '');
      formData.append('Location', gigData.location || '');
      formData.append('HourlyRate', gigData.hourlyRate || '0');
      formData.append('Status', 'Draft');
      formData.append('CaregiverId', caregiverId);

      // Add pricing data as JSON string
      if (gigData.pricing) {
        formData.append('Pricing', JSON.stringify(gigData.pricing));
      }

      // Add search tags
      if (gigData.searchTags && gigData.searchTags.length > 0) {
        formData.append('Tags', gigData.searchTags.join(', '));
      }

      // Add subcategories
      if (gigData.subcategory && gigData.subcategory.length > 0) {
        formData.append('SubCategory', gigData.subcategory.join(', '));
      }

      // Add video URL
      formData.append('VideoURL', gigData.video || '');

      // Add availability
      if (gigData.availability) {
        formData.append('Availability', JSON.stringify(gigData.availability));
      }

      // Handle image
      if (gigData.image1) {
        if (gigData.image1 instanceof File) {
          formData.append('Image1', gigData.image1);
        } else if (typeof gigData.image1 === 'string') {
          // If it's a URL or existing image, don't append for draft updates
          console.log('Preserving existing image for draft');
        }
      }

      let response;
      if (gigData.id) {
        // Update existing draft
        response = await api.put(`/Gigs/${gigData.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Create new draft
        response = await api.post('/Gigs', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      return {
        success: true,
        data: response.data,
        id: response.data.id || gigData.id
      };
    } catch (error) {
      console.error('Error saving gig draft:', error);
      throw error;
    }
  }

  // Get draft by ID
  static async getDraft(draftId) {
    try {
      const response = await api.get(`/Gigs/${draftId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching draft:', error);
      throw error;
    }
  }

  // Get all drafts for current user
  static async getUserDrafts() {
    try {
      const caregiverId = GigService.getAuthenticatedUserId();
      if (!caregiverId) {
        throw new Error('User not authenticated');
      }

      // Use the correct endpoint format with path parameter
      const response = await api.get(`/Gigs/caregiver/${caregiverId}`);
      
      // Filter for drafts (case-insensitive)
      const drafts = response.data.filter(gig => 
        gig.status?.toLowerCase() === 'draft'
      );

      return {
        success: true,
        data: drafts
      };
    } catch (error) {
      console.error('Error fetching user drafts:', error);
      throw error;
    }
  }

  // Delete draft
  static async deleteDraft(draftId) {
    try {
      await api.delete(`/Gigs/${draftId}`);
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  // Publish draft (convert to published gig)
  static async publishGig(gigData) {
    try {
      const formData = new FormData();

      // Add all fields with Status as Published
      formData.append('Title', gigData.title || '');
      formData.append('Category', gigData.category || '');
      formData.append('Description', gigData.description || '');
      formData.append('Location', gigData.location || '');
      formData.append('HourlyRate', gigData.hourlyRate || '');
      formData.append('Status', 'Published');
      formData.append('CaregiverId', gigData.caregiverId || GigService.getAuthenticatedUserId() || '');

      if (gigData.pricing) {
        formData.append('Pricing', JSON.stringify(gigData.pricing));
      }

      if (gigData.searchTags && gigData.searchTags.length > 0) {
        formData.append('Tags', gigData.searchTags.join(', '));
      }

      if (gigData.subcategory && gigData.subcategory.length > 0) {
        formData.append('SubCategory', gigData.subcategory.join(', '));
      }

      formData.append('VideoURL', gigData.video || '');

      if (gigData.availability) {
        formData.append('Availability', JSON.stringify(gigData.availability));
      }

      if (gigData.image1 instanceof File) {
        formData.append('Image1', gigData.image1);
      }

      let response;
      if (gigData.id) {
        // Update existing gig
        response = await api.put(`/Gigs/${gigData.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Create new gig
        response = await api.post('/Gigs', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error publishing gig:', error);
      throw error;
    }
  }
}

export default GigService;