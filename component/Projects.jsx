'use client';

import React, { useState } from 'react';

/**
 * ProjectsSection (Tailwind CSS)
 *
 * - Glassy / blur background built with Tailwind utilities (bg-white/5, backdrop-blur)
 * - Responsive grid (1 / 2 / 3 columns)
 * - Click a card to open a modal with details
 *
 * Requirements:
 * - Tailwind CSS in your project (v2.2+ recommended; v3+ includes backdrop utilities)
 * - No external dependencies
 *
 * Usage:
 * import ProjectsSection from '@/components/ProjectsSection';
 * <ProjectsSection />
 *
 * Replace sampleProjects with your real data or pass as a prop.
 */

// Updated projects: long descriptions start with the title, short descriptions derived,
// and array sorted alphabetically by title (A → Z).

const sampleProjects = [
  {
    id: 'p3',
    title: 'Bookmanagement',
    short: 'Local book-sharing web app connecting readers nearby.',
    long: 'Bookmanagement — a web app to share books based on locality. Users can list books, discover nearby titles, request to borrow or swap, and message owners. Built with Socket.io and Express for realtime notifications and chat.',
    tech: ['Socket.io', 'Express'],
    image: '/p3.png',
    code: 'https://github.com/relladinesh/booknest',
  },
  {
    id: 'p1',
    title: 'Eris Ecommerce',
    short: 'E-commerce site for sound apps and assets (freelance project).',
    long: 'Eris Ecommerce — an e-commerce website for sound applications, plugins and audio assets. Built with Next.js, Tailwind CSS and a Node + Mongo backend. Features product listings, image optimization, checkout and order persistence; delivered as a freelance project.',
    tech: ['Next.js', 'Tailwind', 'MongoDB'],
    image: '/p2.png',
    code: 'https://github.com/relladinesh/eristech',
  },
  {
    id: 'p2',
    title: 'Quick Hop',
    short: 'Ride-hailing app (Uber-style) with booking and live driver tracking.',
    long: 'Quick Hop — an Uber-like ride-hailing app providing booking, live driver tracking, ride history and fare payments. Built with React and Node, integrates Stripe for payments and includes an admin dashboard for management.',
    tech: ['React', 'Node', ],
    image: '/p1.png',
    code: 'https://github.com/relladinesh/QuickHop',
  },
];



export default function ProjectsSection({ projects = sampleProjects, backgroundImage = '' }) {
  const [openId, setOpenId] = useState(null);

  const openProject = (id) => setOpenId(id);
  const closeProject = () => setOpenId(null);

  const project = projects.find((p) => p.id === openId) || null;

  return (
    <>
      <section className="relative py-12 px-4 sm:px-6 lg:px-8" id="project">
        {/* Background decorative glass layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.35,
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Projects</h2>
            <p className="mt-2 text-lg text-slate-300 max-w-2xl mx-auto">Selected works — click a card to view details.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <article
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => openProject(p.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') openProject(p.id); }}
                className="group cursor-pointer transform-gpu hover:-translate-y-2 transition duration-200 rounded-2xl overflow-hidden
                  bg-white/6 border border-white/8 backdrop-blur-md shadow-lg"
              >
                <div
                  className="h-44 bg-center bg-cover"
                  style={{ backgroundImage: `url(${p.image})` }}
                  aria-hidden="true"
                />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{p.short}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      {p.tech.slice(0, 3).map((t) => (
                        <span key={t} className="text-xs text-slate-100 bg-white/5 px-2 py-1 rounded-md border border-white/6">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-slate-300 group-hover:text-white">View →</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Glass overlay bottom subtle blur */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      </section>

      {/* Modal (project detail) */}
      {project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeProject}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-title"
            className="relative z-10 max-w-4xl w-full mx-4 sm:mx-6 bg-white/6 border border-white/8 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 h-56 lg:h-auto bg-center bg-cover" style={{ backgroundImage: `url(${project.image})` }} />
              <div className="p-6 lg:w-1/2">
                <h3 id="project-title" className="text-2xl font-bold text-white">{project.title}</h3>
                <p className="mt-3 text-sm text-slate-200">{project.long}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span key={t} className="text-xs text-slate-100 bg-white/5 px-2 py-1 rounded-md border border-white/6">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  {project.live && (
                    <a href={project.live} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-to-r from-amber-400 to-pink-400 text-black font-semibold">
                      View Live
                    </a>
                  )}
                  {project.code && (
                    <a href={project.code} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 rounded-md border border-white/8 text-white">
                      Source
                    </a>
                  )}
                  <button onClick={closeProject} className="ml-auto text-sm text-slate-300 underline">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}