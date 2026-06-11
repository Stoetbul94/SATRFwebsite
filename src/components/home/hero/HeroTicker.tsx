'use client';

import { usePrefersReducedMotion } from '@chakra-ui/react';
import styles from './hero.module.css';

const TICKER_ITEMS = [
  { text: 'GAUTENG OPEN', suffix: ' — FINALS RANGE, 14 JUN', gold: false },
  { text: 'PROTEA TRIALS', suffix: ' — BLOEMFONTEIN, 02 AUG', gold: true },
  { text: 'NATIONAL RANKING R3', suffix: ' — 50M PRONE / 300M', gold: false },
  { text: 'BEGINNER INTRO DAYS', suffix: ' — EVERY PROVINCE, MONTHLY', gold: false },
  { text: 'JUNIOR DEVELOPMENT CAMP', suffix: ' — NORTH WEST, JUL', gold: false },
  { text: 'LA28 OLYMPIC CYCLE', suffix: ' — SQUAD ANNOUNCEMENTS SEP', gold: true },
];

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
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

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
