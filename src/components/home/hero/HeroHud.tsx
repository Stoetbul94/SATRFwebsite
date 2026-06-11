'use client';

import { useHeroScene } from './HeroSceneContext';
import styles from './hero.module.css';

export default function HeroHud() {
  const {
    phaseLive,
    phaseInfo,
    lastScore,
    isTenPlus,
    shots,
    hint,
    hintHidden,
    isTargetMode,
    flashAt,
  } = useHeroScene();

  return (
    <>
      <div className={styles.monitorHead}>
        <span className={isTargetMode ? styles.monitorLive : undefined}>{phaseLive}</span>
        <span>{phaseInfo}</span>
      </div>

      <div
        className={`${styles.flash} ${flashAt ? styles.flashGo : ''}`}
        style={
          flashAt
            ? {
                background: `radial-gradient(circle at ${flashAt.x} ${flashAt.y}, rgba(232,188,79,.3), transparent 24%)`,
              }
            : undefined
        }
      />

      <div className={`${styles.scoreboard} ${!isTargetMode ? styles.uiDim : ''}`}>
        <div className={styles.scoreLabel}>Last shot</div>
        <div className={`${styles.scoreValue} ${isTenPlus ? styles.scoreTen : ''}`}>
          {lastScore}
        </div>
      </div>

      <div className={`${styles.series} ${!isTargetMode ? styles.uiDim : ''}`} aria-live="polite">
        {shots.map((shot) => (
          <span key={shot.id}>
            SHOT {String(shot.id).padStart(2, '0')} · <b>{shot.score.toFixed(1)}</b>
          </span>
        ))}
      </div>

      <div className={`${styles.hint} ${hintHidden ? styles.hintHidden : ''}`}>{hint}</div>
    </>
  );
}
