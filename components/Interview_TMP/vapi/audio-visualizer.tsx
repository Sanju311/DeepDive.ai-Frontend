"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { useInterview } from '../InterviewProvider';
 
const RadialCard: React.FC = () => {
  const { volumeLevel, isSessionActive, toggleCall } = useInterview();
  const [bars, setBars] = useState(Array(50).fill(0));
 
  useEffect(() => {
    if (isSessionActive) {
      setBars(prev => prev.map(() => Math.random() * volumeLevel * 50));
    } else {
      setBars(Array(50).fill(0));
    }
  }, [volumeLevel, isSessionActive]);
 
  return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center justify-center h-full relative" style={{ width: '220px', height: '220px' }}>
          <svg width="70%" height="70%" viewBox="0 0 300 300">
            {bars.map((height, index) => {
              const angle = (index / bars.length) * 360;
              const radians = (angle * Math.PI) / 180;
              const x1 = 150 + Math.cos(radians) * 50;
              const y1 = 150 + Math.sin(radians) * 50;
              const x2 = 150 + Math.cos(radians) * (100 + height);
              const y2 = 150 + Math.sin(radians) * (100 + height);
 
              return (
                <motion.line
                  key={index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="stroke-current text-black dark:text-white dark:opacity-70 opacity-70"
                  strokeWidth="2"
                  initial={{ x2: x1, y2: y1 }}
                  animate={{ x2, y2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              );
            })}
          </svg>
        </div>
      </div>
  );
};
 
export default RadialCard;