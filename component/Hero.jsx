'use client';
import React, { useState } from "react";

/* -------------------- BACKGROUND CIRCUIT (your same code) -------------------- */
function CircuitBG() {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fade" cx="55%" cy="30%" r="75%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="70%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M44 0H0V44" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
        </pattern>

        <pattern id="dots" width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1.2" fill="white" fillOpacity="0.18" />
          <circle cx="44" cy="1" r="1.2" fill="white" fillOpacity="0.12" />
          <circle cx="1" cy="44" r="1.2" fill="white" fillOpacity="0.12" />
          <circle cx="44" cy="44" r="1.2" fill="white" fillOpacity="0.10" />
        </pattern>

        {/* orange/pink glow */}
        <radialGradient id="glow1" cx="20%" cy="18%" r="45%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glow2" cx="85%" cy="22%" r="45%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>

        <mask id="maskFade">
          <rect width="1200" height="700" fill="url(#fade)" />
        </mask>
      </defs>

      <g mask="url(#maskFade)">
        <rect width="1200" height="700" fill="url(#glow1)" />
        <rect width="1200" height="700" fill="url(#glow2)" />

        <rect width="1200" height="700" fill="url(#grid)" />
        <rect width="1200" height="700" fill="url(#dots)" />

        <g fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M80 120 H280 V220 H420" />
          <path d="M120 260 H260 V320 H520 V380 H760" />
          <path d="M90 420 H220 V460 H360 V520 H640" />
          <path d="M150 560 H330 V500 H460 V460 H620" />
          <path d="M360 90 V160 H520 V120 H720" />
          <path d="M520 70 V140 H680 V200 H860" />
          <path d="M1120 160 H980 V240 H860 V300" />
          <path d="M1080 360 H940 V420 H820 V520 H700" />
          <path d="M1100 520 H920 V560 H760" />
          <rect x="220" y="150" width="48" height="24" rx="6" />
          <rect x="540" y="260" width="62" height="28" rx="6" />
          <rect x="860" y="170" width="56" height="26" rx="6" />
          <rect x="780" y="460" width="74" height="30" rx="6" />
        </g>

        <g fill="white" fillOpacity="0.24">
          <circle cx="280" cy="120" r="3" />
          <circle cx="280" cy="220" r="3" />
          <circle cx="420" cy="220" r="3" />
          <circle cx="260" cy="320" r="3" />
          <circle cx="520" cy="380" r="3" />
          <circle cx="760" cy="380" r="3" />
          <circle cx="360" cy="520" r="3" />
          <circle cx="620" cy="460" r="3" />
          <circle cx="860" cy="240" r="3" />
          <circle cx="860" cy="300" r="3" />
          <circle cx="820" cy="520" r="3" />
          <circle cx="700" cy="520" r="3" />
        </g>
      </g>
    </svg>
  );
}

/* -------------------- INSIDE HERO STRUCTURE (like your screenshot) -------------------- */
function GlassTopBox() {
  return (
    <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <span className="h-3 w-3 rounded-full bg-green-400/70" />
        </div>

        <div className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 px-3 flex items-center text-white/60">
          ✨ <span className="ml-2">w</span>
        </div>

        <button className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-white/70">⌕</button>
        <button className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-white/70">✕</button>
      </div>

      <p className="mt-4 text-sm md:text-base leading-7 text-white/70">
        I’m a passionate full-stack developer. I enjoy building responsive web applications using React,
        Node.js and modern tools. I also have strong interest in cybersecurity and learning data science.
      </p>
    </div>
  );
}

function SkillCard({ skill, level }) {
  const pct = Math.min(100, Math.max(0, (level / 10) * 100));
  return (
    <div className="w-[320px] max-w-[90vw] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
      <div className="text-sm text-white/80">
        Skill : <span className="text-white/95">{skill}</span>
      </div>
      <div className="mt-2 text-sm text-white/70">
        Level : <span className="text-white/90">{level}</span>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function NetworkDiagram() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {/* lines */}
      <g fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M220 260 H420" />
        <path d="M420 260 H520 V170 H680" />
        <path d="M520 260 V380 H680" />
        <path d="M680 170 H860" />
        <path d="M680 380 H860" />

        <path d="M420 260 V120 H520" />
        <path d="M860 170 V80" />
        <path d="M860 380 V470" />
        <path d="M860 380 H1020 V280" />
        <path d="M680 380 V500" />
        <path d="M520 260 V470" />
        <path d="M520 470 H640" />
      </g>

      {/* nodes */}
      <g>
        {[
          [220, 260], [420, 260], [520, 260], [520, 170], [680, 170], [860, 170],
          [520, 380], [680, 380], [860, 380], [1020, 280], [860, 80], [860, 470],
          [680, 500], [520, 470], [640, 470], [520, 120]
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="20"
            fill="rgba(10,15,30,0.95)"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="6"
          />
        ))}
      </g>

      {/* small skill badges */}
      <g>
        <circle cx="520" cy="170" r="28" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <text x="520" y="178" textAnchor="middle" fontSize="18" fill="white" opacity="0.95">DJ</text>

        <circle cx="520" cy="260" r="28" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <text x="520" y="268" textAnchor="middle" fontSize="18" fill="white" opacity="0.95">JS</text>

        <circle cx="680" cy="170" r="28" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <text x="680" y="178" textAnchor="middle" fontSize="18" fill="white" opacity="0.95">R</text>

        <circle cx="680" cy="380" r="28" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <text x="680" y="388" textAnchor="middle" fontSize="18" fill="white" opacity="0.95">CSS</text>
      </g>
    </svg>
  );
}

/* -------------------- HERO (your hero + added structure) -------------------- */
export default function HeroCircuit() {
  const [skill, setSkill] = useState("Tensor Flow");
  const [level, setLevel] = useState(8);

  return (
    <section id="hero" className="relative overflow-hidden bg-black text-white">
      {/* Circuit overlay */}
      <div className="absolute inset-0 opacity-70">
        <CircuitBG />
      </div>

      {/* glow blobs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-500/25 blur-[160px]" />
      <div className="absolute -bottom-52 -right-52 w-[650px] h-[650px] rounded-full bg-pink-500/20 blur-[170px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4  pt-25  md:pt-2 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-14">
          
          {/* LEFT: Text */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
              <span className="block text-white">Building</span>
              <span className="block bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Digital
              </span>
              <span className="block text-white">Solutions</span>
            </h1>

            <p className="mt-6 sm:mt-8 max-w-xl mx-auto md:mx-0 text-base sm:text-lg leading-7 sm:leading-8 text-white/70">
              Full-stack developer specializing in modern web technologies. I create scalable
              applications with clean code and exceptional user experiences using React, Node.js,
              and cloud platforms.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:justify-center md:justify-start">
              <a className="w-full sm:w-[240px] md:w-[280px] rounded-xl py-4 font-semibold text-black bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30" href="#project">
                View Projects
              </a>

              <button className="w-full sm:w-[240px] md:w-[280px] rounded-xl py-4 font-semibold text-white border border-orange-400/40 hover:bg-white/5 transition">
                Get In Touch
              </button>
            </div>
          </div>

          {/* RIGHT: Hero Image */}
          <div className="relative left-[1px] lg:left-[100px]">

  {/* ⚡ Electric glow behind the image */}
  

  {/* ⚡ Lightning flicker overlay */}
  
  {/* 🧠 Brain IMAGE */}
  <div
    className="
      relative hidden md:block
      md:w-[420px] md:h-[420px]
      lg:w-[620px] lg:h-[720px]
      drop-shadow-[0_30px_80px_rgba(0,0,0,0.65)]
    "
    style={{
      backgroundImage: "url('/heroicon.png')", // <-- your brain image
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  />
</div>


        </div>
      </div>
    </section>
  );
}

