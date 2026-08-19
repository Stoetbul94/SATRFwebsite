'use client';

import { usePrefersReducedMotion } from '@chakra-ui/react';
import styles from './hero.module.css';

/** Evergreen federation topics — not live event names. */
export const EVERGREEN_TICKER_ITEMS = [
  { text: 'TARGET RIFLE', suffix: '', gold: false },
  { text: 'PRONE', suffix: '', gold: false },
  { text: '3-POSITION', suffix: '', gold: false },
  { text: 'F-CLASS', suffix: '', gold: true },
  { text: 'EVENTS', suffix: '', gold: false },
  { text: 'SCORES', suffix: '', gold: false },
  { text: 'COACHING', suffix: '', gold: true },
] as const;

function TickerItem({
  text,
  suffix,
  gold,
}: {
  text: string;
  suffix: string;
  gold: boolean;
}) {
  return (
    <span>
      {gold ? <span className={styles.tickerGold}>{text}</span> : <b>{text}</b>}
      {suffix}
    </span>
  );
}

export default function HeroTicker() {
  const reduceMotion = usePrefersReducedMotion();
  const items = [...EVERGREEN_TICKER_ITEMS, ...EVERGREEN_TICKER_ITEMS];

  return (
    <div className={styles.ticker} aria-hidden>
      <div
        className={`${styles.tickerTrack} ${reduceMotion ? styles.tickerStatic : ''}`}
      >
        {items.map((item, i) => (
          <TickerItem key={`${item.text}-${i}`} {...item} />
        ))}
      </div>
    </div>
  );
}
