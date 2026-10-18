import React from 'react';

interface AeemciLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
}

export const AeemciLogo: React.FC<AeemciLogoProps> = ({ 
  className = '', 
  size = 'md',
  src = '/src/assets/images/aeemci_official_logo_1792254182659.jpg'
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const [imageError, setImageError] = React.useState(false);

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {!imageError && src ? (
        <img
          src={src}
          alt="Logo Officiel AEEMCI"
          className="w-full h-full object-contain drop-shadow-xs"
          onError={() => setImageError(true)}
        />
      ) : (
        /* Exact Vector SVG Fallback corresponding to official AEEMCI logo */
        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Arched Text Path */}
          <path id="textArc" d="M 25 140 A 85 85 0 0 1 175 140" fill="none" />
          <text fontSize="8.5" fontWeight="600" fill="#047857" fontFamily="system-ui, sans-serif">
            <textPath href="#textArc" startOffset="50%" textAnchor="middle">
              Association des Elèves et Etudiants Musulmans de Côte d'Ivoire
            </textPath>
          </text>

          {/* Minaret Dome & Spire */}
          <path d="M 100 42 L 100 48" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="40" r="1.5" fill="#047857" />
          {/* Dome */}
          <path d="M 91 58 Q 91 48 100 48 Q 109 48 109 58 Z" fill="#047857" stroke="#065f46" strokeWidth="1" />
          <rect x="89" y="58" width="22" height="3" rx="1" fill="#047857" />

          {/* Balcony / Gallery */}
          <rect x="88" y="70" width="24" height="4" rx="1" fill="#047857" />
          <path d="M 92 61 L 92 70 M 97 61 L 97 70 M 103 61 L 103 70 M 108 61 L 108 70" stroke="#ffffff" strokeWidth="1.2" />

          {/* Minaret Tower Body */}
          <rect x="91" y="74" width="18" height="38" fill="#ffffff" stroke="#047857" strokeWidth="2" />
          {/* Arched door/window */}
          <path d="M 96 112 V 86 Q 100 81 104 86 V 112 Z" fill="#047857" />

          {/* Green Star (5-pointed) */}
          <polygon
            points="132,68 136,79 148,79 138,86 142,97 132,90 122,97 126,86 116,79 128,79"
            fill="none"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Box with Shahada text */}
          <rect x="52" y="112" width="96" height="20" rx="1.5" fill="#ffffff" stroke="#047857" strokeWidth="1.5" />
          <text x="100" y="120" textAnchor="middle" fontSize="5.2" fontWeight="700" fill="#047857" fontFamily="system-ui, sans-serif">
            Il n'y a de Divinité qu'Allah et
          </text>
          <text x="100" y="128" textAnchor="middle" fontSize="5.2" fontWeight="700" fill="#047857" fontFamily="system-ui, sans-serif">
            Mouhammad est Son Messager
          </text>

          {/* Upward Crescent Moon */}
          <path
            d="M 38 105 Q 100 170 162 105 Q 100 150 38 105 Z"
            fill="#047857"
          />

          {/* Bold AEEMCI letters at the bottom */}
          <text
            x="100"
            y="180"
            textAnchor="middle"
            fontSize="26"
            fontWeight="900"
            fill="#047857"
            letterSpacing="5"
            fontFamily="Arial Black, Impact, system-ui, sans-serif"
          >
            AEEMCI
          </text>
        </svg>
      )}
    </div>
  );
};
