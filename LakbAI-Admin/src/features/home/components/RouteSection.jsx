import React from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import styles from '../styles/RouteSection.module.css';

const RouteSection = () => {
  const routeStops = [
    { name: 'Robinson Tejero', variant: 'primary', isStart: true },
    { name: 'Malabon', variant: 'outline-secondary' },
    { name: 'Riverside', variant: 'outline-secondary' },
    { name: 'Lancaster New City', variant: 'outline-secondary' },
    { name: 'Pasong Camachile I', variant: 'outline-secondary' },
    { name: 'Open Canal', variant: 'outline-secondary' },
    { name: 'Santiago', variant: 'outline-secondary' },
    { name: 'Bella Vista', variant: 'outline-secondary' },
    { name: 'San Francisco', variant: 'outline-secondary' },
    { name: 'Country Meadow', variant: 'outline-secondary' },
    { name: 'Pabahay', variant: 'outline-secondary' },
    { name: 'Monterey', variant: 'outline-secondary' },
    { name: 'Langkaan', variant: 'outline-secondary' },
    { name: 'Tierra Vista', variant: 'outline-secondary' },
    { name: 'Robinson Pala-pala', variant: 'warning', isEnd: true }
  ];

  return (
    <section className={styles.jeepneyRoute}>
      <Container>
        <Row>
          <Col lg={12} className="text-center mb-5">
            <h2 className={styles.sectionTitle}>Jeepney Route</h2>
            <p className={styles.sectionSubtitle}>
              Map of all checkpoints along Tejero → Pala-pala
            </p>
          </Col>
        </Row>
        <Row>
          <Col lg={12}>
            <div className={styles.routeContainer}>
              <div className={`${styles.routeHeader} d-flex align-items-center mb-4`}>
                <div className={styles.routeMarker}>
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <h4 className="mb-0 ms-3">Tejero → Pala-pala Route</h4>
              </div>
              
              <div className={styles.routeStops}>
                <Row>
                  {routeStops.map((stop, index) => (
                    <Col lg={2} md={4} sm={6} className="mb-3" key={index}>
                      <div className={styles.stopItem}>
                        <Button 
                          variant={stop.variant} 
                          size="sm" 
                          className={`w-100 ${styles.stopBtn}`}
                        >
                          {stop.name}
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default RouteSection;
