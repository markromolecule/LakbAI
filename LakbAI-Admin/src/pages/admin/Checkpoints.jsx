import React, { useState } from "react";
import { Card, Button, Form, Row, Col } from "react-bootstrap";
import AdminLayout from "../../components/admin/layout/AdminLayout";

// Example checkpoint list (replace with constants if you already have one)
const CHECKPOINTS = [
  "Imus",
  "Robinson Tejero",
  "Malabon",
  "Riverside",
  "Lancaster New City",
  "Pasong Camachile I",
  "Pasong Camachile II",
  "Open Canal",
  "Santiago",
  "Bella Vista",
  "San Francisco",
  "Country Meadow",
  "Paliparan",
  "Langkaan",
  "Tierra Vista",
  "Robinson Dasmariñas",
  "SM Dasmariñas",
];

const Checkpoints = () => {
  const [selected, setSelected] = useState("");
  const [generated, setGenerated] = useState([]);

  // Generate QR image using free API
  const generateQR = (name) => {
    const qrData = { checkpoint: name, createdAt: new Date().toISOString() };
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      JSON.stringify(qrData)
    )}`;
  };

  const handleAdd = () => {
    if (!selected) return;
    const newQR = {
      id: Date.now(),
      name: selected,
      qrUrl: generateQR(selected),
      createdAt: new Date().toISOString(),
    };
    setGenerated((prev) => [newQR, ...prev]); // LIFO (newest first)
    setSelected("");
  };

  const handleDelete = (id) => {
    setGenerated(generated.filter((qr) => qr.id !== id));
  };

  const handleClear = () => {
    setGenerated([]);
  };

  return (
    <AdminLayout
      title="Checkpoints Management"
      subtitle="Manage route checkpoints and stops"
    >
      <Card className="border-0 shadow-sm p-4">
        <h5 className="mb-3">Generate Checkpoint QR Codes</h5>

        {/* Dropdown form */}
        <Form className="d-flex mb-4">
          <Form.Select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="me-2"
          >
            <option value="">-- Select a checkpoint --</option>
            {CHECKPOINTS.map((cp) => (
              <option key={cp} value={cp}>
                {cp}
              </option>
            ))}
          </Form.Select>
          <Button onClick={handleAdd} disabled={!selected}>
            Generate QR
          </Button>
          <Button
            variant="outline-danger"
            className="ms-2"
            onClick={handleClear}
            disabled={generated.length === 0}
          >
            Clear All
          </Button>
        </Form>

        {/* Generated QR cards (LIFO order: newest first) */}
        <Row>
          {generated.map((qr) => (
            <Col md={4} lg={3} key={qr.id} className="mb-4">
              <Card className="text-center shadow-sm p-3">
                <img
                  src={qr.qrUrl}
                  alt="QR Code"
                  className="mb-3"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                  }}
                />
                <h6 className="fw-bold">{qr.name}</h6>
                <div className="d-flex justify-content-center mt-2">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(qr.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </AdminLayout>
  );
};

export default Checkpoints;
