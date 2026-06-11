'use client';

import { heroFontVariables } from './heroFonts';
import HeroCopy from './HeroCopy';
import HeroTicker from './HeroTicker';
import SatrfHero3DStage from './SatrfHero3DStage';
import styles from './hero.module.css';

export default function SatrfHero() {
  return (
    <header className={`${styles.heroRoot} ${heroFontVariables}`}>
      <div className={styles.rangeFloor} aria-hidden />
      <div className={styles.heroGrid}>
        <HeroCopy />
        <div className={styles.heroStageCol}>
          <SatrfHero3DStage />
        </div>
      </div>
      <HeroTicker />
    </header>
  );
}
