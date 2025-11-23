import { useEffect, useState } from 'react';
import '../christmas.css';

export default function ChristmasDecorations() {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    // Generuj płatki śniegu
    const flakes = [];
    for (let i = 0; i < 20; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 10,
        size: 0.8 + Math.random() * 0.7
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="christmas-decorations">
      {/* Paski candy cane */}
      <div className="candy-stripe-top"></div>
      <div className="candy-stripe-bottom"></div>

      {/* Migające światełka */}
      <div className="christmas-lights">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="light"></div>
        ))}
      </div>

      {/* Spadające płatki śniegu */}
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            fontSize: `${flake.size}rem`
          }}
        >
          ❄
        </div>
      ))}

      {/* Dekoracje w rogach */}
      <div className="christmas-corner top-left">🎄</div>
      <div className="christmas-corner top-right">🎅</div>
      <div className="christmas-corner bottom-left">🎁</div>
      <div className="christmas-corner bottom-right">🍬</div>
    </div>
  );
}
