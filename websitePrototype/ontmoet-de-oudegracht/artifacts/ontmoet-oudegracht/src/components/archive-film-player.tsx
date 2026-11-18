import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { CircleHelp, Film, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

const mediaBase = `${import.meta.env.BASE_URL}api/storage/public-objects/`;
const labels = {
  nl: {
    tag: 'AANGELEVERDE FILM', title: 'De Oudegracht',
    play: 'Afspelen', pause: 'Pauzeren', back: '10 seconden terug', forward: '10 seconden vooruit',
    sound: 'Geluid aan', muted: 'Geluid uit', mute: 'Geluid uitschakelen', unmute: 'Geluid inschakelen',
    seek: 'Kies een moment in de film', of: 'van', minutes: 'minuten', seconds: 'seconden',
    loading: 'Video laden…', buffering: 'Even wachten, de video wordt geladen…',
    failed: 'De video kon niet worden geladen. Controleer de verbinding en probeer het opnieuw.',
    playFailed: 'Afspelen is niet gelukt. Probeer het opnieuw met de afspeelknop.',
    retry: 'Opnieuw laden',
    pending: 'Kies de aangeleverde film om verder te kijken.',
    note: 'Aangeleverd videobestand. Bronvermelding, datering en gebruiksrechten zijn nog niet gecontroleerd. Ondertiteling, tekstversie en audiodescriptie zijn nog niet toegevoegd. De kaart is nog niet aan deze film gekoppeld.',
  },
  en: {
    tag: 'SUPPLIED FILM', title: 'The Oudegracht',
    play: 'Play', pause: 'Pause', back: 'Back 10 seconds', forward: 'Forward 10 seconds',
    sound: 'Sound on', muted: 'Sound off', mute: 'Mute sound', unmute: 'Unmute sound',
    seek: 'Choose a moment in the film', of: 'of', minutes: 'minutes', seconds: 'seconds',
    loading: 'Loading video…', buffering: 'Please wait, the video is loading…',
    failed: 'The video could not be loaded. Check your connection and try again.',
    playFailed: 'Playback did not start. Please try the play button again.',
    retry: 'Reload video',
    pending: 'Select the supplied film to continue watching.',
    note: 'Supplied video file. Source credit, date and usage rights have not yet been verified. Captions, a transcript and audio description have not yet been added. The map is not linked to this film yet.',
  },
};

function time(value: number) {
  const whole = Math.max(0, Math.floor(value));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function ArchiveFilmPlayer({ language, unavailable }: { language: 'nl' | 'en'; unavailable: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playFailed, setPlayFailed] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const t = labels[language];
  const disabled = unavailable || failed || !duration;

  useEffect(() => {
    if (unavailable) videoRef.current?.pause();
  }, [unavailable]);

  function seek(next: number) {
    const video = videoRef.current;
    if (!video || disabled) return;
    video.currentTime = Math.max(0, Math.min(duration, next));
    setSeconds(video.currentTime);
  }

  async function togglePlay() {
    const video = videoRef.current;
    if (!video || disabled) return;
    setPlayFailed(false);
    if (!video.paused) {
      video.pause();
      return;
    }
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (!video.paused || unavailable) return;
      setPlayFailed(true);
    }
  }

  function retry() {
    setFailed(false);
    setPlayFailed(false);
    setBuffering(false);
    setDuration(0);
    setSeconds(0);
    videoRef.current?.load();
  }

  const spokenTime = (value: number) => `${Math.floor(value / 60)} ${t.minutes} ${Math.floor(value % 60)} ${t.seconds}`;

  return <section className="film-column" aria-labelledby="archive-film-title">
    <div className="panel-heading film-heading">
      <div><p className="eyebrow eyebrow-light">{t.tag}</p><h2 id="archive-film-title">{t.title}</h2></div>
      <span className="film-duration"><Film size={17} aria-hidden="true" />{duration ? time(Math.ceil(duration)) : '—:—'}</span>
    </div>
    <div className="archive-film-frame">
      <video ref={videoRef} data-testid="archive-video" playsInline preload="metadata"
        poster={`${mediaBase}oudegracht-poster-v1.jpg`}
        aria-label={t.title} aria-describedby="archive-film-note"
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setDuration(value);
        }}
        onTimeUpdate={(event) => setSeconds(event.currentTarget.currentTime)}
        onPlay={() => { setPlaying(true); setPlayFailed(false); }}
        onPlaying={() => setBuffering(false)}
        onWaiting={() => setBuffering(true)}
        onPause={() => { setPlaying(false); setBuffering(false); }}
        onEnded={() => { setPlaying(false); setBuffering(false); }}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        onError={() => { setFailed(true); setPlaying(false); setBuffering(false); }}>
        <source src={`${mediaBase}oudegracht-film-v1.mp4`} type="video/mp4" />
      </video>
    </div>
    <div className="player">
      <div className="seek-row">
        <span className="timecode">{time(seconds)}</span>
        <input data-testid="input-film-seek" className="custom-range" type="range" min="0"
          max={duration || 0} step="1" value={Math.min(seconds, duration)} disabled={disabled}
          aria-label={t.seek} aria-describedby="archive-film-note"
          aria-valuetext={`${spokenTime(seconds)} ${t.of} ${spokenTime(Math.ceil(duration))}`}
          style={{ '--progress': `${duration ? seconds / duration * 100 : 0}%` } as CSSProperties}
          onChange={(event) => seek(Number(event.target.value))} />
        <span className="timecode">{duration ? time(Math.ceil(duration)) : '—:—'}</span>
      </div>
      <div className="player-actions">
        <div className="transport">
          <button data-testid="button-back-10" onClick={() => seek((videoRef.current?.currentTime ?? 0) - 10)}
            aria-label={t.back} className="transport-button" disabled={disabled}><SkipBack size={21} /></button>
          <button data-testid="button-play-pause" onClick={togglePlay} aria-label={playing ? t.pause : t.play}
            className="play-button" disabled={disabled}>{playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}</button>
          <button data-testid="button-forward-10" onClick={() => seek((videoRef.current?.currentTime ?? 0) + 10)}
            aria-label={t.forward} className="transport-button" disabled={disabled}><SkipForward size={21} /></button>
        </div>
        <button data-testid="button-mute" onClick={() => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; }}
          aria-pressed={muted} aria-label={muted ? t.unmute : t.mute}
          className="sound-button" disabled={disabled}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}<span>{muted ? t.muted : t.sound}</span></button>
      </div>
      <div className="video-status" role="status" aria-live="polite">
        {failed ? <><p>{t.failed}</p><button className="video-retry" onClick={retry}>{t.retry}</button></>
          : playFailed ? t.playFailed
            : unavailable ? t.pending : !duration ? t.loading : buffering ? t.buffering : null}
      </div>
    </div>
    <div className="demo-note" id="archive-film-note"><CircleHelp size={19} aria-hidden="true" /><p>{t.note}</p></div>
  </section>;
}
