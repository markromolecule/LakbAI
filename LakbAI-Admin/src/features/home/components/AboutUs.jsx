import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import styles from '../styles/AboutUs.module.css';

const teamMembers = [
  { name: 'Mark Joseph Livado', role: 'Lead Developer | Project Manager', image: '/image/team/MARK.jpg'},
  { name: 'Jiro Del Carmen', role: 'Backend Developer', image: '/image/team/member-2.jpg' },
  { name: 'John Melthon Donaire', role: 'Backend Developer', image: '/image/team/member-3.jpg' },
  { name: 'Pia Ellaine Lucero', role: 'UI/UX Designer | Frontend Developer', image: '/image/team/member-4.jpg' },
  { name: 'Ma. Rochelle Ogad', role: 'QA Tester', image: '/image/team/member-5.jpg' },
  { name: 'Saffiya Rapsing', role: 'Documentation', image: '/image/team/member-6.jpg' },
  { name: 'Marquiz Dhaniel Salazar', role: 'Documentation', image: '/image/team/member-7.jpg' },
  { name: 'Julian Blaise Adriano', role: 'Documentation', image: '/image/team/member-8.jpg' },
];

const AboutUs = () => {
  return (
    <section id="about" className={styles.aboutSection}>
      <Container>
        <Row className="justify-content-center mb-4">
          <Col lg={8} className="text-center">
            <h2 className={styles.title}>About Us</h2>
            <p className={styles.subtitle}>The team behind LakbAI</p>
            <div className={styles.titleAccent} />
          </Col>
        </Row>

        <Row className="g-4">
          {teamMembers.map((member) => (
            <Col key={member.name} xs={12} sm={6} md={4} lg={3}>
              <Card className={styles.memberCardMinimal}>
                <div className={styles.avatarMinimalWrap}>
                  <div className={styles.avatarRing}>
                    <img
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      className={styles.avatarMinimal}
                      onError={(e) => {
                        e.currentTarget.src = '/image/team/placeholder.jpg';
                      }}
                    />
                  </div>
                </div>
                <Card.Body className="text-center">
                  <Card.Title className={styles.memberName}>{member.name}</Card.Title>
                  <div className={styles.rolePill}>{member.role}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default AboutUs;


