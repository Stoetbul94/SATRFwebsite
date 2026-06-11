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
    lastShotAt,
    reduceMotion,
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
        <div
          key={reduceMotion ? 'score-static' : lastShotAt}
          className={`${styles.scoreValue} ${isTenPlus ? styles.scoreTen : ''} ${
            !reduceMotion && lastShotAt > 0 ? styles.scorePop : ''
          }`}
        >
          {lastScore}
        </div>
      </div>

      <div className={`${styles.series} ${!isTargetMode ? styles.uiDim : ''}`} aria-live="polite">
        {shots.map((shot, i) => (
          <span
            key={i === shots.length - 1 && !reduceMotion ? `${shot.id}-${lastShotAt}` : shot.id}
            className={
              !reduceMotion && i === shots.length - 1 && lastShotAt > 0
                ? styles.seriesItemEnter
                : undefined
            }
          >
            SHOT {String(shot.id).padStart(2, '0')} · <b>{shot.score.toFixed(1)}</b>
          </span>
        ))}
      </div>

      <div className={`${styles.hint} ${hintHidden ? styles.hintHidden : ''}`}>{hint}</div>
    </>
  );
}
