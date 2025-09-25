// src/pages/admin/Jeepneys.jsx

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Tab, Tabs, Alert, Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import JeepneyService from "../../services/jeepneyService";
import JeepneyList from "../../components/jeepneys/JeepneyList";
import JeepneyForm from "../../components/jeepneys/JeepneyForm";

const Jeepneys = () => {
  const location = useLocation();
  const [jeepneys, setJeepneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("list");

  // Stats for jeepneys
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    loadJeepneys();
    
    // Check if we should show the add form (from dashboard quick action)
    if (location.state?.showAddModal) {
      setActiveTab("add");
    }
  }, [location.state]);

  const loadJeepneys = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await JeepneyService.getJeepneys();

      if (result.success) {
        const data = result.jeepneys || [];

        // Transform data to include driver and route information
        const transformedData = data.map(jeepney => ({
          ...jeepney,
          driver: jeepney.first_name && jeepney.last_name 
            ? `${jeepney.first_name} ${jeepney.last_name}`
            : null,
          route: jeepney.route_name || "No Route Assigned"
        }));

        setJeepneys(transformedData);
        setStats({
          total: transformedData.length,
          active: transformedData.filter((j) => j.status === "active").length,
          inactive: transformedData.filter((j) => j.status === "inactive").length,
        });
      } else {
        setError(result.error || result.message || "Failed to load jeepneys");
      }
    } catch (err) {
      console.error("Error loading jeepneys:", err);
      setError("Failed to load jeepneys");
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = () => {
    loadJeepneys();
  };

  return (
    <AdminLayout
      title="Jeepney Management"
      subtitle="Manage jeepney records, routes, and availability"
    >
      <div className="header-content">
        {error && (
          <Alert variant="danger" className="mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Jeepney Stats */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-0 text-center">
              <Card.Body>
                <h5>Total Jeepneys</h5>
                <h3 className="fw-bold">{stats.total}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 text-center">
              <Card.Body>
                <h5>Active Jeepneys</h5>
                <h3 className="fw-bold text-success">{stats.active}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 text-center">
              <Card.Body>
                <h5>Inactive Jeepneys</h5>
                <h3 className="fw-bold text-danger">{stats.inactive}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabs for Jeepneys */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(key) => {
                setActiveTab(key);
                if (key !== "add") {
                  handleDataUpdate();
                }
              }}
              className="nav-tabs-custom px-3 pt-3"
            >
              {/* All Jeepneys */}
              <Tab
                eventKey="all"
                title={
                  <span>
                    <i className="bi bi-truck-front me-2"></i>
                    All Jeepneys
                    <span className="badge bg-primary ms-2">{stats.total}</span>
                  </span>
                }
              >
                <div className="p-3">
                  <JeepneyList jeepneys={jeepneys} onDataUpdate={handleDataUpdate} />
                </div>
              </Tab>

              {/* Active Jeepneys */}
              <Tab
                eventKey="active"
                title={
                  <span>
                    <i className="bi bi-check-circle me-2"></i>
                    Active
                    <span className="badge bg-success ms-2">{stats.active}</span>
                  </span>
                }
              >
                <div className="p-3">
                  <JeepneyList
                    jeepneys={jeepneys.filter((j) => j.status === "active")}
                    onDataUpdate={handleDataUpdate}
                  />
                </div>
              </Tab>

              {/* Inactive Jeepneys */}
              <Tab
                eventKey="inactive"
                title={
                  <span>
                    <i className="bi bi-x-circle me-2"></i>
                    Inactive
                    <span className="badge bg-danger ms-2">{stats.inactive}</span>
                  </span>
                }
              >
                <div className="p-3">
                  <JeepneyList
                    jeepneys={jeepneys.filter((j) => j.status === "inactive")}
                    onDataUpdate={handleDataUpdate}
                  />
                </div>
              </Tab>

              {/* Add Jeepney */}
              <Tab
                eventKey="add"
                title={
                  <span>
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Jeepney
                  </span>
                }
              >
                <div className="p-3">
                  <JeepneyForm onDataUpdate={handleDataUpdate} />
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </div>

      <style>{`
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .nav-tabs-custom {
          border-bottom: 1px solid #dee2e6;
        }

        .nav-tabs-custom .nav-link {
          border: none;
          border-bottom: 3px solid transparent;
          color: #6c757d;
          font-weight: 500;
          padding: 1rem 1.5rem;
        }

        .nav-tabs-custom .nav-link:hover {
          border-color: transparent;
          color: #495057;
          background-color: #f8f9fa;
        }

        .nav-tabs-custom .nav-link.active {
          color: #0d6efd;
          background-color: transparent;
          border-color: transparent transparent #0d6efd;
        }

        .badge {
          font-size: 0.75em;
        }
      `}</style>
    </AdminLayout>
  );
};

export default Jeepneys;
