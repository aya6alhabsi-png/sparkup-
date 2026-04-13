import React, { useEffect, useRef } from "react";
import { Container, Row, Col, Button, Card, CardBody } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FaArrowRight,
  FaLightbulb,
  FaUserShield,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import logo from "../image/logo2.png";
import heroMain from "../image/h3.jpg";
import heroSecondary from "../image/home2.jpg";
import "./homePremium.css";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const rootRef = useRef(null);
  const navRef = useRef(null);
  const brandRef = useRef(null);
  const imageWrapRef = useRef(null);
  const floatingRef1 = useRef(null);
  const floatingRef2 = useRef(null);
  const statsRef = useRef([]);
  const featureRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -28,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
      });

      gsap.from(brandRef.current, {
        scale: 0.86,
        opacity: 0,
        duration: 0.9,
        delay: 0.15,
        ease: "back.out(1.7)",
      });

      gsap.to(brandRef.current, {
        y: -4,
        repeat: -1,
        yoyo: true,
        duration: 2.4,
        ease: "sine.inOut",
      });

      gsap.from(".spark-home-badge", {
        y: 16,
        opacity: 0,
        duration: 0.8,
        delay: 0.08,
        ease: "power3.out",
      });

      gsap.from(".spark-home-title", {
        y: 34,
        opacity: 0,
        duration: 0.95,
        delay: 0.12,
        ease: "power3.out",
      });

      gsap.from(".spark-home-text", {
        y: 24,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.from(".spark-home-actions .btn", {
        y: 18,
        opacity: 0,
        stagger: 0.1,
        duration: 0.75,
        delay: 0.28,
        ease: "power3.out",
      });

      gsap.from(imageWrapRef.current, {
        x: 32,
        opacity: 0,
        scale: 0.96,
        duration: 1,
        delay: 0.18,
        ease: "power3.out",
      });

      gsap.to(floatingRef1.current, {
        y: -14,
        repeat: -1,
        yoyo: true,
        duration: 2.8,
        ease: "sine.inOut",
      });

      gsap.to(floatingRef2.current, {
        y: -10,
        repeat: -1,
        yoyo: true,
        duration: 3.2,
        delay: 0.25,
        ease: "sine.inOut",
      });

      gsap.to(".spark-live-dot", {
        boxShadow: "0 0 0 12px rgba(30,136,229,0)",
        repeat: -1,
        duration: 1.7,
        ease: "power2.out",
      });

      statsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
          },
          y: 26,
          opacity: 0,
          duration: 0.75,
          delay: i * 0.08,
          ease: "power3.out",
        });
      });

      featureRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 86%",
          },
          y: 34,
          opacity: 0,
          duration: 0.85,
          delay: i * 0.08,
          ease: "power3.out",
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { value: "100+", label: "Ideas tracked" },
    { value: "4 roles", label: "Connected workflow" },
    { value: "Live", label: "Status updates" },
  ];

  const features = [
    {
      icon: <FaLightbulb />,
      title: "Submit ideas clearly",
      text: "Innovators can submit ideas and upload IP forms in a clean, guided flow.",
    },
    {
      icon: <FaUserShield />,
      title: "Admin control center",
      text: "Admins can review, comment, assign reviewers, and present ideas with clarity.",
    },
    {
      icon: <FaMoneyCheckAlt />,
      title: "Funding visibility",
      text: "Track every step from submission to funding in a more elegant and understandable way.",
    },
  ];

  return (
    <div className="spark-home-page" ref={rootRef}>
      <section className="spark-home-hero">
        <div className="spark-home-bg-blob spark-blob-left" />
        <div className="spark-home-bg-blob spark-blob-right" />

        <Container className="py-4 py-lg-5 position-relative">
          <nav className="spark-home-nav mb-4 mb-lg-5" ref={navRef}>
            <div
              className="spark-home-brand"
              onClick={() => navigate("/")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/");
              }}
              role="button"
              tabIndex={0}
              ref={brandRef}
            >
              <img src={logo} alt="SparkUp" className="spark-home-logo" />
              
            </div>

            <div className="spark-home-nav-links">
              <button onClick={() => navigate("/")}>Home</button>
              <button onClick={() => navigate("/about")}>About</button>
              <button onClick={() => navigate("/contact")}>Contact</button>
              <button
                className="spark-nav-login"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </div>
          </nav>

          <Row className="align-items-center g-4 g-lg-5">
            <Col lg="6">
              <div className="spark-home-copy">
                <div className="spark-home-badge">
                  <span className="spark-live-dot" />
                  Smart innovation platform for Oman
                </div>

                <h1 className="spark-home-title">
                  Turn ideas into <span>clear progress</span> and real funding.
                </h1>

              

                <div className="spark-home-actions">
                  <Button
                    className="spark-home-primary"
                    onClick={() => navigate("/register")}
                  >
                    Get Started <FaArrowRight className="ms-2" />
                  </Button>
                </div>

                <div className="spark-home-mini-stats">
                  {stats.map((item, i) => (
                    <div
                      className="spark-home-mini-card"
                      key={item.label}
                      ref={(el) => (statsRef.current[i] = el)}
                    >
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            <Col lg="6">
              <div className="spark-home-visual" ref={imageWrapRef}>
                <div className="spark-float-card spark-card-top" ref={floatingRef1}>
                  <div className="spark-float-dot blue" />
                  <div>
                    <strong>Spark With Us</strong>
                  </div>
                </div>

                <div className="spark-home-main-illustration">
                  <img src={heroMain} alt="SparkUp platform illustration" />
                </div>

                <div className="spark-home-side-preview" ref={floatingRef2}>
                  <img src={heroSecondary} alt="SparkUp live dashboard preview" />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="spark-home-features py-5">
        <Container>
          <div className="spark-section-head text-center mb-5">
            <div className="spark-section-badge">Why SparkUp ?</div>
          </div>

          <Row className="g-4">
            {features.map((item, index) => (
              <Col md="4" key={item.title}>
                <Card
                  className="spark-feature-card border-0"
                  ref={(el) => (featureRefs.current[index] = el)}
                >
                  <CardBody>
                    <div className="spark-feature-icon">{item.icon}</div>
                    <div className="spark-feature-number">0{index + 1}</div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </div>
  );
}