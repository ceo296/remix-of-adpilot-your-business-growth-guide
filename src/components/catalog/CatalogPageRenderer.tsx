import React from 'react';
import { Package, Image as ImageIcon, Phone, Mail, MapPin, Globe } from 'lucide-react';
import type { CatalogPage } from '@/types/catalog';

interface CatalogPageRendererProps {
  page: CatalogPage;
  brandColor?: string;
  secondaryColor?: string;
  businessName?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  scale?: number;
}

// Helper to create lighter/darker shades
const adjustColor = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
};

const hexToRgba = (hex: string, alpha: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  return `rgba(${num >> 16}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
};

export const CatalogPageRenderer: React.FC<CatalogPageRendererProps> = ({
  page,
  brandColor = '#E34870',
  secondaryColor = '#1a1a2e',
  businessName = 'שם העסק',
  logoUrl,
  phone,
  email,
  address,
  scale = 1,
}) => {
  const W = 794;
  const H = 1123;
  const lightBrand = adjustColor(brandColor, 60);
  const darkBrand = adjustColor(brandColor, -40);
  const veryLightBrand = adjustColor(brandColor, 140);

  const baseStyle: React.CSSProperties = {
    width: W,
    height: H,
    transform: `scale(${scale})`,
    transformOrigin: 'top right',
    direction: 'rtl',
    fontFamily: '"Assistant", "Heebo", sans-serif',
    position: 'absolute',
    top: 0,
    right: 0,
    overflow: 'hidden',
  };

  // Decorative SVG patterns
  const dotPattern = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='white' opacity='0.15'/%3E%3C/svg%3E")`;
  const diagonalPattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0' stroke='white' stroke-width='0.5' opacity='0.08'/%3E%3C/svg%3E")`;

  switch (page.type) {
    case 'cover':
      return (
        <div style={{
          ...baseStyle,
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${brandColor} 50%, ${darkBrand} 100%)`,
        }}>
          {/* Giant decorative circle */}
          <div style={{
            position: 'absolute', width: 900, height: 900, borderRadius: '50%',
            background: `radial-gradient(circle, ${hexToRgba(brandColor, 0.15)} 0%, transparent 70%)`,
            top: -200, left: -200,
          }} />
          {/* Diagonal lines texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: diagonalPattern }} />
          {/* Side accent bar */}
          <div style={{
            position: 'absolute', left: 0, top: 0, width: 8, height: '100%',
            background: `linear-gradient(to bottom, ${lightBrand}, ${brandColor}, transparent)`,
          }} />
          {/* Geometric shapes */}
          <div style={{
            position: 'absolute', bottom: 120, right: 50, width: 200, height: 200,
            border: `2px solid ${hexToRgba(brandColor, 0.2)}`, borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: 180, right: 110, width: 120, height: 120,
            border: `1px solid ${hexToRgba(brandColor, 0.12)}`, borderRadius: '50%',
          }} />
          {/* Content */}
          <div style={{
            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', padding: 80, textAlign: 'center', zIndex: 2,
          }}>
            {logoUrl && (
              <div style={{
                background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: '18px 32px',
                marginBottom: 50, boxShadow: `0 20px 60px ${hexToRgba(brandColor, 0.3)}`,
                backdropFilter: 'blur(10px)',
              }}>
                <img src={logoUrl} alt="logo" style={{ height: 70, objectFit: 'contain' }} />
              </div>
            )}
            {/* Thin accent line */}
            <div style={{
              width: 80, height: 3, backgroundColor: lightBrand, marginBottom: 40,
              borderRadius: 2, boxShadow: `0 0 20px ${hexToRgba(lightBrand, 0.5)}`,
            }} />
            <h1 style={{
              fontSize: 72, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1,
              letterSpacing: '-1px', textShadow: `0 4px 30px ${hexToRgba(secondaryColor, 0.5)}`,
            }}>
              {page.title}
            </h1>
            {page.subtitle && (
              <p style={{
                fontSize: 28, color: hexToRgba('#ffffff', 0.7), marginTop: 20,
                fontWeight: 300, letterSpacing: '4px',
              }}>
                {page.subtitle}
              </p>
            )}
            <div style={{
              width: 50, height: 3, backgroundColor: hexToRgba('#ffffff', 0.3),
              marginTop: 40, borderRadius: 2,
            }} />
            <p style={{
              fontSize: 18, color: hexToRgba('#ffffff', 0.45), marginTop: 25,
              fontWeight: 300, letterSpacing: '2px',
            }}>
              {businessName}
            </p>
          </div>
          {/* Bottom gradient band */}
          <div style={{
            position: 'absolute', bottom: 0, width: '100%', height: 80,
            background: `linear-gradient(to top, ${hexToRgba(secondaryColor, 0.8)}, transparent)`,
          }} />
        </div>
      );

    case 'products':
      return (
        <div style={{ ...baseStyle, background: '#fafafa' }}>
          {/* Top colored band */}
          <div style={{
            height: 140, background: `linear-gradient(135deg, ${brandColor} 0%, ${darkBrand} 100%)`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern }} />
            {/* Curved bottom */}
            <svg style={{ position: 'absolute', bottom: -1, width: '100%' }} viewBox="0 0 794 40" preserveAspectRatio="none">
              <path d="M0,40 L0,20 Q397,0 794,20 L794,40 Z" fill="#fafafa" />
            </svg>
            <div style={{
              position: 'relative', padding: '35px 50px', display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div>
                <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: 0 }}>{page.title}</h2>
                <div style={{ width: 50, height: 3, backgroundColor: hexToRgba('#fff', 0.4), marginTop: 10, borderRadius: 2 }} />
              </div>
            </div>
          </div>

          {/* Product grid - 2 columns, large cards */}
          <div style={{
            padding: '30px 40px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 20, direction: 'rtl',
          }}>
            {(page.products || []).map((product, idx) => (
              <div key={product.id} style={{
                background: '#fff', borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #eee',
                transition: 'transform 0.2s',
              }}>
                {/* Product image area */}
                <div style={{
                  height: 180,
                  background: idx % 3 === 0
                    ? `linear-gradient(135deg, ${hexToRgba(brandColor, 0.08)}, ${hexToRgba(brandColor, 0.03)})`
                    : idx % 3 === 1
                      ? `linear-gradient(135deg, #f0f4f8, #e8ecf0)`
                      : `linear-gradient(135deg, ${hexToRgba(secondaryColor, 0.06)}, #f5f5f5)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Package style={{ width: 44, height: 44, color: hexToRgba(brandColor, 0.25) }} />
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>תמונת מוצר</div>
                    </div>
                  )}
                  {product.badge && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      background: `linear-gradient(135deg, ${brandColor}, ${darkBrand})`,
                      color: '#fff', fontSize: 12, padding: '5px 14px', borderRadius: 20,
                      fontWeight: 800, boxShadow: `0 4px 12px ${hexToRgba(brandColor, 0.3)}`,
                      letterSpacing: '0.5px',
                    }}>
                      {product.badge}
                    </div>
                  )}
                </div>
                <div style={{ padding: '18px 20px 22px' }}>
                  <div style={{
                    fontSize: 20, fontWeight: 800, color: '#222', marginBottom: 6,
                  }}>
                    {product.name}
                  </div>
                  {product.description && (
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>
                      {product.description}
                    </div>
                  )}
                  {product.price && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{
                        fontSize: 24, fontWeight: 900, color: brandColor,
                        letterSpacing: '-0.5px',
                      }}>
                        {product.price}
                      </div>
                      <div style={{
                        fontSize: 11, color: brandColor, border: `1.5px solid ${hexToRgba(brandColor, 0.3)}`,
                        padding: '4px 12px', borderRadius: 20, fontWeight: 700,
                      }}>
                        לפרטים נוספים ←
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            position: 'absolute', bottom: 0, width: '100%', height: 50,
            background: `linear-gradient(135deg, ${brandColor}, ${darkBrand})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30,
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{businessName}</span>
            {phone && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', direction: 'ltr' }}>📞 {phone}</span>}
          </div>
        </div>
      );

    case 'text':
      return (
        <div style={{ ...baseStyle, background: '#fff' }}>
          {/* Decorative top section */}
          <div style={{
            height: 300, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(160deg, ${brandColor} 0%, ${secondaryColor} 100%)`,
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern }} />
            <div style={{
              position: 'absolute', top: -100, right: -100, width: 400, height: 400,
              borderRadius: '50%', background: hexToRgba('#fff', 0.05),
            }} />
            <svg style={{ position: 'absolute', bottom: -1, width: '100%' }} viewBox="0 0 794 80" preserveAspectRatio="none">
              <path d="M0,80 L0,40 Q200,0 400,30 Q600,60 794,10 L794,80 Z" fill="#fff" />
            </svg>
            <div style={{
              position: 'relative', padding: '70px 60px', zIndex: 2,
            }}>
              <h2 style={{
                fontSize: 48, fontWeight: 900, color: '#fff', margin: 0,
                textShadow: `0 4px 20px ${hexToRgba(secondaryColor, 0.3)}`,
              }}>
                {page.title}
              </h2>
              <div style={{
                width: 60, height: 4, backgroundColor: hexToRgba('#fff', 0.5),
                marginTop: 20, borderRadius: 2,
              }} />
            </div>
          </div>

          {/* Body content */}
          <div style={{ padding: '40px 70px 60px' }}>
            {/* Decorative quote mark */}
            <div style={{
              fontSize: 120, fontWeight: 900, color: hexToRgba(brandColor, 0.08),
              lineHeight: 0.8, marginBottom: -20, fontFamily: 'Georgia, serif',
            }}>
              ״
            </div>
            <p style={{
              fontSize: 20, lineHeight: 2.2, color: '#444', fontWeight: 400,
              maxWidth: 600,
            }}>
              {page.body}
            </p>
          </div>

          {/* Side accent */}
          <div style={{
            position: 'absolute', right: 0, top: 300, width: 5, height: 200,
            background: `linear-gradient(to bottom, ${brandColor}, transparent)`,
            borderRadius: '0 0 0 3px',
          }} />

          {/* Footer */}
          <div style={{
            position: 'absolute', bottom: 30, width: '100%', textAlign: 'center',
            fontSize: 12, color: '#ccc',
          }}>
            {businessName}
          </div>
        </div>
      );

    case 'contact':
      return (
        <div style={{
          ...baseStyle,
          background: `linear-gradient(160deg, ${secondaryColor} 0%, ${brandColor} 60%, ${darkBrand} 100%)`,
        }}>
          {/* Big decorative rings */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 600, height: 600, borderRadius: '50%',
            border: `1px solid ${hexToRgba('#fff', 0.06)}`,
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 450, height: 450, borderRadius: '50%',
            border: `1px solid ${hexToRgba('#fff', 0.08)}`,
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 300, height: 300, borderRadius: '50%',
            border: `1px solid ${hexToRgba('#fff', 0.1)}`,
          }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: diagonalPattern }} />

          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', padding: 60, textAlign: 'center',
            position: 'relative', zIndex: 2,
          }}>
            {logoUrl && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '15px 25px',
                marginBottom: 40, backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <img src={logoUrl} alt="logo" style={{
                  height: 50, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9,
                }} />
              </div>
            )}
            <h2 style={{
              fontSize: 52, fontWeight: 900, color: '#fff', marginBottom: 15,
              textShadow: `0 4px 30px ${hexToRgba(secondaryColor, 0.4)}`,
            }}>
              {page.title}
            </h2>
            <div style={{
              width: 60, height: 3, backgroundColor: hexToRgba('#fff', 0.4),
              marginBottom: 50, borderRadius: 2,
            }} />

            {/* Contact cards */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 380,
            }}>
              {phone && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 24px',
                  display: 'flex', alignItems: 'center', gap: 16, direction: 'ltr',
                  backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: hexToRgba(brandColor, 0.3),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 20 }}>📞</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>PHONE</div>
                    <div style={{ fontSize: 20, color: '#fff', fontWeight: 600, letterSpacing: '1px' }}>{phone}</div>
                  </div>
                </div>
              )}
              {email && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 24px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: hexToRgba(brandColor, 0.3),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 20 }}>✉️</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>EMAIL</div>
                    <div style={{ fontSize: 18, color: '#fff', fontWeight: 600 }}>{email}</div>
                  </div>
                </div>
              )}
              {address && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 24px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: hexToRgba(brandColor, 0.3),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 20 }}>📍</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>כתובת</div>
                    <div style={{ fontSize: 18, color: '#fff', fontWeight: 600 }}>{address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            position: 'absolute', bottom: 0, width: '100%', height: 60,
            background: 'rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: '3px' }}>
              {businessName}
            </span>
          </div>
        </div>
      );

    case 'full-image':
      return (
        <div style={{ ...baseStyle, background: '#111' }}>
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, #1a1a1a 0%, ${hexToRgba(brandColor, 0.15)} 100%)`,
          }}>
            <div style={{ textAlign: 'center' }}>
              <ImageIcon style={{ width: 80, height: 80, color: hexToRgba(brandColor, 0.3) }} />
              <div style={{ fontSize: 16, color: '#555', marginTop: 16 }}>גרור תמונה לכאן</div>
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 0, width: '100%', padding: '50px 50px 40px',
            background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)`,
          }}>
            <h2 style={{
              fontSize: 36, fontWeight: 900, color: '#fff', margin: 0,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              {page.title}
            </h2>
            <div style={{ width: 40, height: 3, backgroundColor: brandColor, marginTop: 12, borderRadius: 2 }} />
          </div>
        </div>
      );

    case 'toc':
      return (
        <div style={{ ...baseStyle, background: '#fff' }}>
          {/* Side accent strip */}
          <div style={{
            position: 'absolute', right: 0, top: 0, width: 70, height: '100%',
            background: `linear-gradient(to bottom, ${brandColor}, ${darkBrand})`,
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern }} />
          </div>

          <div style={{ padding: '80px 120px 80px 80px' }}>
            <div style={{
              fontSize: 14, color: brandColor, fontWeight: 700, marginBottom: 10,
              letterSpacing: '3px',
            }}>
              תוכן
            </div>
            <h2 style={{
              fontSize: 48, fontWeight: 900, color: '#222', marginBottom: 10,
            }}>
              תוכן עניינים
            </h2>
            <div style={{
              width: 50, height: 4, backgroundColor: brandColor, marginBottom: 60,
              borderRadius: 2,
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {['המוצרים שלנו', 'הסיפור שלנו', 'צור קשר'].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '24px 0', borderBottom: '1px solid #eee',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: i === 0 ? `linear-gradient(135deg, ${brandColor}, ${darkBrand})` : '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: i === 0 ? '#fff' : '#999', fontWeight: 800, fontSize: 16,
                    }}>
                      {String(i + 2).padStart(2, '0')}
                    </div>
                    <span style={{
                      fontSize: 22, fontWeight: 600, color: '#333',
                    }}>
                      {item}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 14, color: '#bbb', fontWeight: 600,
                  }}>
                    עמוד {i + 2}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom logo */}
          <div style={{
            position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
            opacity: 0.15,
          }}>
            {logoUrl && <img src={logoUrl} alt="" style={{ height: 40, objectFit: 'contain' }} />}
          </div>
        </div>
      );

    default:
      return (
        <div style={{
          ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f5f5f5', color: '#ccc', fontSize: 20,
        }}>
          עמוד ריק
        </div>
      );
  }
};
