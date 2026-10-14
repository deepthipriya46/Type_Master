import React from 'react';

const WhatsAppSupport = ({
  message = "Hello! I need assistance with TypeMaster.",
  style = {}
}) => {
  // Configurable support details
  const phoneNumber = "918019756623"; // Support phone number +91 8019756623
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-btn"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        backgroundColor: '#25D366',
        color: '#FFFFFF',
        borderRadius: '50px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '14px',
        zIndex: 9999,
        transition: 'all 0.25s ease-in-out',
        cursor: 'pointer',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 211, 102, 0.4)';
      }}
    >
      {/* WhatsApp SVG Icon */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.012 2C6.486 2 2 6.479 2 12c0 2.191.706 4.225 1.906 5.882L2 22l4.241-1.859A9.94 9.94 0 0012.012 22c5.526 0 10.012-4.479 10.012-10S17.538 2 12.012 2zm.003 18c-1.834 0-3.535-.508-4.992-1.391l-.358-.218-2.527 1.108.825-2.457-.238-.371A7.94 7.94 0 014 12c0-4.411 3.589-8 8.015-8 4.425 0 8.012 3.589 8.012 8s-3.587 8-8.012 8z" />
        <path d="M17.507 14.301c-.279-.14-1.649-.814-1.904-.907-.256-.093-.442-.14-.628.14-.186.279-.721.907-.884 1.093-.163.186-.326.21-.605.07-.279-.14-1.178-.434-2.244-1.385-.829-.739-1.389-1.652-1.552-1.931-.163-.279-.017-.43.123-.569.126-.125.279-.326.419-.489.14-.163.186-.279.279-.465.093-.186.047-.349-.023-.489-.07-.14-.628-1.512-.86-2.07-.226-.544-.455-.47-.628-.479-.163-.008-.349-.01-.535-.01-.186 0-.488.07-.744.349-.256.279-.977.954-.977 2.326s1.001 2.698 1.14 2.884c.14.186 1.968 3.006 4.77 4.214.667.288 1.188.46 1.594.59.67.213 1.28.183 1.762.111.537-.08 1.649-.674 1.882-1.325.233-.651.233-1.21.163-1.326-.07-.116-.256-.186-.535-.326z" />
      </svg>
      <span>Need Help? Chat Support</span>
    </a>
  );
};

export default WhatsAppSupport;
