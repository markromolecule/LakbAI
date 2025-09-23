import React, { useState, useRef } from 'react';
import { Form, Row, Col, Alert, Button, Card } from 'react-bootstrap';

const DiscountForm = ({ formData, handleInputChange, isReadOnly, errors = {} }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Hide discount form for drivers
  if (formData.user_type === 'driver') {
    return null;
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a PDF, JPG, or PNG file.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('discount_document', file);

      const response = await fetch('/api/upload-discount-document', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.status === 'success') {
        setUploadSuccess('File uploaded successfully!');
        // Update form data with file information
        handleInputChange({
          target: {
            name: 'discount_file_path',
            value: result.data.file_path
          }
        });
        handleInputChange({
          target: {
            name: 'discount_document_name',
            value: result.data.original_name
          }
        });
      } else {
        setUploadError(result.message || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    handleInputChange({
      target: {
        name: 'discount_file_path',
        value: ''
      }
    });
    handleInputChange({
      target: {
        name: 'discount_document_name',
        value: ''
      }
    });
    setUploadError('');
    setUploadSuccess('');
  };

  const handleApplyDiscountChange = (e) => {
    const checked = e.target.checked;
    handleInputChange(e);
    
    // If unchecking, clear file upload
    if (!checked) {
      handleRemoveFile();
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return 'bi-file-earmark';
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') return 'bi-file-earmark-pdf';
    if (['jpg', 'jpeg', 'png'].includes(extension)) return 'bi-file-earmark-image';
    return 'bi-file-earmark';
  };

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
        <Card.Header className="bg-primary text-white d-flex align-items-center">
          <i className="bi bi-award me-2"></i>
          <h6 className="mb-0">Discount & Verification</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Row className="g-0">
            <Col md={6} className="p-4">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-muted d-flex align-items-center">
                  <i className="bi bi-tag me-1"></i>
                  Discount Type
                </Form.Label>
                <Form.Select
                  name="discount_type"
                  value={formData.discount_type || ''}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={errors.discount_type ? 'is-invalid' : ''}
                >
                  <option value="">No Discount</option>
                  <option value="PWD">PWD (Person with Disability)</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                  <option value="Student">Student</option>
                </Form.Select>
                {errors.discount_type && (
                  <div className="invalid-feedback">{errors.discount_type}</div>
                )}
              </Form.Group>
            </Col>
            <Col md={6} className="p-4 border-start">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-muted d-flex align-items-center">
                  <i className="bi bi-check-circle me-1"></i>
                  Verification Status
                </Form.Label>
                <div className="d-flex flex-column" style={{ minHeight: '38px' }}>
                  <div className="checkbox-container mb-2">
                    <Form.Check
                      type="checkbox"
                      name="discount_verified"
                      checked={formData.discount_verified === 1}
                      onChange={handleInputChange}
                      disabled={isReadOnly || !formData.discount_type}
                    />
                    <div className="checkbox-content">
                      <Form.Label className={`${!formData.discount_type ? 'text-muted' : ''}`}>
                        Discount Verified
                      </Form.Label>
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
          </Row>

          {/* Apply for Discount Section */}
          <div className="p-4 border-top">
            <Form.Group className="mb-3">
              <div className="checkbox-container">
                <Form.Check
                  type="checkbox"
                  name="discount_applied"
                  checked={formData.discount_applied === 1}
                  onChange={handleApplyDiscountChange}
                  disabled={isReadOnly || !formData.discount_type}
                  className="mt-1"
                />
                <div className="checkbox-content">
                  <Form.Label className="fw-semibold mb-1 d-block d-flex align-items-center">
                    <i className="bi bi-file-earmark-arrow-up me-1"></i>
                    Apply for Discount
                  </Form.Label>
                  <Form.Text className="text-muted d-block">
                    Check this box if you want to apply for a discount. You'll need to upload supporting documents.
                  </Form.Text>
                  {errors.discount_applied && (
                    <div className="text-danger small mt-1">{errors.discount_applied}</div>
                  )}
                </div>
              </div>
            </Form.Group>
          </div>

          {/* File Upload Section - Only show if discount is applied */}
          {formData.discount_applied && (
            <div className="px-4 pb-4">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <i className="bi bi-cloud-upload me-1"></i>
                  Supporting Document
                  <span className="text-danger"> *</span>
                </Form.Label>
                  
                  {!formData.discount_file_path ? (
                    <div className="border border-2 border-dashed rounded p-3 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        disabled={isReadOnly || uploading}
                        className="d-none"
                        id="discount-file-upload"
                      />
                      <label
                        htmlFor="discount-file-upload"
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
                          <i className={`bi ${getFileIcon(formData.discount_document_name)} text-primary me-2 fs-5`}></i>
                          <div>
                            <div className="fw-semibold">{formData.discount_document_name}</div>
                            <div className="text-muted small">
                              <i className="bi bi-check-circle text-success me-1"></i>
                              Uploaded successfully
                            </div>
                          </div>
                        </div>
                        {!isReadOnly && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={handleRemoveFile}
                            disabled={uploading}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <Alert variant="danger" className="mt-2 py-2">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      {uploadError}
                    </Alert>
                  )}

                  {uploadSuccess && (
                    <Alert variant="success" className="mt-2 py-2">
                      <i className="bi bi-check-circle me-1"></i>
                      {uploadSuccess}
                    </Alert>
                  )}

                  {errors.discount_file_path && (
                    <div className="text-danger small mt-1">{errors.discount_file_path}</div>
                  )}
                </Form.Group>
            </div>
          )}

          {/* Discount Status Display */}
          {formData.discount_status && (
            <div className="bg-info bg-opacity-10 p-3 border-top">
              <div className="d-flex align-items-center">
                <i className="bi bi-info-circle me-2 text-info"></i>
                <strong className="text-muted">Discount Status:</strong>
                <span className={`ms-2 badge ${
                  formData.discount_status === 'approved' ? 'bg-success' :
                  formData.discount_status === 'rejected' ? 'bg-danger' : 'bg-warning'
                }`}>
                  {formData.discount_status.charAt(0).toUpperCase() + formData.discount_status.slice(1)}
                </span>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default DiscountForm;
