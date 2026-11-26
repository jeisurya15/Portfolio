import { useEffect } from 'react';
import { Footer, Header } from './components/Chrome.jsx';
import { Finale } from './components/Finale.jsx';
import { Hero } from './components/Hero.jsx';
import { Journey } from './components/Journey.jsx';
import { Projects } from './components/Projects.jsx';
import { Stack } from './components/Stack.jsx';
import { useReducedMotion } from './hooks/useReducedMotion.js';
import { startScroll } from './lib/scroll.js';

export default function App() {
  const reduced = useReducedMotion();
  useEffect(() => startScroll(reduced), [reduced]);

  return (
    <>
      <Header />
      <main>
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
