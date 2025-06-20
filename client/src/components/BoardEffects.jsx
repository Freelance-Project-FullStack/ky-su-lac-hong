import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const EffectContainer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
`;

const ParticleEffect = styled(motion.div)`
  position: absolute;
  width: ${props => props.size || '4px'};
  height: ${props => props.size || '4px'};
  border-radius: 50%;
  background: ${props => props.color};
  box-shadow: 0 0 10px ${props => props.color};
  opacity: 0.8;
  mix-blend-mode: screen;
`;

const HighlightEffect = styled(motion.div)`
  position: absolute;
  width: 120%;
  height: 120%;
  top: -10%;
  left: -10%;
  border-radius: 50%;
  background: ${props => props.gradient || 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)'};
  filter: blur(8px);
  mix-blend-mode: overlay;
`;

const GlowEffect = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  background: ${props => props.color};
  filter: blur(15px);
  opacity: 0;
  mix-blend-mode: screen;
`;

const BoardEffects = ({ type, colors, isActive, isSelected }) => {
  // Tạo hiệu ứng particle cho các ô đặc biệt
  const generateParticles = () => {
    if (type === 'special' || type === 'corner') {
      return Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        x: 50 + Math.cos(i * Math.PI / 3) * 30,
        y: 50 + Math.sin(i * Math.PI / 3) * 30,
        size: Math.random() * 3 + 2 + 'px',
        color: colors.border,
        delay: i * 0.2
      }));
    }
    return [];
  };

  const particleVariants = {
    initial: (custom) => ({
      x: `${custom.x}%`,
      y: `${custom.y}%`,
      scale: 0,
      opacity: 0
    }),
    animate: (custom) => ({
      x: [
        `${custom.x}%`,
        `${custom.x + Math.cos(Math.random() * Math.PI * 2) * 20}%`,
        `${custom.x + Math.cos(Math.random() * Math.PI * 2) * 40}%`
      ],
      y: [
        `${custom.y}%`,
        `${custom.y + Math.sin(Math.random() * Math.PI * 2) * 20}%`,
        `${custom.y + Math.sin(Math.random() * Math.PI * 2) * 40}%`
      ],
      scale: [0, 1, 0],
      opacity: [0, 0.8, 0],
      transition: {
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.5, 1],
        delay: custom.delay,
        repeat: Infinity
      }
    })
  };

  const highlightVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: [0, 0.4, 0],
      scale: [0.8, 1.2, 0.8],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    }
  };

  const glowVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: isActive ? 0.6 : isSelected ? 0.3 : 0,
      scale: isActive ? 1.1 : 1,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      <EffectContainer>
        {/* Hiệu ứng đặc biệt cho các ô góc và đặc biệt */}
        {(type === 'special' || type === 'corner') && generateParticles().map(particle => (
          <ParticleEffect
            key={particle.id}
            custom={particle}
            variants={particleVariants}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            color={particle.color}
            size={particle.size}
          />
        ))}
        
        {/* Hiệu ứng highlight khi hover/active */}
        {(isActive || isSelected) && (
          <HighlightEffect
            variants={highlightVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            gradient={`radial-gradient(circle, ${colors.bg}40 0%, ${colors.border}20 50%, transparent 70%)`}
          />
        )}

        {/* Hiệu ứng glow cho tất cả các ô */}
        <GlowEffect
          variants={glowVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          color={colors.border}
        />
      </EffectContainer>
    </AnimatePresence>
  );
};

export default BoardEffects;
