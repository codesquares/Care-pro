import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import './email-composer.css';

const EmailComposer = () => {
  const [emailMode, setEmailMode] = useState('bulk'); // 'individual' or 'bulk'
  const [recipientType, setRecipientType] = useState('All');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [individualRecipient, setIndividualRecipient] = useState({
    email: '',
    name: ''
  });
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateType, setTemplateType] = useState('announcement');
  
  const [caregivers, setCaregivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState(null);
  
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [attachmentErrors, setAttachmentErrors] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (useTemplate) {
      generateTemplateMessage();
    }
  }, [useTemplate, templateType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const [caregiversResult, clientsResult] = await Promise.all([
        adminService.getAllCaregivers(),
        adminService.getAllClients()
      ]);
      
      if (caregiversResult.success) {
        setCaregivers(caregiversResult.data);
      }
      
      if (clientsResult.success) {
        setClients(clientsResult.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateAttachments = (files) => {
    const errors = [];
    const allowedTypes = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'],
      'video/mp4': ['.mp4'],
      'application/pdf': ['.pdf']
    };
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const maxTotalSize = 100 * 1024 * 1024; // 100MB
    
    // Check count
    if (files.length > 5) {
      errors.push('Maximum 5 files allowed');
      return { isValid: false, errors };
    }
    
    let totalSize = 0;
    
    files.forEach((file) => {
      totalSize += file.size;
      
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: Exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      }
      
      // Check file type
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const mimeType = file.type;
      
      if (!allowedTypes[mimeType] || !allowedTypes[mimeType].includes(extension)) {
        errors.push(`${file.name}: Invalid file type (only JPG, JPEG, MP4, PDF allowed)`);
      }
    });
    
    // Check total size
    if (totalSize > maxTotalSize) {
      errors.push(`Total size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds 100MB limit`);
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const currentFileCount = attachments.length;
    const newFiles = files.slice(0, 5 - currentFileCount);
    
    if (newFiles.length === 0) {
      setAttachmentErrors(['Maximum 5 files allowed']);
      return;
    }
    
    const updatedAttachments = [...attachments, ...newFiles];
    const validation = validateAttachments(updatedAttachments);
    
    setAttachments(updatedAttachments);
    setAttachmentErrors(validation.errors);
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    const updatedAttachments = attachments.filter((_, i) => i !== index);
    const validation = validateAttachments(updatedAttachments);
    
    setAttachments(updatedAttachments);
    setAttachmentErrors(validation.errors);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename) => {
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    switch (extension) {
      case '.pdf':
        return '📄';
      case '.jpg':
      case '.jpeg':
        return '🖼️';
      case '.mp4':
        return '🎬';
      default:
        return '📎';
    }
  };

  const generateTemplateMessage = () => {
    const variables = {
      title: 'Important Update',
      content: 'Your content here...',
      name: 'User',
      callToAction: 'Learn More',
      actionUrl: 'https://oncarepro.com/dashboard'
    };
    
    const template = adminService.getEmailTemplate(templateType, variables);
    setMessage(template);
  };

  const getRecipientCount = () => {
    if (emailMode === 'individual') return 1;
    
    return adminService.getRecipientCount(recipientType, selectedUsers.map(u => u.id), {
      caregivers,
      clients
    });
  };

  const handleSendEmail = async () => {
    try {
      setSending(true);
      setResult(null);

      let emailResult;

      if (emailMode === 'individual') {
        // Send to individual
        emailResult = await adminService.sendEmail({
          recipientEmail: individualRecipient.email,
          recipientName: individualRecipient.name,
          subject,
          message,
          attachments
        });
      } else {
        // Send bulk email
        const bulkData = {
          recipientType,
          subject,
          message,
          attachments
        };

        if (recipientType === 'Specific') {
          bulkData.specificUserIds = selectedUsers.map(u => u.id);
        }

        emailResult = await adminService.sendBulkEmail(bulkData);
      }

      setResult(emailResult);

      if (emailResult.success) {
        // Reset form on success
        setTimeout(() => {
          setSubject('');
          setMessage('');
          setIndividualRecipient({ email: '', name: '' });
          setSelectedUsers([]);
          setAttachments([]);
          setAttachmentErrors([]);
          setResult(null);
        }, 5000);
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setResult({
        success: false,
        error: 'An unexpected error occurred'
      });
    } finally {
      setSending(false);
    }
  };

  const handleUserSelection = (user, userType) => {
    const userId = user.id;
    const isSelected = selectedUsers.some(u => u.id === userId);

    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, {
        id: userId,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        type: userType
      }]);
    }
  };

  const getFilteredUsers = () => {
    const term = userSearchTerm.toLowerCase();
    const allUsers = [
      ...caregivers.map(c => ({ ...c, userType: 'Caregiver' })),
      ...clients.map(c => ({ ...c, userType: 'Client' }))
    ];

    if (!term) return allUsers;

    return allUsers.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  };

  const insertTemplate = (type) => {
    let template = '';
    switch (type) {
      case 'bold':
        template = '<strong>Bold text</strong>';
        break;
      case 'italic':
        template = '<em>Italic text</em>';
        break;
      case 'link':
        template = '<a href="https://oncarepro.com">Link text</a>';
        break;
      case 'button':
        template = `<div style="text-align: center; margin: 20px 0;">
  <a href="https://oncarepro.com" 
     style="background-color: #667eea; color: white; padding: 12px 30px; 
            text-decoration: none; border-radius: 5px; display: inline-block;">
    Click Here
  </a>
</div>`;
        break;
      case 'list':
        template = `<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>`;
        break;
      case 'infobox':
        template = `<div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
  <h4 style="margin-top: 0;">Important Information</h4>
  <p>Your content here...</p>
</div>`;
        break;
      default:
        break;
    }
    setMessage(message + '\n' + template);
  };

  return (
    <div className="email-composer">
      <div className="email-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-envelope"></i>
            Email Composer
          </h1>
          <p>Send custom emails to users</p>
        </div>
      </div>

      {/* Result Alert */}
      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
          <i className={`fas ${result.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <div className="alert-content">
            <strong>{result.success ? 'Success!' : 'Error'}</strong>
            <p>{result.message || result.error}</p>
            {result.attachmentCount > 0 && (
              <p className="attachment-info-result">
                <i className="fas fa-paperclip"></i>
                {result.attachmentCount} file(s) attached
              </p>
            )}
            {result.stats && (
              <div className="email-stats">
                <span>Total: {result.stats.totalRecipients}</span>
                <span>Sent: {result.stats.successfulSends}</span>
                {result.stats.failedSends > 0 && (
                  <span className="failed">Failed: {result.stats.failedSends}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="email-composer-content">
        {/* Email Mode Selection */}
        <div className="section-card">
          <h2>
            <i className="fas fa-users"></i>
            Recipients
          </h2>
          
          <div className="mode-selector">
            <button
              className={`mode-btn ${emailMode === 'individual' ? 'active' : ''}`}
              onClick={() => {
                setEmailMode('individual');
                setSelectedUsers([]);
              }}
            >
              <i className="fas fa-user"></i>
              Individual User
            </button>
            <button
              className={`mode-btn ${emailMode === 'bulk' ? 'active' : ''}`}
              onClick={() => {
                setEmailMode('bulk');
                setIndividualRecipient({ email: '', name: '' });
              }}
            >
              <i className="fas fa-users"></i>
              Bulk Email
            </button>
          </div>

          {/* Individual Recipient */}
          {emailMode === 'individual' && (
            <div className="recipient-form">
              <div className="form-group">
                <label>Recipient Email *</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={individualRecipient.email}
                  onChange={(e) => setIndividualRecipient({
                    ...individualRecipient,
                    email: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <label>Recipient Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={individualRecipient.name}
                  onChange={(e) => setIndividualRecipient({
                    ...individualRecipient,
                    name: e.target.value
                  })}
                />
              </div>
            </div>
          )}

          {/* Bulk Recipients */}
          {emailMode === 'bulk' && (
            <div className="bulk-recipient-selector">
              <div className="form-group">
                <label>Recipient Type *</label>
                <select
                  value={recipientType}
                  onChange={(e) => {
                    setRecipientType(e.target.value);
                    if (e.target.value !== 'Specific') {
                      setSelectedUsers([]);
                    }
                  }}
                >
                  {adminService.getRecipientTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Recipient Count */}
              <div className="recipient-count">
                <i className="fas fa-info-circle"></i>
                <span>
                  This email will be sent to approximately{' '}
                  <strong>{getRecipientCount()}</strong> recipient(s)
                </span>
              </div>

              {/* Specific User Selection */}
              {recipientType === 'Specific' && (
                <div className="specific-users-section">
                  <button
                    className="btn-select-users"
                    onClick={() => setShowUserSelector(true)}
                  >
                    <i className="fas fa-user-plus"></i>
                    Select Users ({selectedUsers.length} selected)
                  </button>

                  {selectedUsers.length > 0 && (
                    <div className="selected-users-list">
                      {selectedUsers.map(user => (
                        <div key={user.id} className="selected-user-chip">
                          <span>{user.name} ({user.type})</span>
                          <button
                            onClick={() => handleUserSelection(user, user.type)}
                            className="remove-chip"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Content */}
        <div className="section-card">
          <h2>
            <i className="fas fa-edit"></i>
            Email Content
          </h2>

          {/* Template Toggle */}
          <div className="template-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
              />
              <span>Use Email Template</span>
            </label>

            {useTemplate && (
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="template-selector"
              >
                <option value="announcement">Announcement</option>
                <option value="reminder">Reminder</option>
                <option value="alert">Alert</option>
                <option value="welcome">Welcome</option>
                <option value="update">Update</option>
              </select>
            )}
          </div>

          {/* Subject */}
          <div className="form-group">
            <label>Subject *</label>
            <input
              type="text"
              placeholder="Email subject (3-200 characters)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
            <span className="char-count">{subject.length}/200</span>
          </div>

          {/* HTML Formatting Toolbar */}
          <div className="html-toolbar">
            <button onClick={() => insertTemplate('bold')} title="Bold">
              <i className="fas fa-bold"></i>
            </button>
            <button onClick={() => insertTemplate('italic')} title="Italic">
              <i className="fas fa-italic"></i>
            </button>
            <button onClick={() => insertTemplate('link')} title="Insert Link">
              <i className="fas fa-link"></i>
            </button>
            <button onClick={() => insertTemplate('button')} title="Insert Button">
              <i className="fas fa-square"></i>
            </button>
            <button onClick={() => insertTemplate('list')} title="Insert List">
              <i className="fas fa-list"></i>
            </button>
            <button onClick={() => insertTemplate('infobox')} title="Insert Info Box">
              <i className="fas fa-info-circle"></i>
            </button>
          </div>

          {/* Message */}
          <div className="form-group">
            <label>Message (HTML) *</label>
            <textarea
              placeholder="Email message content (supports HTML)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
            ></textarea>
            <span className="helper-text">
              <i className="fas fa-lightbulb"></i>
              Supports HTML formatting. Use the toolbar above for common elements.
            </span>
          </div>

          {/* Attachments Section (Available for both modes) */}
          <div className="form-group attachments-section">
            <label>Attachments (Optional)</label>
            <div className="attachment-info">
              <i className="fas fa-info-circle"></i>
              <span>Max 5 files • JPG, JPEG, MP4, PDF only • 50MB per file • 100MB total{emailMode === 'bulk' ? ' • Same files sent to all recipients' : ''}</span>
            </div>
              
              <input
                type="file"
                accept=".jpg,.jpeg,.mp4,.pdf"
                multiple
                onChange={handleFileSelect}
                disabled={attachments.length >= 5}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-upload-label">
                <i className="fas fa-paperclip"></i>
                {attachments.length >= 5 ? 'Maximum files reached' : 'Choose Files'}
              </label>

              {/* Attachment Errors */}
              {attachmentErrors.length > 0 && (
                <div className="attachment-errors">
                  {attachmentErrors.map((error, index) => (
                    <div key={index} className="error-item">
                      <i className="fas fa-exclamation-circle"></i>
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="attached-files-list">
                  <div className="list-header">
                    <span>📎 {attachments.length} file(s) attached</span>
                    <span className="total-size">
                      Total: {formatFileSize(attachments.reduce((sum, f) => sum + f.size, 0))}
                    </span>
                  </div>
                  {attachments.map((file, index) => (
                    <div key={index} className="attached-file-item">
                      <span className="file-icon">{getFileIcon(file.name)}</span>
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => handleRemoveFile(index)}
                        title="Remove file"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Preview Button */}
          <button
            className="btn-preview"
            onClick={() => setShowPreview(true)}
            disabled={!message}
          >
            <i className="fas fa-eye"></i>
            Preview Email
          </button>
        </div>

        {/* Send Button */}
        <div className="send-section">
          <button
            className="btn-send"
            onClick={handleSendEmail}
            disabled={sending || !subject || !message || (emailMode === 'individual' && (!individualRecipient.email || !individualRecipient.name)) || attachmentErrors.length > 0}
          >
            {sending ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Sending...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                Send Email to {getRecipientCount()} Recipient(s)
              </>
            )}
          </button>

          {emailMode === 'bulk' && (
            <div className="send-warning">
              <i className="fas fa-exclamation-triangle"></i>
              <p>
                <strong>Important:</strong> Bulk emails are sent in batches with delays.
                Large recipient lists may take several minutes to complete.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Selector Modal */}
      {showUserSelector && (
        <div className="modal-overlay" onClick={() => setShowUserSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Users</h2>
              <button className="close-btn" onClick={() => setShowUserSelector(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="user-search">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>

              <div className="user-list">
                {getFilteredUsers().map(user => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  return (
                    <div
                      key={user.id}
                      className={`user-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleUserSelection(user, user.userType)}
                    >
                      <div className="user-avatar">
                        <span>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="user-info">
                        <strong>{user.firstName} {user.lastName}</strong>
                        <span className="user-email">{user.email}</span>
                        <span className={`user-type ${user.userType.toLowerCase()}`}>
                          {user.userType}
                        </span>
                      </div>
                      {isSelected && (
                        <i className="fas fa-check-circle"></i>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUserSelector(false)}>
                Done ({selectedUsers.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Email Preview</h2>
              <button className="close-btn" onClick={() => setShowPreview(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="email-preview">
                <div className="preview-subject">
                  <strong>Subject:</strong> {subject}
                </div>
                <div className="preview-content" dangerouslySetInnerHTML={{ __html: message }} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailComposer;
