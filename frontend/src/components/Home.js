import React, { useState } from 'react';
import {Container,Row,Col,Button,Offcanvas,OffcanvasHeader,OffcanvasBody} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaUserShield, FaInfoCircle, FaEnvelope } from 'react-icons/fa';
import { useSelector } from 'react-redux';

import 'bootstrap/dist/css/bootstrap.min.css';
import home from '../image/home.png';
import logo from '../image/logo.png';
import ProfileMenu from './ProfileMenu';

export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const goToLogin = () => navigate('/login');

  const goToAdmin = () => {
    setMenuOpen(false);
    navigate('/adminlogin');
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{ backgroundColor: '#eaf4ff' }}
    >
    
      <header className="d-flex justify-content-between align-items-center px-4 py-3">
        <div className="d-flex align-items-center gap-2">
          {logo && (
            <img
              src={logo}  
              alt="SparkUp logo"
              style={{ height: '150px', width: '200px' }}
            />
          )}
    
        </div>

        <div className="d-flex align-items-center gap-3">
          {user && <ProfileMenu />}
          <Button
            outline
            color="primary"
            className="rounded-circle d-flex justify-content-center align-items-center shadow-sm"
            style={{ width: 44, height: 44, borderWidth: 0 }}
            onClick={toggleMenu}
          >
            <FaBars size={22} />
          </Button>
        </div>
      </header>

      <Container className="flex-grow-1 d-flex align-items-center">
        <Row className="w-100 align-items-center">
        
          <Col md="6" className="mb-4 mb-md-0">
            <h1 className="mb-3"style={{ fontSize: '2.2rem', color: '#1a4d80', fontWeight: 700 }}>
              Your ideas deserve a safe space to grow.
            </h1>
            <p className="mb-4" style={{ fontSize: '1.05rem', color: '#395777' }}>
              SparkUp protects, supports, and elevates your innovation journey.
              Log in to start managing your ideas securely.
            </p>

            <Button
              color="primary"
              size="lg"
              className="px-4 shadow-sm"
              style={{
                borderRadius: '999px',
                background:
                  'linear-gradient(135deg, #1a73e8 0%, #4f9cf9 50%, #ff9f43 100%)',
                border: 'none',
              }}
              onClick={goToLogin}
            >
              Get Started
            </Button>
          </Col>

          
          <Col
            md="6"
            className="d-flex justify-content-center align-items-center"
          >
            <div >
              <img
                src={home}
                alt="Innovation illustration"
                style={{
                  width: '200%',
                  maxWidth: '800px',
                  height: 'auto',
                  objectFit: 'cover',
                  borderRadius: '18px',
                }}
              />
            </div>
          </Col>
        </Row>
      </Container>

      
      <Offcanvas
        isOpen={menuOpen}
        toggle={toggleMenu}
        direction="end"
        style={{ width: '260px', backgroundColor: '#fdfdfd' }}
      >
        <OffcanvasHeader toggle={toggleMenu} className="border-bottom">
          <span style={{ fontWeight: 700, color: '#1a4d80' }}>Menu</span>
        </OffcanvasHeader>
        <OffcanvasBody className="pt-3">
          <div className="d-grid gap-3">
            <Button
              color="primary"
              outline
              className="d-flex align-items-center justify-content-start gap-2"
              onClick={goToAdmin}
            >
              <FaUserShield />
              <span>Admin Login</span>
            </Button>

            <Button
              color="secondary"
              outline
              className="d-flex align-items-center justify-content-start gap-2"
              onClick={() => {
                setMenuOpen(false);
                navigate('/about');
              }}
            >
              <FaInfoCircle />
              <span>About Us</span>
            </Button>

            <Button
              color="secondary"
              outline
              className="d-flex align-items-center justify-content-start gap-2"
              onClick={() => {
                setMenuOpen(false);
                navigate('/contact');
              }}
            >
              <FaEnvelope />
              <span>Contact Us</span>
            </Button>
          </div>
        </OffcanvasBody>
      </Offcanvas>
    </div>
  );
}
