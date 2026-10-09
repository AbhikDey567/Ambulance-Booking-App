import React from 'react';
import './Footer.css';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { SiX } from 'react-icons/si'; 

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h4>Company</h4>
          <ul>
            <li><a href="#about">About Us</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#blog">Blog</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Support</h4>
          <ul>
            <li><a href="#help">Help Center</a></li>
            <li><a href="#contact">Contact Us</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Legal</h4>
          <ul>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#cookies">Cookie Policy</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://facebook.com"><FaFacebookF /></a>
            <a href="https://twitter.com"><SiX /></a>
            <a href="https://instagram.com"><FaInstagram /></a>
            <a href="https://linkedin.com"><FaLinkedinIn /></a>
            <a href="https://youtube.com"><FaYoutube /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Fastrack Ambulance. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
