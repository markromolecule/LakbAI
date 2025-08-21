import React from 'react';
import { Button, Spinner } from 'react-bootstrap';

const UserModalFooter = ({ mode, loading, onHide, onSubmit }) => {
  return (
    <>
      <Button variant="secondary" onClick={onHide}>
        {mode === 'view' ? 'Close' : 'Cancel'}
      </Button>
      
      {mode !== 'view' && (
        <Button 
          type="submit" 
          variant="primary"
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            <>
              <i className="bi bi-check me-2"></i>
              {mode === 'create' ? 'Create User' : 'Save Changes'}
            </>
          )}
        </Button>
      )}
    </>
  );
};

export default UserModalFooter;
