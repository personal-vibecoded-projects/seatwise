import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import type { Health } from '../../../packages/contracts/src/index.js';
import './style.css';
const client = new QueryClient();
async function readiness(): Promise<Health> {
  const response = await fetch('/api/v1/health/ready');
  if (!response.ok) throw new Error('The service is unavailable.');
  return response.json() as Promise<Health>;
}
function Welcome() {
  const health = useQuery({
    queryKey: ['readiness'],
    queryFn: readiness,
    retry: 1,
    refetchInterval: 15000,
  });
  return (
    <>
      <header>
        <a className="brand" href="/" aria-label="SeatWise home">
          <span className="brand-icon" aria-hidden="true">
            s.
          </span>
          seatwise<span className="brand-dot">®</span>
        </a>
        <span className="header-note">A little space. A better workday.</span>
        <span className="edition">
          DEVELOPMENT EDITION <span aria-hidden="true">↗</span>
        </span>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> SPACE TO DO YOUR BEST WORK
            </p>
            <h1>
              Good work
              <br />
              starts with
              <br />
              <em>the right space.</em>
            </h1>
            <p className="intro">
              A quiet desk for deep focus. A room for your next big idea. Your
              workday, with a little more room to breathe.
            </p>
            <a className="primary" href="#project-status">
              Explore SeatWise <span aria-hidden="true">↗</span>
            </a>
            <p className="fine-print">
              Thoughtfully built for shared workplaces.
            </p>
          </div>
          <div
            className="scene"
            role="img"
            aria-label="Illustration of a sunlit coworking desk with a plant and a chair"
          >
            <span className="scene-caption">MAKE YOURSELF AT HOME</span>
            <div className="window">
              <div />
              <div />
              <div />
              <div />
            </div>
            <div className="sunbeam" />
            <div className="desk">
              <div className="laptop" />
              <div className="cup" />
              <div className="desk-leg left" />
              <div className="desk-leg right" />
            </div>
            <div className="chair">
              <div className="chair-back" />
              <div className="chair-seat" />
              <div className="chair-leg" />
            </div>
            <div className="plant">
              <i />
              <i />
              <i />
              <div className="stem" />
              <div className="pot" />
            </div>
            <div className="scene-badge">
              <span className="badge-icon" aria-hidden="true">
                ✳
              </span>
              <div>
                A place for every kind of day.
                <small>ROOMS · DESKS · POSSIBILITIES</small>
              </div>
            </div>
            <span className="scene-number">01 / A FRESH START</span>
          </div>
        </section>
        <section
          id="project-status"
          className="status-section"
          aria-labelledby="status-heading"
        >
          <div>
            <p className="eyebrow">THE FIRST CHAPTER</p>
            <h2 id="status-heading">The foundation is in place.</h2>
            <p>
              We’re building a simpler way to share your workspace.
              Reservations, calendars, and member access are coming in the next
              chapters.
            </p>
          </div>
          <aside className="status-card">
            <span className="status-label">SERVICE STATUS</span>
            <p role="status" aria-live="polite">
              <span
                className={`status-dot ${health.isSuccess ? 'ready' : ''}`}
              />
              {health.isPending
                ? 'Connecting…'
                : health.isError
                  ? 'Service unavailable'
                  : 'Connected and ready'}
            </p>
            <small>
              {health.isError
                ? 'Please try again in a moment.'
                : 'Web → API → PostgreSQL'}
            </small>
            {health.isError && (
              <button
                onClick={() => {
                  void health.refetch();
                }}
                disabled={health.isFetching}
              >
                Try again
              </button>
            )}
          </aside>
        </section>
      </main>
      <footer>
        <span>seatwise</span>
        <p>Make room for good work.</p>
        <small>FOUNDATION / 01</small>
      </footer>
    </>
  );
}
function NotFound() {
  return (
    <main className="not-found">
      <h1>Page not found.</h1>
      <a href="/">Return to SeatWise</a>
    </main>
  );
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
