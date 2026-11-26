import { useEffect } from 'react';
import { Footer, Header } from './components/Chrome.jsx';
import { Finale } from './components/Finale.jsx';
import { Hero } from './components/Hero.jsx';
import { Intro } from './components/Intro.jsx';
import { Journey } from './components/Journey.jsx';
import { Projects } from './components/Projects.jsx';
import { Stack } from './components/Stack.jsx';
import { useReducedMotion } from './hooks/useReducedMotion.js';
import { useReveals } from './hooks/useReveals.js';
import { startScroll } from './lib/scroll.js';

export default function App() {
  const reduced = useReducedMotion();
  useEffect(() => startScroll(reduced), [reduced]);
  // One observer for every [data-reveal] on the page.
  const mainRef = useReveals();

  return (
    <>
      <Intro />
      <Header />
      <main ref={mainRef}>
        <Hero />
        <Projects />
        <Journey />
        <Stack />
        <Finale />
      </main>
      <Footer />
    </>
  );
}
