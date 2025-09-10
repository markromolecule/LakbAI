import React from 'react';
import { Button, Spinner } from 'react-bootstrap';

const UserModalFooter = ({ mode, loading, onHide, onSubmit }) => {
  return (
    <div className="d-flex justify-content-between align-items-center w-100">
      <Button 
        variant="outline-secondary" 
        onClick={onHide}
        className="px-4 py-2"
        disabled={loading}
      >
        <i className={`bi ${mode === 'view' ? 'bi-x-lg' : 'bi-arrow-left'} me-2`}></i>
        {mode === 'view' ? 'Close' : 'Cancel'}
      </Button>
      
      {mode !== 'view' && (
        <Button 
          type="submit" 
          variant={mode === 'create' ? 'success' : 'primary'}
          disabled={loading}
          onClick={onSubmit}
          className="px-4 py-2"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {mode === 'create' ? 'Creating User...' : 'Saving Changes...'}
            </>
          ) : (
            <>
              <i className={`bi ${mode === 'create' ? 'bi-person-plus' : 'bi-check-circle'} me-2`}></i>
              {mode === 'create' ? 'Create User' : 'Save Changes'}
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default UserModalFooter;
