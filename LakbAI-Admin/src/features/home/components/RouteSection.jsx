import React from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import styles from '../styles/RouteSection.module.css';

const RouteSection = () => {
  // Static checkpoints list based on mobile constants
  const checkpoints = [
    'SM Epza',
    'Robinson Tejero',
    'Malabon',
    'Riverside',
    'Lancaster New City',
    'Pasong Camachile I',
    'Open Canal',
    'Santiago',
    'Bella Vista',
    'San Francisco',
    'Country Meadow',
    'Pabahay',
    'Monterey',
    'Langkaan',
    'Tierra Vista',
    'Robinson Dasmariñas',
    'SM Dasmariñas',
  ];

  const startName = checkpoints[0];
  const endName = checkpoints[checkpoints.length - 1];

  const routeStops = checkpoints.map((name, idx) => ({
    name,
    isStart: idx === 0,
    isEnd: idx === checkpoints.length - 1,
    variant: idx === 0 ? 'primary' : idx === checkpoints.length - 1 ? 'warning' : 'outline-secondary',
  }));

  return (
    <section className={styles.jeepneyRoute}>
      <Container>
        <Row>
          <Col lg={12} className="text-center mb-5">
            <h2 className={styles.sectionTitle}>Jeepney Route</h2>
            <p className={styles.sectionSubtitle}>
              Map of all checkpoints along {startName} → {endName}
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
                <h4 className="mb-0 ms-3">{startName} → {endName} Route</h4>
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
