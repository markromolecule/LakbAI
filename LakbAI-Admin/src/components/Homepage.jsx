import React from 'react';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import Header from './common/Header';
import Footer from './common/Footer';
import './styles/HeroSection.css';
import './styles/HowItWorks.css';
import './styles/RouteSection.css';

const Homepage = () => {
  return (
    <div className="homepage">
      {/* Header Component */}
      <Header />

      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={12} className="text-center">
              <div className="hero-content">
                <h1 className="hero-title text-white mb-3">
                  LakbAI - A Smarter Way to Ride
                </h1>
                <p className="hero-subtitle text-white-50 mb-4">
                  Student-led Digital Jeepney System for Dasmariñas
                </p>
                <div className="hero-buttons">
                  <Button variant="outline-warning" size="lg" className="hero-btn">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Log In
                  </Button>
                  <Button variant="outline-light" size="lg" className="hero-btn">
                    <i className="bi bi-person-plus me-2"></i>
                    Register
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Hero Image Section */}
      <section className="hero-image-section">
        <Container fluid className="p-0">
          <div className="hero-image-container">
            <img
              src="/image/modern-jeep.JPG"
              alt="Modern Jeepney Fleet"
              className="hero-image"
            />
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <Container>
          <Row>
            <Col lg={12} className="text-center mb-5">
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle">
                Simple, Fast, and Reliable - Just Four Steps to a Better Jeepney Experience
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={3} md={6} className="mb-4">
              <Card className="step-card text-center h-100">
                <Card.Body>
                  <div className="step-icon-container qr-icon">
                    <i className="bi bi-qr-code-scan step-icon"></i>
                    <div className="step-number">1</div>
                  </div>
                  <h5 className="step-title">Scan the QR</h5>
                  <p className="step-description">
                    Find the QR code inside the jeepney and scan it with your phone to get started.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <Card className="step-card text-center h-100">
                <Card.Body>
                  <div className="step-icon-container fare-icon">
                    <i className="bi bi-currency-exchange step-icon"></i>
                    <div className="step-number">2</div>
                  </div>
                  <h5 className="step-title">View Fare</h5>
                  <p className="step-description">
                    Select your destination and calculate the exact fare instantly with our smart system.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <Card className="step-card text-center h-100">
                <Card.Body>
                  <div className="step-icon-container time-icon">
                    <i className="bi bi-clock-history step-icon"></i>
                    <div className="step-number">3</div>
                  </div>
                  <h5 className="step-title">Check Arrivals</h5>
                  <p className="step-description">
                    Get real-time arrival updates and travel information to stay on schedule.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <Card className="step-card text-center h-100">
                <Card.Body>
                  <div className="step-icon-container chat-icon">
                    <i className="bi bi-chat-dots-fill step-icon"></i>
                    <div className="step-number">4</div>
                  </div>
                  <h5 className="step-title">Ask BiyaBot</h5>
                  <p className="step-description">
                    Get instant answers and helpful travel info from BiyaBot - your smart commute assistant.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Jeepney Route Section */}
      <section className="jeepney-route">
        <Container>
          <Row>
            <Col lg={12} className="text-center mb-5">
              <h2 className="section-title">Jeepney Route</h2>
              <p className="section-subtitle">
                Map of all checkpoints along Tejero → Pala-pala
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={12}>
              <div className="route-container">
                <div className="route-header d-flex align-items-center mb-4">
                  <div className="route-marker me-3">
                    <i className="bi bi-geo-alt-fill"></i>
                  </div>
                  <h4 className="mb-0">Tejero → Pala-pala Route</h4>
                </div>
                
                <div className="route-stops">
                  <Row>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="primary" size="sm" className="w-100 stop-btn">
                          Robinson Tejero
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Malabon
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Riverside
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Lancaster New City
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Pascan 1
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Open Canal
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Santiago
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Bella Vista
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          San Francisco
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Country Meadow
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Pabahay
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Monterey
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Langkaan
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="outline-secondary" size="sm" className="w-100 stop-btn">
                          Tierra Vista
                        </Button>
                      </div>
                    </Col>
                    <Col lg={2} md={4} sm={6} className="mb-3">
                      <div className="stop-item">
                        <Button variant="warning" size="sm" className="w-100 stop-btn">
                          Robinson Pala-pala
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default Homepage;
