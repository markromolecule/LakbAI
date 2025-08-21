import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { BasicInformationForm, AddressForm, DiscountForm } from './components/forms';
import DriverLicenseForm from './components/forms/DriverLicenseForm';
import UserModalHeader from './components/modals/user/UserModalHeader';
import UserModalFooter from './components/modals/user/UserModalFooter';
import UserModalAdditionalInfo from './components/modals/user/UserModalAdditionalInfo';
import { validateUserForm, isValidForm, cleanFormDataForSubmission } from './utils/validation';

const UserModal = ({ show, onHide, user, mode, onSave }) => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
    phone_number: '', birthday: '', gender: 'Male', house_number: '',
    street_name: '', barangay: '', city_municipality: '', province: '',
    postal_code: '', user_type: 'passenger', discount_type: '',
    discount_verified: false, is_verified: false, drivers_license_verified: 0
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isReadOnly = mode === 'view';

  useEffect(() => {
    if (show) {
      setErrors({});
      if (user && (mode === 'view' || mode === 'edit')) {
        setFormData({
          username: user.username || '', email: user.email || '', password: '',
          first_name: user.first_name || '', last_name: user.last_name || '',
          phone_number: user.phone_number || '', birthday: user.birthday || '',
          gender: user.gender || 'Male', house_number: user.house_number || '',
          street_name: user.street_name || '', barangay: user.barangay || '',
          city_municipality: user.city_municipality || '', province: user.province || '',
          postal_code: user.postal_code || '', user_type: user.user_type || 'passenger',
          discount_type: user.discount_type || '', discount_verified: user.discount_verified || false,
          is_verified: user.is_verified || false, drivers_license_verified: user.drivers_license_verified || 0
        });
      } else if (mode === 'create') {
        setFormData({
          username: '', email: '', password: '', first_name: '', last_name: '',
          phone_number: '', birthday: '', gender: 'Male', house_number: '',
          street_name: '', barangay: '', city_municipality: '', province: '',
          postal_code: '', user_type: 'passenger', discount_type: '',
          discount_verified: false, is_verified: false, drivers_license_verified: 0
        });
      }
    }
  }, [show, user, mode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-person me-2"></i>
          {getModalTitle()}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <UserModalHeader user={user} mode={mode} />

          <BasicInformationForm
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            isReadOnly={isReadOnly}
            mode={mode}
          />

          <AddressForm
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            isReadOnly={isReadOnly}
          />

          <DiscountForm
            formData={formData}
            handleInputChange={handleInputChange}
            isReadOnly={isReadOnly}
          />

          <DriverLicenseForm
            formData={formData}
            handleInputChange={handleInputChange}
            isReadOnly={isReadOnly}
          />

          <UserModalAdditionalInfo user={user} mode={mode} />
        </Modal.Body>

        <Modal.Footer>
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

