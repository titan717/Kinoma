import React, { useState } from 'react';
import { Link } from 'wouter';
import { ChevronDown, Play, Sparkles, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import { KinomaLogo } from '../components/ui/KinomaLogo';

const ARTWORK_URL =
  'https://cdn.dribbble.com/userupload/15472332/file/original-a48b48c6977115c7185f2857575dac09.png?resize=1200x900&vertical=center';
const BACKDROP_URL = 'https://aniwaves.ru/assets/images/bg-index2.jpg';
const REFERENCE_TEXTURE_URL =
  'https://cdn.dribbble.com/userupload/14005335/file/original-d6adb157992d0492ed2fc3b2ab46cef9.jpg?resize=1200x1200&vertical=center';

const FAQ = [
  {
    question: 'What is Kinoma?',
    answer:
      'Kinoma is a streaming experience for anime, movies and series, built around fast discovery, beautiful artwork and a simple path from finding a title to pressing play.',
  },
  {
    question: 'Do I need an account to browse?',
    answer:
      'No. You can enter Kinoma and explore the catalog without signing in. An account is used for features such as your personal library and viewing progress.',
  },
  {
    question: 'Does Kinoma support movies and series too?',
    answer:
      'Yes. The interface is designed around content rather than a single format, so anime, movies and series can share the same discovery experience.',
  },
  {
    question: 'Can I use Kinoma on a TV?',
    answer:
      'Yes. Kinoma is being designed around the same visual language across web and TV, with layouts and controls that remain comfortable on a large screen.',
  },
];

function CartoonButton({
  children,
  href,
  secondary = false,
}: {
  children: React.ReactNode;
  href: string;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`kinoma-cartoon-button ${secondary ? 'kinoma-cartoon-button--secondary' : ''}`}
    >
      <span className="kinoma-cartoon-button__face">
        {children}
      </span>
      <span className="kinoma-cartoon-button__shadow" aria-hidden="true" />
    </Link>
  );
}

export function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="kinoma-welcome">
      <div
        className="kinoma-welcome__backdrop"
        style={{ backgroundImage: `url("${BACKDROP_URL}")` }}
      />
      <div
        className="kinoma-welcome__reference-texture"
        style={{ backgroundImage: `url("${REFERENCE_TEXTURE_URL}")` }}
      />
      <div className="kinoma-welcome__grain" aria-hidden="true" />

      <header className="kinoma-welcome__header">
        <Link href="/" aria-label="Kinoma">
          <KinomaLogo size="md" variant="full" />
        </Link>
        <span className="kinoma-welcome__header-label">ANIME · MOVIES · SERIES</span>
      </header>

      <main>
        <section className="kinoma-welcome__hero">
          <div className="kinoma-welcome__art">
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="kinoma-welcome__art-frame"
            >
              <div className="kinoma-welcome__art-glow" />
              <img
                src={ARTWORK_URL}
                alt="Anime artwork"
                referrerPolicy="no-referrer"
              />
              <div className="kinoma-welcome__art-vignette" />
              <div className="kinoma-welcome__art-caption">
                <span>WELCOME TO</span>
                <strong>KINOMA</strong>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="kinoma-welcome__copy"
          >
            <p className="kinoma-welcome__eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              YOUR NEXT STORY STARTS HERE
            </p>

            <h1>
              Find something
              <span>worth watching.</span>
            </h1>

            <p className="kinoma-welcome__description">
              A beautiful home for the stories you love. Discover anime, movies and
              series without getting in the way of the experience.
            </p>

            <div className="kinoma-welcome__actions">
              <CartoonButton href="/browse">
                <Play className="h-4 w-4 fill-current" />
                Go to homepage
              </CartoonButton>
              <a href="#questions" className="kinoma-welcome__scroll-link">
                Common questions
                <ChevronDown className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        </section>

        <section className="kinoma-welcome__intro-strip">
          <div>
            <span>01</span>
            <p>Discover</p>
          </div>
          <div>
            <span>02</span>
            <p>Choose</p>
          </div>
          <div>
            <span>03</span>
            <p>Press play</p>
          </div>
          <div className="kinoma-welcome__intro-line" />
        </section>

        <section id="questions" className="kinoma-welcome__faq">
          <div className="kinoma-welcome__faq-heading">
            <p>BEFORE YOU ENTER</p>
            <h2>A few quick answers.</h2>
            <span>Scroll through the essentials, then step into Kinoma.</span>
          </div>

          <div className="kinoma-welcome__faq-list">
            {FAQ.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <button
                  key={item.question}
                  type="button"
                  className={`kinoma-welcome__faq-item ${isOpen ? 'is-open' : ''}`}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="kinoma-welcome__faq-number">
                    0{index + 1}
                  </span>
                  <span className="kinoma-welcome__faq-content">
                    <strong>{item.question}</strong>
                    <span className="kinoma-welcome__faq-answer">{item.answer}</span>
                  </span>
                  <ChevronDown className="kinoma-welcome__faq-chevron" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="kinoma-welcome__final">
          <p>READY?</p>
          <h2>Let's watch something.</h2>
          <CartoonButton href="/browse">
            <Play className="h-4 w-4 fill-current" />
            Enter Kinoma
          </CartoonButton>
        </section>
      </main>

      <footer className="kinoma-welcome__footer">
        <KinomaLogo size="sm" variant="full" />
        <span>Stories worth staying for.</span>
        <a href="#questions" aria-label="Back to questions">
          <ArrowDown className="h-3.5 w-3.5" />
        </a>
      </footer>
    </div>
  );
}
