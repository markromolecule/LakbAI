import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import CheckpointService from '../../services/checkpointService';

const RouteDetails = ({ route, onClose }) => {
    const [checkpoints, setCheckpoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCheckpoint, setNewCheckpoint] = useState({
        checkpoint_name: '',
        sequence_order: '',
        fare_from_origin: '',
        is_origin: 0,
        is_destination: 0
    });

    useEffect(() => {
        if (route) {
            loadCheckpoints();
        }
    }, [route]);

    const loadCheckpoints = async () => {
        setLoading(true);
        setError('');
        
        try {
            const result = await CheckpointService.getCheckpointsByRoute(route.id);
            if (result.success) {
                setCheckpoints(result.checkpoints);
            } else {
                setError(result.error || 'Failed to load checkpoints');
            }
        } catch (err) {
            setError('Failed to load checkpoints');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCheckpoint = async (e) => {
        e.preventDefault();
        
        const checkpointData = {
            ...newCheckpoint,
            route_id: route.id,
            sequence_order: parseInt(newCheckpoint.sequence_order),
            fare_from_origin: parseFloat(newCheckpoint.fare_from_origin),
            is_origin: newCheckpoint.is_origin ? 1 : 0,
            is_destination: newCheckpoint.is_destination ? 1 : 0
        };

        const result = await CheckpointService.createCheckpoint(checkpointData);
        if (result.success) {
            setShowAddModal(false);
            setNewCheckpoint({
                checkpoint_name: '',
                sequence_order: '',
                fare_from_origin: '',
                is_origin: 0,
                is_destination: 0
            });
            loadCheckpoints(); // Reload checkpoints
        } else {
            setError(result.error || 'Failed to add checkpoint');
        }
    };

    const handleDeleteCheckpoint = async (checkpointId) => {
        if (window.confirm('Are you sure you want to delete this checkpoint?')) {
            const result = await CheckpointService.deleteCheckpoint(checkpointId);
            if (result.success) {
                loadCheckpoints(); // Reload checkpoints
            } else {
                setError(result.error || 'Failed to delete checkpoint');
            }
        }
    };

    if (!route) return null;

    return (
        <Modal show={true} onHide={onClose} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>
                    Route Details: {route.route_name}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <div className="mb-3">
                    <Button 
                        variant="primary" 
                        onClick={() => setShowAddModal(true)}
                        disabled={loading}
                    >
                        Add Checkpoint
                    </Button>
                </div>

                <Card>
                    <Card.Header>
                        <h5>Checkpoints ({checkpoints.length})</h5>
                    </Card.Header>
                    <Card.Body>
                        {loading ? (
                            <div className="text-center">Loading checkpoints...</div>
                        ) : (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Sequence</th>
                                        <th>Checkpoint Name</th>
                                        <th>Fare from Origin</th>
                                        <th>Type</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checkpoints.map((checkpoint) => (
                                        <tr key={checkpoint.id}>
                                            <td>{checkpoint.sequence_order}</td>
                                            <td>
                                                {checkpoint.checkpoint_name}
                                                {checkpoint.is_origin && (
                                                    <Badge bg="success" className="ms-2">Origin</Badge>
                                                )}
                                                {checkpoint.is_destination && (
                                                    <Badge bg="primary" className="ms-2">Destination</Badge>
                                                )}
                                            </td>
                                            <td>₱{parseFloat(checkpoint.fare_from_origin).toFixed(2)}</td>
                                            <td>
                                                {checkpoint.is_origin ? 'Origin' : 
                                                 checkpoint.is_destination ? 'Destination' : 'Stop'}
                                            </td>
                                            <td>
                                                <Button 
                                                    variant="danger" 
                                                    size="sm"
                                                    onClick={() => handleDeleteCheckpoint(checkpoint.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>

            {/* Add Checkpoint Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Checkpoint</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddCheckpoint}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Checkpoint Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newCheckpoint.checkpoint_name}
                                        onChange={(e) => setNewCheckpoint({
                                            ...newCheckpoint,
                                            checkpoint_name: e.target.value
                                        })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Sequence Order</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newCheckpoint.sequence_order}
                                        onChange={(e) => setNewCheckpoint({
                                            ...newCheckpoint,
                                            sequence_order: e.target.value
                                        })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fare from Origin (₱)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={newCheckpoint.fare_from_origin}
                                        onChange={(e) => setNewCheckpoint({
                                            ...newCheckpoint,
                                            fare_from_origin: e.target.value
                                        })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Checkpoint Type</Form.Label>
                                    <div>
                                        <Form.Check
                                            type="checkbox"
                                            label="Is Origin"
                                            checked={newCheckpoint.is_origin}
                                            onChange={(e) => setNewCheckpoint({
                                                ...newCheckpoint,
                                                is_origin: e.target.checked
                                            })}
                                        />
                                        <Form.Check
                                            type="checkbox"
                                            label="Is Destination"
                                            checked={newCheckpoint.is_destination}
                                            onChange={(e) => setNewCheckpoint({
                                                ...newCheckpoint,
                                                is_destination: e.target.checked
                                            })}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Add Checkpoint
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Modal>
    );
};

export default RouteDetails;
