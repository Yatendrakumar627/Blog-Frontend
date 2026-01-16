import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const Emoji = ({ emoji, x, y, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0, x, y }}
        animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.5, 1.2, 0.8],
            y: y - 300,
            x: x + (Math.random() - 0.5) * 200,
            rotate: Math.random() * 360
        }}
        transition={{ duration: 2, delay, ease: "easeOut" }}
        style={{
            position: 'fixed',
            fontSize: '2rem',
            pointerEvents: 'none',
            zIndex: 9999
        }}
    >
        {emoji}
    </motion.div>
);

export const ReactionRain = ({ emoji, trigger }) => {
    const [emojis, setEmojis] = useState([]);

    useEffect(() => {
        if (trigger) {
            const newEmojis = Array.from({ length: 15 }).map((_, i) => ({
                id: Date.now() + i,
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 50,
                delay: Math.random() * 0.5
            }));
            setEmojis(newEmojis);
            const timer = setTimeout(() => setEmojis([]), 3000);
            return () => clearTimeout(timer);
        }
    }, [trigger]);

    return (
        <AnimatePresence>
            {emojis.map((e) => (
                <Emoji key={e.id} emoji={emoji} x={e.x} y={e.y} delay={e.delay} />
            ))}
        </AnimatePresence>
    );
};
