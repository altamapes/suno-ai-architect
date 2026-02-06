import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-8 text-center border-b border-white/5 bg-suno-dark/50 backdrop-blur-md sticky top-0 z-50">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-suno-primary via-white to-suno-secondary">
        SUNO AI <span className="font-light text-white/80">ARCHITECT</span>
      </h1>
      <p className="mt-2 text-white/40 text-sm md:text-base font-mono">
        Blueprint & Lyrics Generator powered by Gemini 3
      </p>
    </header>
  );
};

export default Header;