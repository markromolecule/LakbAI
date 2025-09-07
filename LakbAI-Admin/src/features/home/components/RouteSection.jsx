import React, { useEffect, useMemo, useState } from 'react';
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

  // Mobile: show first N and toggle to reveal all
  const MOBILE_VISIBLE = 6;
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 576px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update);
    };
  }, []);

  // No sticky behavior here; main page header handles stickiness
  const visibleStops = useMemo(() => {
    if (!isMobile) return routeStops; // Always show all on desktop/tablet
    if (expanded) return routeStops;
    return routeStops.slice(0, MOBILE_VISIBLE);
  }, [expanded, routeStops, isMobile]);

  return (
    <section id="route-section" className={styles.jeepneyRoute}>
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
                <Row className={`align-items-center g-1 ${styles.routeRow}`}>
                  {visibleStops.map((stop, index) => (
                    <Col key={`stop-${index}`} lg={3} md={4} sm={6} xs={12} className="mb-2">
                      <div className={styles.stopItem}>
                        <Button 
                          variant={stop.variant} 
                          size="sm" 
                          className={`w-100 ${styles.stopBtn}`}
                        >
                          {stop.name}
                        </Button>
                        {index !== visibleStops.length - 1 && (
                          <span className={styles.stopArrow}>
                            <i className="bi bi-arrow-right"></i>
                          </span>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
                <div className={`d-sm-none text-center mt-2`}>
                  {isMobile && routeStops.length > MOBILE_VISIBLE && (
                    <button className={styles.seeMoreBtn} onClick={() => setExpanded((v) => !v)}>
                      {expanded ? 'See less' : 'See more'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default RouteSection;
