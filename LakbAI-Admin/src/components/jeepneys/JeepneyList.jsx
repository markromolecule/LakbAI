import React from "react";
import { Table, Button, Spinner } from "react-bootstrap";
import JeepneyService from "../../services/jeepneyService";

const JeepneyList = ({ jeepneys, onDataUpdate }) => {
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this jeepney?")) return;

    const result = await JeepneyService.deleteJeepney(id);
    if (result.status === "success") {
      onDataUpdate();
    } else {
      alert(result.message || "Failed to delete jeepney");
    }
  };

  if (!jeepneys) {
    return <Spinner animation="border" />;
  }

  return (
    <Table striped bordered hover responsive className="shadow-sm">
      <thead>
        <tr>
          <th>#</th>
          <th>Jeepney Number</th>
          <th>Route</th>
          <th>Plate Number</th>
          <th>Driver</th>
          <th>Status</th>
          <th>Capacity</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jeepneys.length > 0 ? (
          jeepneys.map((jeepney, index) => (
            <tr key={jeepney.id}>
              <td>{index + 1}</td>
              <td>
                <strong className="text-primary">{jeepney.jeepney_number}</strong>
              </td>
              <td>{jeepney.route}</td>
              <td>{jeepney.plate_number}</td>
              <td>
                {jeepney.driver ? (
                  <span className="text-primary">{jeepney.driver}</span>
                ) : (
                  <span className="badge bg-warning">No Driver Assigned</span>
                )}
              </td>
              <td>
                <span
                  className={`badge ${
                    jeepney.status === "active" ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {jeepney.status}
                </span>
              </td>
              <td>{jeepney.capacity}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2"
                  onClick={() => alert("Edit feature coming soon")}
                >
                  <i className="bi bi-pencil"></i>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(jeepney.id)}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="8" className="text-center text-muted">
              No jeepneys available
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

export default JeepneyList;
