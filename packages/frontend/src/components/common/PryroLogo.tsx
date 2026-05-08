interface PryroLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Pryro logo — matches the real logo: lowercase "pryro" in Nunito font,
 * white text on a blue rounded rectangle.
 */
export default function PryroLogo({ size = 'md' }: PryroLogoProps) {
  const styles: Record<string, { padding: string; fontSize: string; borderRadius: string }> = {
    sm: { padding: '3px 8px',  fontSize: '13px', borderRadius: '6px'  },
    md: { padding: '5px 12px', fontSize: '18px', borderRadius: '9px'  },
    lg: { padding: '8px 18px', fontSize: '28px', borderRadius: '12px' },
  };

  const s = styles[size];

  return (
    <span
      style={{
        display: 'inline-block',
        background: '#2563eb',       // blue-600
        color: '#ffffff',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        letterSpacing: '-0.5px',
        lineHeight: 1,
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: s.borderRadius,
        userSelect: 'none',
      }}
    >
      pryro
    </span>
  );
}
