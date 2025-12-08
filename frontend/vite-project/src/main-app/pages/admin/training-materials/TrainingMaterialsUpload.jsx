import { useState } from 'react';
import adminService from '../../../services/adminService';
import './training-materials.css';

const TrainingMaterialsUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    userType: 'Caregiver',
    description: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);

  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const adminId = userDetails.id;

  const userTypes = adminService.getTrainingUserTypes();
  const acceptedFileTypes = adminService.getAcceptedFileTypes();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file: file
      }));

      // Display file info
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileInfo({
        name: file.name,
        size: fileSizeMB,
        type: file.type
      });
    } else {
      setFormData(prev => ({
        ...prev,
        file: null
      }));
      setFileInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Validate form data
      const validation = adminService.validateTrainingMaterialData({
        ...formData,
        uploadedBy: adminId
      });

      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      // Upload training material
      const uploadResult = await adminService.uploadTrainingMaterial({
        title: formData.title,
        userType: formData.userType,
        file: formData.file,
        description: formData.description || undefined,
        uploadedBy: adminId
      });

      if (uploadResult.success) {
        setResult({
          success: true,
          message: uploadResult.message || 'Training material uploaded successfully!',
          data: uploadResult.data
        });

        // Reset form
        setFormData({
          title: '',
          userType: 'Caregiver',
          description: '',
          file: null
        });
        setFileInfo(null);
        
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setError(uploadResult.error || 'Failed to upload training material');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error uploading training material:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      title: '',
      userType: 'Caregiver',
      description: '',
      file: null
    });
    setFileInfo(null);
    setError(null);
    setResult(null);
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getFileIcon = () => {
    if (!fileInfo) return 'fa-file';
    
    const fileName = fileInfo.name.toLowerCase();
    if (fileName.endsWith('.pdf')) return 'fa-file-pdf';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'fa-file-word';
    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'fa-file-powerpoint';
    if (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi')) return 'fa-file-video';
    return 'fa-file';
  };

  return (
    <div className="training-materials-upload">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <div>
            <h1>Training Materials Upload</h1>
            <p>Upload training materials for caregivers and clients</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <div>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {result && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>Success!</strong>
            <p>{result.message}</p>
            {result.data && (
              <div className="result-details">
                <p><strong>File Name:</strong> {result.data.fileName}</p>
                <p><strong>File Size:</strong> {(result.data.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                {result.data.cloudinaryUrl && (
                  <a 
                    href={result.data.cloudinaryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    <i className="fas fa-external-link-alt"></i>
                    View Uploaded File
                  </a>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setResult(null)} className="alert-close">×</button>
        </div>
      )}

      <div className="upload-container">
        <div className="info-section">
          <h3><i className="fas fa-info-circle"></i> Upload Guidelines</h3>
          <div className="info-content">
            <div className="info-item">
              <h4>Accepted File Types</h4>
              <div className="file-types">
                <span className="file-type-badge"><i className="fas fa-file-pdf"></i> PDF</span>
                <span className="file-type-badge"><i className="fas fa-file-word"></i> Word Documents</span>
                <span className="file-type-badge"><i className="fas fa-file-powerpoint"></i> PowerPoint</span>
                <span className="file-type-badge"><i className="fas fa-file-video"></i> Videos (MP4, MOV, AVI)</span>
              </div>
            </div>

            <div className="info-item">
              <h4>Requirements</h4>
              <ul>
                <li><i className="fas fa-check"></i> Title: 3-200 characters</li>
                <li><i className="fas fa-check"></i> Description: Maximum 500 characters (optional)</li>
                <li><i className="fas fa-check"></i> Select target audience (Caregiver, Cleaner, or Both)</li>
                <li><i className="fas fa-check"></i> Choose appropriate file</li>
              </ul>
            </div>

            <div className="info-item">
              <h4>User Types</h4>
              <ul>
                <li><strong>Caregiver:</strong> Only caregivers can access</li>
                <li><strong>Cleaner:</strong> Only cleaners can access</li>
                <li><strong>Both:</strong> All users can access</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="form-section">
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-group">
              <label htmlFor="title">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to Elder Care"
                required
                minLength={3}
                maxLength={200}
              />
              <small className="char-count">
                {formData.title.length}/200 characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="userType">
                Target Audience <span className="required">*</span>
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                required
              >
                {userTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <small className="help-text">
                Select who can access this training material
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="optional">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide a detailed description of the training content..."
                rows="4"
                maxLength={500}
              />
              <small className="char-count">
                {formData.description.length}/500 characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="file-input">
                Training Material File <span className="required">*</span>
              </label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-input"
                  accept={acceptedFileTypes}
                  onChange={handleFileChange}
                  required
                />
                <div className="file-input-display">
                  {fileInfo ? (
                    <div className="file-selected">
                      <i className={`fas ${getFileIcon()}`}></i>
                      <div className="file-details">
                        <span className="file-name">{fileInfo.name}</span>
                        <span className="file-size">{fileInfo.size} MB</span>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-file"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, file: null }));
                          setFileInfo(null);
                          document.getElementById('file-input').value = '';
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <p>Click to select or drag and drop file here</p>
                      <small>PDF, Documents, or Videos</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearForm}
                disabled={loading}
              >
                <i className="fas fa-redo"></i>
                Clear Form
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !formData.file}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i>
                    Upload Training Material
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrainingMaterialsUpload;
