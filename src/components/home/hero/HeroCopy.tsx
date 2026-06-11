'use client';

import Link from 'next/link';
import styles from './hero.module.css';

export default function HeroCopy() {
  return (
    <div className={styles.heroCopy}>
      <span className={`${styles.eyebrow} ${styles.reveal} ${styles.revealD1}`}>
        <span className={styles.eyebrowDot} aria-hidden />
        ISSF Affiliated · Olympic Pathway
      </span>

      <h1 className={`${styles.h1} ${styles.reveal} ${styles.revealD2}`}>
        The home of ISSF target rifle shooting in{' '}
        <span className={styles.gold}>South&nbsp;Africa</span>
      </h1>

      <p className={`${styles.lede} ${styles.reveal} ${styles.revealD3}`}>
        <strong>SATRF</strong> develops the sport from first shot to final: beginner-friendly{' '}
        <Link href="/coaching">coaching</Link> for new shooters, smallbore, prone and 300&nbsp;m
        rifle clubs in every province, and the national competitions and rankings that carry South
        African athletes to the Olympic Games.
      </p>

      <div className={`${styles.ctaRow} ${styles.reveal} ${styles.revealD4}`}>
        <Link href="/register" className={styles.btnPrimary}>
          Become a member
        </Link>
        <Link href="/coaching" className={styles.btnGhost}>
          Learn to shoot
        </Link>
      </div>
    </div>
  );
}
