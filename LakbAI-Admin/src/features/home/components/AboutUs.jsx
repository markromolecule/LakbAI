import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import styles from '../styles/AboutUs.module.css';

const teamMembers = [
  { name: 'Mark Joseph Livado', role: 'Lead Developer | Project Manager', image: '/image/team/MARK.jpg'},
  { name: 'Jiro Del Carmen', role: 'Backend Developer', image: '/image/team/CARMEN.jpg' },
  { name: 'John Melthon Donaire', role: 'Backend Developer', image: '/image/team/DONAIRE.jpg' },
  { name: 'Pia Ellaine Lucero', role: 'UI/UX Designer', image: '/image/team/LUCERO.jpg' },
  { name: 'Ma. Rochelle Ogad', role: 'QA Tester', image: '/image/team/OGAD.png' },
  { name: 'Saffiya Rapsing', role: 'Documentation', image: '/image/team/RAPSING.jpg' },
  { name: 'Marquiz Dhaniel Salazar', role: 'Documentation', image: '/image/team/SALAZAR.jpg' },
  { name: 'Julian Blaise Adriano', role: 'Documentation', image: '/image/team/ADRIANO.png' },
];

const AboutUs = () => {
  return (
    <>
      <section id="about" className={styles.aboutSection}>
        <div className="header-content">
          <div className="about-container">
            {/* Title Section */}
            <div className="title-section">
              <h2 className={styles.title}>About Us</h2>
              <p className={styles.subtitle}>The team behind LakbAI</p>
              <div className={styles.titleAccent} />
            </div>

            {/* Team Members Section */}
            <div className="team-section">
              {teamMembers.map((member) => (
                <Card className={styles.memberCardMinimal} key={member.name}>
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
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <style>{`
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          width: 100%;
        }
        
        .about-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .title-section {
          text-align: center;
          margin-bottom: 3rem;
          max-width: 800px;
        }
        
        .team-section {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1.5rem;
          width: 100%;
          max-width: 1200px;
        }
        
        .team-section .card {
          flex: 0 0 280px;
          max-width: 280px;
        }
        
        @media (max-width: 768px) {
          .team-section {
            flex-direction: column;
            align-items: center;
          }
          
          .team-section .card {
            flex: none;
            width: 100%;
            max-width: 350px;
          }
        }
      `}</style>
    </>
  );
};

export default AboutUs;


