const PoetryCard = ({ children, usePaperBg = true }) => {
  const bgImage = usePaperBg ? '/paper-bg.png' : '/quote-bg-1.png';
  const textColor = usePaperBg ? '#2c1810' : '#ffffff';

  return (
    <div 
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        padding: '2rem',
        borderRadius: '8px',
        color: textColor,
        textShadow: usePaperBg ? '1px 1px 2px rgba(255,255,255,0.3)' : '2px 2px 4px rgba(0,0,0,0.7)',
        margin: '1rem 0',
        minHeight: '200px'
      }}
    >
      {children}
    </div>
  );
};

export default PoetryCard;
