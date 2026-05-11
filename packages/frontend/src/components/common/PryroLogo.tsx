import pryroLogo from '../../assets/pryro_logo.jpeg';

interface PryroLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function PryroLogo({ size = 'md' }: PryroLogoProps) {
  const heights: Record<string, string> = {
    sm: '28px',
    md: '40px',
    lg: '60px',
  };

  return (
    <img
      src={pryroLogo}
      alt="Pryro logo"
      style={{
        height: heights[size],
        width: 'auto',
        objectFit: 'contain',
        display: 'inline-block',
      }}
    />
  );
}
