import React, { useState, useRef } from 'react';
import { Form, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { API_CONFIG } from '../../../../config/apiConfig';

const DriverLicenseForm = ({ formData, handleInputChange, isReadOnly }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Only show for drivers
  if (formData.user_type !== 'driver') {
    return null;
  }

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid file (PDF, JPG, PNG)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('drivers_license', file);

      const response = await fetch('/api/upload-driver-license', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Update form data with the uploaded file info
        handleInputChange({
          target: {
            name: 'drivers_license_name',
            value: file.name,
            type: 'text'
          }
        });
        
        handleInputChange({
          target: {
            name: 'drivers_license_path',
            value: result.data.file_path,
            type: 'text'
          }
        });

        setUploadSuccess('License document uploaded successfully!');
        setUploadError('');
      } else {
        setUploadError(result.message || 'Failed to upload license document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload license document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Get file icon based on file extension
  const getFileIcon = (filename) => {
    if (!filename) return 'bi-file-earmark';
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'bi-file-earmark-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'bi-file-earmark-image';
      default:
        return 'bi-file-earmark';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-warning text-dark d-flex align-items-center">
          <i className="bi bi-card-text me-2"></i>
          <h6 className="mb-0">Driver License</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Row className="g-0">
            <Col md={6} className="p-4">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-muted d-flex align-items-center">
                  <i className="bi bi-check-circle me-1"></i>
                  License Verification Status
                </Form.Label>
                <div className="d-flex flex-column" style={{ minHeight: '38px' }}>
                  <div className="checkbox-container mb-2">
                    <Form.Check
                      type="checkbox"
                      name="drivers_license_verified"
                      checked={formData.drivers_license_verified === 1}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                    />
                    <div className="checkbox-content">
                      <Form.Label>License Verified</Form.Label>
                    </div>
                  </div>
                  <div className="checkbox-container">
                    <Form.Check
                      type="checkbox"
                      name="is_verified"
                      checked={formData.is_verified === 1}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                    />
                    <div className="checkbox-content">
                      <Form.Label>Account Verified</Form.Label>
                    </div>
                  </div>
                </div>
              </Form.Group>
            </Col>
            <Col md={6} className="p-4 border-start">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-muted d-flex align-items-center">
                  <i className="bi bi-file-earmark me-1"></i>
                  License Document
                  <span className="text-danger ms-1">*</span>
                </Form.Label>
                
                {!formData.drivers_license_path ? (
                  <div className="border border-2 border-dashed rounded p-3 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={isReadOnly || uploading}
                      className="d-none"
                      id="driver-license-upload"
                    />
                    <label
                      htmlFor="driver-license-upload"
                      className="btn btn-outline-primary btn-sm mb-2"
                      style={{ cursor: isReadOnly || uploading ? 'not-allowed' : 'pointer' }}
                    >
                      {uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-cloud-upload me-1"></i>
                          Choose File
                        </>
                      )}
                    </label>
                    <div className="text-muted small">
                      <div>Supported formats: PDF, JPG, PNG</div>
                      <div>Maximum file size: 5MB</div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded p-3 bg-light">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <i className={`bi ${getFileIcon(formData.drivers_license_name)} text-primary me-2 fs-5`}></i>
                        <div>
                          <div className="fw-semibold">{formData.drivers_license_name}</div>
                          <div className="text-muted small">
                            {formatFileSize(formData.drivers_license_path ? 0 : 0)} • License Document
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <a 
                          href={`${API_CONFIG.BASE_URL.replace('/routes/api.php', '')}/api/document/${formData.drivers_license_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="bi bi-eye me-1"></i>
                          View
                        </a>
                        {!isReadOnly && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              handleInputChange({
                                target: {
                                  name: 'drivers_license_name',
                                  value: '',
                                  type: 'text'
                                }
                              });
                              handleInputChange({
                                target: {
                                  name: 'drivers_license_path',
                                  value: '',
                                  type: 'text'
                                }
                              });
                              setUploadError('');
                              setUploadSuccess('');
                            }}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Success Alert */}
                {uploadSuccess && (
                  <Alert variant="success" className="mt-2 py-2">
                    <i className="bi bi-check-circle me-1"></i>
                    {uploadSuccess}
                  </Alert>
                )}

                {/* Upload Error Alert */}
                {uploadError && (
                  <Alert variant="danger" className="mt-2 py-2">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    {uploadError}
                  </Alert>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default DriverLicenseForm;
