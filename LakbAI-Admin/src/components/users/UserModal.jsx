import React, { useState, useEffect } from 'react';
import { Modal, Form, ProgressBar, Alert, Badge } from 'react-bootstrap';
import { BasicInformationForm, AddressForm, DiscountForm } from './components/forms';
import DriverLicenseForm from './components/forms/DriverLicenseForm';
import UserModalHeader from './components/modals/user/UserModalHeader';
import UserModalFooter from './components/modals/user/UserModalFooter';
import UserModalAdditionalInfo from './components/modals/user/UserModalAdditionalInfo';
import { validateUserForm, isValidForm, cleanFormDataForSubmission } from './utils/validation';
import './components/UserModal.css';

const UserModal = ({ show, onHide, user, mode, onSave }) => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
    phone_number: '', birthday: '', gender: 'Male', house_number: '',
    street_name: '', barangay: '', city_municipality: '', province: '',
    postal_code: '', user_type: 'passenger', discount_type: '',
    discount_applied: false, discount_file_path: '', discount_status: 'pending',
    discount_verified: false, is_verified: false, drivers_license_verified: 0,
    drivers_license_name: '', drivers_license_path: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);

  const isReadOnly = mode === 'view';
  const isPassenger = formData.user_type === 'passenger';

  useEffect(() => {
    if (show) {
      setErrors({});
      setCurrentStep(1);
      setFormProgress(0);
      
      if (user && (mode === 'view' || mode === 'edit')) {
        setFormData({
          username: user.username || '', email: user.email || '', password: '',
          first_name: user.first_name || '', last_name: user.last_name || '',
          phone_number: user.phone_number || '', birthday: user.birthday || '',
          gender: user.gender || 'Male', house_number: user.house_number || '',
          street_name: user.street_name || '', barangay: user.barangay || '',
          city_municipality: user.city_municipality || '', province: user.province || '',
          postal_code: user.postal_code || '', user_type: user.user_type || 'passenger',
          discount_type: user.discount_type || '', discount_applied: user.discount_applied || false,
          discount_file_path: user.discount_file_path || '', discount_status: user.discount_status || 'pending',
          discount_verified: user.discount_verified || false, is_verified: user.is_verified || false, 
          drivers_license_verified: user.drivers_license_verified || 0,
          drivers_license_name: user.drivers_license_name || '',
          drivers_license_path: user.drivers_license_path || ''
        });
      } else if (mode === 'create') {
        setFormData({
          username: '', email: '', password: '', first_name: '', last_name: '',
          phone_number: '', birthday: '', gender: 'Male', house_number: '',
          street_name: '', barangay: '', city_municipality: '', province: '',
          postal_code: '', user_type: 'passenger', discount_type: '',
          discount_applied: false, discount_file_path: '', discount_status: 'pending',
          discount_verified: false, is_verified: false, drivers_license_verified: 0,
          drivers_license_name: '', drivers_license_path: ''
        });
      }
    }
  }, [show, user, mode]);

  // Calculate form progress when formData changes
  useEffect(() => {
    if (show && mode === 'create') {
      calculateFormProgress();
    }
  }, [formData, show, mode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Calculate form progress
    calculateFormProgress();
  };

  const calculateFormProgress = () => {
    const requiredFields = [
      'username', 'email', 'first_name', 'last_name', 'phone_number', 
      'birthday', 'house_number', 'street_name', 'barangay', 
      'city_municipality', 'province', 'postal_code'
    ];
    
    if (mode === 'create') {
      requiredFields.push('password');
    }
    
    const filledFields = requiredFields.filter(field => 
      formData[field] && formData[field].toString().trim() !== ''
    ).length;
    
    const progress = Math.round((filledFields / requiredFields.length) * 100);
    setFormProgress(progress);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateUserForm(formData, mode);
    if (!isValidForm(newErrors)) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Clean the form data before submission to remove irrelevant fields
      const submitData = cleanFormDataForSubmission(formData, formData.user_type);
      await onSave(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Create New User';
      case 'edit': return 'Edit User';
      case 'view': return 'User Details';
      default: return 'User';
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="user-modal">
      <Modal.Header closeButton className="border-0 bg-gradient-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <div className="bg-white bg-opacity-20 rounded-circle p-1 me-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
            <img 
              src="/image/logofinal.png" 
              alt="LakbAI Logo" 
              className="img-fluid" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <h4 className="mb-0">{getModalTitle()}</h4>
            <small className="opacity-75">
              {mode === 'create' ? 'Add a new user to the system' : 
               mode === 'edit' ? 'Update user information' : 
               'View user details and information'}
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-0">
          {/* Progress Bar for Create Mode */}
          {mode === 'create' && (
            <div className="bg-light border-bottom p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold">Form Completion</span>
                <Badge bg={formProgress === 100 ? 'success' : 'primary'} className="px-2 py-1">
                  {formProgress}%
                </Badge>
              </div>
              <ProgressBar 
                now={formProgress} 
                variant={formProgress === 100 ? 'success' : 'primary'}
                className="mb-0"
                style={{ height: '6px' }}
              />
            </div>
          )}

          {/* User Type Badge */}
          <div className="p-3 bg-light border-bottom">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <i className={`bi ${isPassenger ? 'bi-person-walking' : 'bi-car-front'} text-primary me-2`}></i>
                <span className="fw-semibold">User Type:</span>
                <Badge 
                  bg={isPassenger ? 'info' : 'warning'} 
                  className="ms-2 px-3 py-1"
                >
                  {formData.user_type?.charAt(0).toUpperCase() + formData.user_type?.slice(1)}
                </Badge>
              </div>
              {mode === 'create' && (
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  {isPassenger ? 'Passenger users can apply for discounts' : 'Driver users need license verification'}
                </small>
              )}
            </div>
          </div>

          <div className="p-4">
            <UserModalHeader user={user} mode={mode} />

            {/* Basic Information Section */}
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-10 section-icon me-3">
                  <i className="bi bi-person-circle text-primary"></i>
                </div>
                <div>
                  <h5 className="mb-0 text-primary">Basic Information</h5>
                  <small className="text-muted">Personal details and account information</small>
                </div>
              </div>
              <BasicInformationForm
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
                isReadOnly={isReadOnly}
                mode={mode}
              />
            </div>

            {/* Address Information Section */}
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-10 section-icon me-3">
                  <i className="bi bi-geo-alt text-success"></i>
                </div>
                <div>
                  <h5 className="mb-0 text-success">Address Information</h5>
                  <small className="text-muted">Complete address details for delivery and verification</small>
                </div>
              </div>
              <AddressForm
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
                isReadOnly={isReadOnly}
              />
            </div>

            {/* Discount Section - Only for Passengers */}
            {isPassenger && (
              <div className="mb-4">
                <DiscountForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  isReadOnly={isReadOnly}
                  errors={errors}
                />
              </div>
            )}

            {/* Driver License Section - Only for Drivers */}
            {!isPassenger && (
              <DriverLicenseForm
                formData={formData}
                handleInputChange={handleInputChange}
                isReadOnly={isReadOnly}
              />
            )}

            {/* Additional Information */}
            <UserModalAdditionalInfo user={user} mode={mode} />

            {/* Form Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="danger" className="mt-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <div>
                    <strong>Please fix the following errors:</strong>
                    <ul className="mb-0 mt-2">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Alert>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 bg-light">
          <UserModalFooter
            mode={mode}
            loading={loading}
            onHide={onHide}
            onSubmit={handleSubmit}
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UserModal;

