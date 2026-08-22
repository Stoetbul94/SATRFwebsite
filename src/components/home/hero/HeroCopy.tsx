'use client';

import Link from 'next/link';
import styles from './hero.module.css';

export default function HeroCopy() {
  return (
    <div className={styles.heroCopy}>
      <span className={`${styles.eyebrow} ${styles.reveal} ${styles.revealD1}`}>
        <span className={styles.eyebrowDot} aria-hidden />
        SASSCo Affiliate · Target Rifle Development
      </span>

      <h1 className={`${styles.h1} ${styles.reveal} ${styles.revealD2}`}>
        The home of competitive target rifle shooting in{' '}
        <span className={styles.gold}>South&nbsp;Africa</span>
      </h1>

      <p className={`${styles.lede} ${styles.reveal} ${styles.revealD3}`}>
        <strong>SATRF</strong> develops the sport from first shot to final: beginner-friendly{' '}
        <Link href="/coaching">coaching</Link> and development resources, ISSF-style 50&nbsp;m rifle
        disciplines alongside SATRF F-Class competition, and rankings that support athletes
        pursuing national and international competition goals.
      </p>

      <div className={`${styles.ctaRow} ${styles.reveal} ${styles.revealD4}`}>
        <Link href="/register" className={styles.btnPrimary}>
          Create an account
        </Link>
        <Link href="/coaching" className={styles.btnGhost}>
          Learn to shoot
        </Link>
      </div>
    </div>
  );
}
