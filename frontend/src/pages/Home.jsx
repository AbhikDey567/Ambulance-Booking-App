import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "./Home.css";
import heroImage from "../assets/amb.jpg"; // Hero image
import sectionBg from "../assets/ambu2.jpg"; // Static background for sections
import feature1 from "../assets/ready.jpg";
import feature2 from "../assets/ambu.jpg";
import feature3 from "../assets/ole.jpg";

function Home() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Show back-to-top button after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) setShowTopBtn(true);
      else setShowTopBtn(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="overlay">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <h1>Fast Ambulance Services 24/7</h1>
            <p>Book & track ambulances instantly with Fastrack Ambulance</p>
            <motion.button
         className="primary-btn hero-btn"
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         as={Link}
        >
        <Link to="/find-drivers" style={{ color: "inherit", textDecoration: "none" }}>
        Book Now
        </Link>
        </motion.button>
          </motion.div>

          <motion.div
            className="hero-image"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <img src={feature1} alt="Ambulance Illustration" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
  className="feature-section"
  style={{ backgroundImage: `url(${sectionBg})` }}
>
  <div className="feature-grid">
    {[feature1, feature2, feature3].map((img, i) => (
      <motion.div
        className="feature-card"
        key={i}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.1}}
        whileHover={{ scale: 1.05, boxShadow: "0px 15px 25px rgba(0,0,0,0.3)" }}
      >
        <img src={img} alt={`Feature ${i + 1}`} />
        <h3>
          {i === 0
            ? "Fast Response"
            : i === 1
            ? "GPS Tracking"
            : "Trained Professionals"}
        </h3>
        <p>
          {i === 0
            ? "Ambulances arrive in minutes thanks to our wide network."
            : i === 1
            ? "Track your ambulance live for transparency and peace of mind."
            : "Certified paramedics and modern equipment ensure quality care."}
        </p>
      </motion.div>
    ))}
  </div>
</section>

      {/* Trust Section */}
      <motion.section
        className="trust"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2>Trusted by Hospitals & Corporates</h2>
        <p>10,000+ emergencies handled successfully</p>
        <div className="logos">
          <span>🏥 AIIMS</span>
          <span>🏥 Apollo</span>
          <span>🏥 Fortis</span>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section
        className="final-cta"
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2>Be Prepared. Get Help Faster.</h2>
        <motion.button
         className="primary-btn hero-btn"
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         as={Link}
        >
        <Link to="/find-drivers" style={{ color: "inherit", textDecoration: "none" }}>
        Book Now
        </Link>
        </motion.button>
      </motion.section>

      {/* Back-to-Top Button */}
      {showTopBtn && (
        <button className="back-to-top" onClick={scrollToTop}>
          ↑ Top
        </button>
      )}
    </div>
  );
}

export default Home;
