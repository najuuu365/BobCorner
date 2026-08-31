import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Settings2,
  Heart,
  Battery,
  Sparkles,
  Utensils,
  Volume2,
  VolumeX,
  Gift,
  RotateCcw,
  Eye,
  Star,
  X,
} from 'lucide-react';

import { companionApi } from '../../services/companionApi';
import { Companion } from '../../types';
import { useToast } from '../../context/ToastContext';

interface MascotProps {
  currentContext?: string;
}

type Activity =
  | 'idle'
  | 'looking'
  | 'happy'
  | 'sleeping'
  | 'focused'
  | 'celebrating'
  | 'excited'
  | 'hungry'
  | 'surprised'
  | 'playing'
  | 'love'
  | 'tired'
  | 'sad';

export type NoriEventType =
  | 'TASK_COMPLETED'
  | 'TASK_CREATED'
  | 'TASK_DELETED'
  | 'FOCUS_STARTED'
  | 'FOCUS_COMPLETED'
  | 'DAILY_GOAL_COMPLETED'
  | 'STREAK_INCREASED'
  | 'LEVEL_UP'
  | 'REWARD_EARNED'
  | 'COINS_EARNED'
  | 'GAME_WON'
  | 'GAME_LOST'
  | 'GARDEN_ACTION'
  | 'USER_RETURNED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'SITE_INTERACTION';

export interface NoriEvent {
  type: NoriEventType;
  message?: string;
}

declare global {
  interface WindowEventMap {
    'nori-event': CustomEvent<NoriEvent>;
  }
}

interface NoriMemory {
  interactions: number;
  pets: number;
  plays: number;
  feeds: number;
  rests: number;
  celebrations: number;
  focusSessions: number;
  idleReactions: number;
  lastInteraction: number;
  favoriteAction: string;
}

interface NoriLife {
  energy: number;
  happiness: number;
  hunger: number;
  bond: number;
  xp: number;
  level: number;
  activity: Activity;
  lastInteraction: number;
  lastUpdate: number;
  sleepingUntil: number | null;
  memory: NoriMemory;
}

interface Position {
  x: number;
  y: number;
}

type BoxDirection =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

const LIFE_KEY = 'nori-life-v6';
const POS_KEY = 'nori-position-v6';
const SOUND_KEY = 'nori-sound-v1';

const NORI_SIZE = 96;
const SCREEN_PADDING = 12;
const BOX_WIDTH = 300;

const IMAGES: Record<Activity, string> = {
  idle: '/nori-idle.png',
  looking: '/nori-looking.png',
  happy: '/nori-happy.png',
  sleeping: '/nori-sleeping.png',
  focused: '/nori-focus.png',
  celebrating: '/nori-celebrating.png',
  excited: '/nori-excited.png',
  hungry: '/nori-hungry.png',
  surprised: '/nori-surprised.png',
  playing: '/nori-playing.png',
  love: '/nori-love.png',
  tired: '/nori-tired.png',
  sad: '/nori-sad.png',
};

const ACCESSORY_EMOJIS: Record<string, string> = {
  none: '',
  party_hat: '🎩',
  glasses: '👓',
  flower: '🌸',
  scarf: '🧣',
  crown: '👑',
};

const ACCESSORY_NAMES: Record<string, string> = {
  none: 'Natural',
  party_hat: 'Party Hat',
  glasses: 'Glasses',
  flower: 'Flower',
  scarf: 'Scarf',
  crown: 'Crown',
};

const IDLE_MESSAGES = [
  'I locked my key in the cupboard, can you help?',
  'tiny thoughts happening.',
  'I wonder what you are doing hmmmmmm',
  'still here? you\'re doing a gooooood joobbbbbbbb 💛',
  'Will you unlock this cell?? I won\'t do anything',
  'I was thinking about snackssss.',
  'I like being here with youuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu.',
  'I have been supervising O_O .',
  'nothing suspicious is happening ;).',
  'I am extremely busy doing nothinggg, relatable?.',
];

const HAPPY_MESSAGES = [
  'hieeeeeeeeeeeeeee!!',
  'oh! hello Mark!',
  'you punched meeeeeee! jk',
  'habbbbb a greatttt dayyyyy sunshineeeeee.',
  'you remembered me!',
  'Kinderr Joysss for youuu',
  'You shall not',
  'I like when you visit meeeee (Bob).',
];

const CELEBRATION_MESSAGES = [
  'Wowww, I didnt know you could do Mathsss :O',
  'look at me goooooo!!!!',
  'aggressive victory dance wee!!',
  'Celebrassoooooon toimeeeee.',
  'I am proud of youuu.',
];

const FOCUSED_MESSAGES = [
  'I will keep you company.... quietly.....',
  'Dont be distractedd',
  'we have work to do.',
  'tiny serious face.',
];

const HUNGRY_MESSAGES = [
  'I am thinking about snacks.',
  'Feed this starving you monster',
  'my stomach has opinions.',
  'Aaharam tharuuu ammeee ahhhhhhh.',
];

const CONTEXT_MESSAGES: Record<string, string[]> = {
  garden: [
    'the plants look happy, do you?',
    'please do NOT drown the plants.',
  ],
  games: [
    'are we playing something?',
    'I believe in us.',
  ],
  library: [
    'new book smell.',
    'I like it.',
  ],
  tycoon: [
    'our empire is getting suspiciously large.',
    'excellent business decision.',
  ],
  today: [
    'one little thing at a time.',
  ],
};

const randomItem = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const clamp = (
  value: number,
  min: number,
  max: number
) => Math.max(min, Math.min(max, value));

const xpForLevel = (level: number) =>
  50 + (level - 1) * 35;

const getDefaultPosition = (): Position => ({
  x: Math.max(
    SCREEN_PADDING,
    window.innerWidth - NORI_SIZE - 24
  ),
  y: Math.max(
    SCREEN_PADDING,
    window.innerHeight - NORI_SIZE - 24
  ),
});

const createDefaultMemory = (): NoriMemory => ({
  interactions: 0,
  pets: 0,
  plays: 0,
  feeds: 0,
  rests: 0,
  celebrations: 0,
  focusSessions: 0,
  idleReactions: 0,
  lastInteraction: Date.now(),
  favoriteAction: 'pet',
});

const createDefaultLife = (): NoriLife => ({
  energy: 85,
  happiness: 80,
  hunger: 80,
  bond: 0,
  xp: 0,
  level: 1,
  activity: 'idle',
  lastInteraction: Date.now(),
  lastUpdate: Date.now(),
  sleepingUntil: null,
  memory: createDefaultMemory(),
});

const loadLife = (): NoriLife => {
  try {
    const saved = localStorage.getItem(LIFE_KEY);

    if (!saved) {
      return createDefaultLife();
    }

    const parsed = JSON.parse(saved) as Partial<NoriLife>;
    const base = createDefaultLife();

    return {
      ...base,
      ...parsed,
      memory: {
        ...base.memory,
        ...(parsed.memory || {}),
      },
    };
  } catch {
    return createDefaultLife();
  }
};

const loadPosition = (): Position => {
  try {
    const saved = localStorage.getItem(POS_KEY);

    if (!saved) {
      return getDefaultPosition();
    }

    const parsed = JSON.parse(saved) as Partial<Position>;

    return {
      x:
        typeof parsed.x === 'number'
          ? parsed.x
          : getDefaultPosition().x,
      y:
        typeof parsed.y === 'number'
          ? parsed.y
          : getDefaultPosition().y,
    };
  } catch {
    return getDefaultPosition();
  }
};

const getBondLevel = (bond: number) => {
  if (bond >= 1000) return 'Soul Friends';
  if (bond >= 750) return 'Forever Friends';
  if (bond >= 500) return 'Best Friends';
  if (bond >= 250) return 'Close Friends';
  if (bond >= 100) return 'Friends';
  if (bond >= 30) return 'Getting Familiar';

  return 'New Friends';
};

const animationFor = (activity: Activity) => {
  switch (activity) {
    case 'sleeping':
      return {
        y: [0, 3, 0],
        rotate: [0, -1, 0],
        scale: [1, 0.98, 1],
      };

    case 'looking':
      return {
        x: [0, -4, 4, 0],
        rotate: [0, -4, 4, 0],
      };

    case 'happy':
      return {
        y: [0, -8, 0],
        rotate: [0, -3, 3, 0],
      };

    case 'celebrating':
      return {
        y: [0, -18, 0, -12, 0],
        rotate: [0, -8, 8, -5, 0],
        scale: [1, 1.08, 1],
      };

    case 'excited':
      return {
        y: [0, -7, 0, -5, 0],
        x: [0, -4, 4, -3, 0],
        rotate: [0, -5, 5, -4, 0],
      };

    case 'focused':
      return {
        y: [0, -2, 0],
        rotate: [0, 1, 0],
      };

    case 'sad':
      return {
        y: [0, 2, 0],
        rotate: [0, -1, 0],
        scale: [1, 0.985, 1],
      };

    case 'hungry':
      return {
        x: [0, 2, -2, 0],
        rotate: [0, -2, 2, 0],
      };

    case 'surprised':
      return {
        scale: [1, 1.12, 1],
        y: [0, -7, 0],
      };

    case 'playing':
      return {
        y: [0, -12, 0, -7, 0],
        rotate: [0, -6, 6, -4, 0],
      };

    case 'love':
      return {
        y: [0, -5, 0],
        scale: [1, 1.04, 1],
      };

    case 'tired':
      return {
        y: [0, 2, 0],
        scale: [1, 0.985, 1],
      };

    default:
      return {
        y: [0, -4, 0],
        rotate: [0, 1, -1, 0],
      };
  }
};

const durationFor = (activity: Activity) => {
  if (activity === 'celebrating') return 0.7;
  if (activity === 'playing' || activity === 'surprised') {
    return 0.9;
  }
  if (activity === 'excited') return 1;
  if (activity === 'happy') return 1.2;
  if (activity === 'looking') return 2;
  if (activity === 'sleeping') return 4;

  return 3;
};

export const triggerNori = (
  type: NoriEventType,
  message?: string
) => {
  window.dispatchEvent(
    new CustomEvent<NoriEvent>('nori-event', {
      detail: {
        type,
        message,
      },
    })
  );
};

export const Mascot: React.FC<MascotProps> = ({
  currentContext,
}) => {
  const { showToast } = useToast();
  const [isMegaNori, setIsMegaNori] = useState(false);

  const [companion, setCompanion] =
    useState<Companion | null>(null);

  const [life, setLife] =
    useState<NoriLife>(loadLife);

  const [position, setPosition] =
    useState<Position>(loadPosition);

  const [isOpen, setIsOpen] =
    useState(false);

  const [isClosetOpen, setIsClosetOpen] =
    useState(false);

  const [isDragging, setIsDragging] =
    useState(false);

  const [message, setMessage] =
    useState("oh, you're back. ☕");

  const [showMessage, setShowMessage] =
    useState(false);

  const [soundEnabled, setSoundEnabled] =
    useState(() => {
      try {
        return localStorage.getItem(SOUND_KEY) !== 'false';
      } catch {
        return true;
      }
    });

  const [sparkles, setSparkles] =
    useState(false);

  const messageTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const reactionTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const idleTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const sparkleTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastContext = useRef('');

  const lastLevel =
    useRef(life.level);

  const wasDragged =
    useRef(false);

  const imageSrc =
    IMAGES[life.activity] || IMAGES.idle;

  const bondLabel =
    getBondLevel(life.bond);

  const nextXp =
    xpForLevel(life.level);

  const levelProgress =
    Math.min(
      100,
      Math.round(
        (life.xp / nextXp) * 100
      )
    );

  const favoriteAction = useMemo(() => {
    const counts: Record<string, number> = {
      pet: life.memory.pets,
      play: life.memory.plays,
      feed: life.memory.feeds,
      rest: life.memory.rests,
      focus: life.memory.focusSessions,
    };

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'pet';
  }, [life.memory]);

  const tone = (frequency: number) => {
    if (!soundEnabled) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as any).webkitAudioContext;

      if (!AudioContextClass) return;

      const ctx =
        new AudioContextClass();

      const oscillator =
        ctx.createOscillator();

      const gain =
        ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.022;

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.08);
    } catch {}
  };

  const speak = (
    text: string,
    duration = 5000,
    frequency = 620
  ) => {
    setMessage(text);
    setShowMessage(true);
    tone(frequency);

    if (messageTimer.current) {
      clearTimeout(messageTimer.current);
    }

    messageTimer.current =
      setTimeout(() => {
        setShowMessage(false);
      }, duration);
  };

  const react = (
    activity: Activity,
    text: string,
    options?: {
      duration?: number;
      xp?: number;
      bond?: number;
      happiness?: number;
      energy?: number;
      hunger?: number;
      frequency?: number;
    }
  ) => {
    const duration =
      options?.duration ?? 4500;

    setLife((p) => {
      let xp =
        p.xp + (options?.xp ?? 0);

      let level =
        p.level;

      while (
        xp >= xpForLevel(level)
      ) {
        xp -= xpForLevel(level);
        level += 1;
      }

      return {
        ...p,
        xp,
        level,
        activity,
        bond:
          p.bond +
          (options?.bond ?? 0),
        happiness: clamp(
          p.happiness +
            (options?.happiness ?? 0),
          0,
          100
        ),
        energy: clamp(
          p.energy +
            (options?.energy ?? 0),
          0,
          100
        ),
        hunger: clamp(
          p.hunger +
            (options?.hunger ?? 0),
          0,
          100
        ),
        lastInteraction: Date.now(),
        lastUpdate: Date.now(),
        memory: {
          ...p.memory,
          interactions:
            p.memory.interactions + 1,
          lastInteraction:
            Date.now(),
        },
      };
    });

    speak(
      text,
      duration,
      options?.frequency ?? 620
    );

    if (reactionTimer.current) {
      clearTimeout(reactionTimer.current);
    }

    reactionTimer.current =
      setTimeout(() => {
        setLife((p) => ({
          ...p,
          activity:
            p.sleepingUntil &&
            Date.now() < p.sleepingUntil
              ? 'sleeping'
              : 'idle',
        }));
      }, duration);
  };

  const celebrateReaction = (
    text?: string
  ) => {
    react(
      'celebrating',
      text ||
        randomItem(
          CELEBRATION_MESSAGES
        ),
      {
        duration: 5500,
        xp: 10,
        bond: 5,
        happiness: 10,
        energy: 3,
        frequency: 820,
      }
    );

    setSparkles(true);

    if (sparkleTimer.current) {
      clearTimeout(
        sparkleTimer.current
      );
    }

    sparkleTimer.current =
      setTimeout(() => {
        setSparkles(false);
      }, 1200);
  };

  useEffect(() => {
    companionApi
      .getCompanion()
      .then((c) => {
        setCompanion(c);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(
      LIFE_KEY,
      JSON.stringify(life)
    );
  }, [life]);

  useEffect(() => {
    localStorage.setItem(
      POS_KEY,
      JSON.stringify(position)
    );
  }, [position]);

  useEffect(() => {
    localStorage.setItem(
      SOUND_KEY,
      String(soundEnabled)
    );
  }, [soundEnabled]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => ({
        x: clamp(
          current.x,
          SCREEN_PADDING,
          Math.max(
            SCREEN_PADDING,
            window.innerWidth -
              NORI_SIZE -
              SCREEN_PADDING
          )
        ),
        y: clamp(
          current.y,
          SCREEN_PADDING,
          Math.max(
            SCREEN_PADDING,
            window.innerHeight -
              NORI_SIZE -
              SCREEN_PADDING
          )
        ),
      }));
    };

    window.addEventListener(
      'resize',
      handleResize
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);

  useEffect(() => {
    const handleNoriEvent = (
      event: CustomEvent<NoriEvent>
    ) => {
      const {
        type,
        message: customMessage,
      } = event.detail;

      switch (type) {
        case 'TASK_COMPLETED':
          celebrateReaction(
            customMessage ||
              randomItem([
                'task done!! nice one. 🎉',
                'one less thing to worry about!',
                'CHECKED OFF!! I knew you had it.',
                'look at you being productive!!',
              ])
          );
          break;

        case 'TASK_CREATED':
          react(
            'looking',
            customMessage ||
              randomItem([
                'ooh, a new mission.',
                'adding that to our tiny agenda.',
                'noted. we shall conquer it.',
              ]),
            {
              duration: 3500,
              xp: 1,
              bond: 1,
              happiness: 1,
              frequency: 560,
            }
          );
          break;

        case 'TASK_DELETED':
          react(
            'surprised',
            customMessage ||
              randomItem([
                'poof. gone.',
                'oh! that disappeared.',
                'well... less to do, I suppose.',
              ]),
            {
              duration: 3500,
              frequency: 700,
            }
          );
          break;

        case 'FOCUS_STARTED':
          react(
            'focused',
            customMessage ||
              randomItem([
                'focus mode activated.',
                'I will keep you company.',
                'okay. tiny serious face.',
              ]),
            {
              duration: 5000,
              xp: 2,
              bond: 2,
              frequency: 540,
            }
          );
          break;

        case 'FOCUS_COMPLETED':
          celebrateReaction(
            customMessage ||
              randomItem([
                'focus session complete!! 🎯',
                'you stayed with it!! nice.',
                'brain workout completed.',
              ])
          );
          break;

        case 'DAILY_GOAL_COMPLETED':
          celebrateReaction(
            customMessage ||
              randomItem([
                'DAILY GOAL COMPLETE!! 🎉🎉',
                'we did everything!!',
                'today belongs to us.',
              ])
          );
          break;

        case 'STREAK_INCREASED':
          react(
            'excited',
            customMessage ||
              randomItem([
                'THE STREAK LIVES!! 🔥',
                'another day conquered!',
                'do you see that streak?!',
              ]),
            {
              duration: 5000,
              xp: 8,
              bond: 5,
              happiness: 8,
              frequency: 780,
            }
          );
          break;

        case 'LEVEL_UP':
        case 'ACHIEVEMENT_UNLOCKED':
          celebrateReaction(
            customMessage ||
              'NEW ACHIEVEMENT UNLOCKED!! ✨'
          );
          break;

        case 'REWARD_EARNED':
        case 'COINS_EARNED':
          react(
            'excited',
            customMessage ||
              randomItem([
                'oooh shiny!!',
                'we earned something!',
                'tiny rewards make me happy.',
              ]),
            {
              duration: 4000,
              xp: 4,
              happiness: 5,
              frequency: 760,
            }
          );
          break;

        case 'GAME_WON':
          celebrateReaction(
            customMessage ||
              randomItem([
                'YOU WON!! 🎉',
                'absolute gaming legend.',
                'victory!! victory!!',
              ])
          );
          break;

        case 'GAME_LOST':
          react(
            'sad',
            customMessage ||
              randomItem([
                'aw. that one got us.',
                'it happens. again?',
                'we will get them next time.',
              ]),
            {
              duration: 4000,
              bond: 2,
              frequency: 430,
            }
          );
          break;

        case 'GARDEN_ACTION':
          react(
            'happy',
            customMessage ||
              randomItem([
                'the garden is looking nice.',
                'plants acquired happiness.',
                'green things!!',
              ]),
            {
              duration: 3500,
              xp: 2,
              happiness: 3,
              frequency: 650,
            }
          );
          break;

        case 'USER_RETURNED':
          react(
            'love',
            customMessage ||
              randomItem([
                'you are back!! 💛',
                'oh! there you are.',
                'I was waiting for you.',
              ]),
            {
              duration: 4500,
              bond: 3,
              happiness: 5,
              frequency: 720,
            }
          );
          break;

        case 'SITE_INTERACTION':
          if (Math.random() < 0.25) {
            react(
              'looking',
              customMessage ||
                randomItem([
                  'I see you.',
                  'what are we doing?',
                  'interesting...',
                ]),
              {
                duration: 3000,
                frequency: 560,
              }
            );
          }
          break;
      }
    };

    window.addEventListener(
      'nori-event',
      handleNoriEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        'nori-event',
        handleNoriEvent as EventListener
      );
    };
  }, [soundEnabled]);

  useEffect(() => {
    const elapsed = Math.max(
      0,
      Math.min(
        24 * 60,
        (Date.now() -
          life.lastUpdate) /
          60000
      )
    );

    if (elapsed < 1) return;

    setLife((p) => ({
      ...p,
      energy: clamp(
        p.energy +
          (elapsed / 60) * 5,
        0,
        100
      ),
      happiness: clamp(
        p.happiness -
          (elapsed / 60) * 1.5,
        0,
        100
      ),
      hunger: clamp(
        p.hunger -
          (elapsed / 60) * 6,
        0,
        100
      ),
      lastUpdate: Date.now(),
    }));
  }, []);

  useEffect(() => {
    if (
      lastLevel.current ===
      life.level
    ) {
      return;
    }

    lastLevel.current =
      life.level;

    celebrateReaction(
      `level ${life.level}! tiny achievement unlocked. ✨`
    );
  }, [life.level]);

  const idleAction = () => {
    if (isDragging) return;

    setLife((p) => {
      const random = Math.random();

      if (p.hunger < 22) {
        return {
          ...p,
          activity: 'hungry',
        };
      }

      if (p.energy < 18) {
        return {
          ...p,
          activity: 'sleeping',
          sleepingUntil:
            Date.now() + 90000,
        };
      }

      if (
        p.happiness < 20 &&
        random < 0.4
      ) {
        return {
          ...p,
          activity: 'sad',
        };
      }

      if (random < 0.18) {
        return {
          ...p,
          activity: 'looking',
        };
      }

      if (random < 0.32) {
        return {
          ...p,
          activity: 'happy',
        };
      }

      if (random < 0.42) {
        return {
          ...p,
          activity: 'excited',
        };
      }

      return {
        ...p,
        activity: 'idle',
      };
    });

    if (Math.random() < 0.22) {
      speak(
        randomItem(IDLE_MESSAGES),
        4200,
        520
      );
    }
  };

  useEffect(() => {
    const schedule = () => {
      idleTimer.current =
        setTimeout(() => {
          idleAction();
          schedule();
        }, 12000 + Math.random() * 22000);
    };

    schedule();

    return () => {
      if (idleTimer.current) {
        clearTimeout(
          idleTimer.current
        );
      }
    };
  }, [isDragging, currentContext]);

  useEffect(() => {
    const interval =
      setInterval(() => {
        setLife((p) => {
          const sleeping =
            p.sleepingUntil !== null &&
            Date.now() <
              p.sleepingUntil;

          if (sleeping) {
            const energy =
              clamp(
                p.energy + 3,
                0,
                100
              );

            return {
              ...p,
              energy,
              hunger: clamp(
                p.hunger - 0.4,
                0,
                100
              ),
              happiness: clamp(
                p.happiness + 0.4,
                0,
                100
              ),
              activity:
                energy > 65
                  ? 'happy'
                  : 'sleeping',
              lastUpdate:
                Date.now(),
            };
          }

          return {
            ...p,
            hunger: clamp(
              p.hunger - 0.65,
              0,
              100
            ),
            energy: clamp(
              p.energy - 0.18,
              0,
              100
            ),
            happiness: clamp(
              p.happiness -
                (p.activity ===
                'focused'
                  ? 0
                  : 0.04),
              0,
              100
            ),
            lastUpdate:
              Date.now(),
          };
        });
      }, 10000);

    return () =>
      clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      !life.sleepingUntil ||
      Date.now() <
        life.sleepingUntil
    ) {
      return;
    }

    setLife((p) => ({
      ...p,
      sleepingUntil: null,
      activity: 'happy',
    }));
  }, [life.sleepingUntil]);

  useEffect(() => {
    if (!currentContext) return;

    const context =
      currentContext.toLowerCase();

    if (
      context ===
      lastContext.current
    ) {
      return;
    }

    lastContext.current =
      context;

    const key =
      Object.keys(
        CONTEXT_MESSAGES
      ).find((k) =>
        context.includes(k)
      );

    if (key) {
      setLife((p) => ({
        ...p,
        activity: 'looking',
      }));

      if (Math.random() < 0.5) {
        speak(
          randomItem(
            CONTEXT_MESSAGES[key]
          ),
          4200,
          580
        );
      }
    }
  }, [currentContext]);

  const pet = () => {
    react(
      'happy',
      randomItem(HAPPY_MESSAGES),
      {
        duration: 3500,
        xp: 2,
        bond: 1,
        happiness: 4,
        energy: 1,
      }
    );

    setLife((p) => ({
      ...p,
      memory: {
        ...p.memory,
        pets: p.memory.pets + 1,
        favoriteAction: 'pet',
      },
    }));

    setSparkles(true);

    if (sparkleTimer.current) {
      clearTimeout(
        sparkleTimer.current
      );
    }

    sparkleTimer.current =
      setTimeout(() => {
        setSparkles(false);
      }, 900);
  };

  const feed = () => {
    react(
      'love',
      randomItem([
        'ohhhh snack.',
        'you understand me.',
        'excellent. excellent snack.',
        'I forgive everything.',
      ]),
      {
        duration: 4000,
        xp: 5,
        bond: 3,
        happiness: 8,
        energy: 3,
        hunger: 30,
      }
    );

    setLife((p) => ({
      ...p,
      memory: {
        ...p.memory,
        feeds: p.memory.feeds + 1,
        favoriteAction: 'feed',
      },
    }));
  };

  const play = () => {
    if (life.energy < 15) {
      react(
        'tired',
        'I want to play, but my little battery is protesting.',
        {
          duration: 4500,
          frequency: 430,
        }
      );
      return;
    }

    react(
      'playing',
      randomItem([
        'PLAY TIME!',
        'you got me!',
        'again again!',
        'zoomies activated.',
      ]),
      {
        duration: 4000,
        xp: 8,
        bond: 5,
        happiness: 10,
        energy: -10,
        hunger: -6,
      }
    );

    setLife((p) => ({
      ...p,
      memory: {
        ...p.memory,
        plays: p.memory.plays + 1,
        favoriteAction: 'play',
      },
    }));
  };

  const rest = async () => {
    react(
      'sleeping',
      randomItem([
        'yawn... tiny nap?',
        'five more minutes...',
        'my eyes are doing the heavy thing.',
      ]),
      {
        duration: 4500,
        xp: 4,
        bond: 2,
        happiness: 4,
        energy: 20,
        hunger: -3,
      }
    );

    setLife((p) => ({
      ...p,
      sleepingUntil:
        Date.now() + 90000,
      memory: {
        ...p.memory,
        rests: p.memory.rests + 1,
        favoriteAction: 'rest',
      },
    }));

    if (companion) {
      try {
        setCompanion(
          await companionApi.updateCompanion({
            moodState: 'SLEEPY',
          })
        );
      } catch {}
    }
  };

  const focus = async () => {
    react(
      'focused',
      randomItem(FOCUSED_MESSAGES),
      {
        duration: 5000,
        xp: 8,
        bond: 4,
        happiness: 2,
        energy: 4,
      }
    );

    setLife((p) => ({
      ...p,
      memory: {
        ...p.memory,
        focusSessions:
          p.memory.focusSessions + 1,
        favoriteAction: 'focus',
      },
    }));

    if (companion) {
      try {
        setCompanion(
          await companionApi.updateCompanion({
            moodState: 'FOCUSED',
          })
        );
      } catch {}
    }
  };

  const celebrate = async () => {
    celebrateReaction();

    setLife((p) => ({
      ...p,
      memory: {
        ...p.memory,
        celebrations:
          p.memory.celebrations + 1,
        favoriteAction: 'celebrate',
      },
    }));

    if (companion) {
      try {
        setCompanion(
          await companionApi.updateCompanion({
            moodState:
              'CELEBRATING',
          })
        );
      } catch {}
    }
  };

  const surprise = () => {
    react(
      'surprised',
      randomItem([
        'OH.',
        'you startled me!',
        'that was unexpected.',
        'I saw that.',
      ]),
      {
        duration: 3500,
        xp: 3,
        bond: 2,
        happiness: 3,
        frequency: 720,
      }
    );
  };

  const handleMainClick = () => {
    if (wasDragged.current) {
      wasDragged.current = false;
      return;
    }

    if (
      life.activity ===
      'sleeping'
    ) {
      surprise();

      setLife((p) => ({
        ...p,
        sleepingUntil: null,
      }));

      return;
    }

    pet();
    setIsOpen((open) => !open);
  };

  const handleDragStart = () => {
    wasDragged.current = false;
    setIsDragging(true);

    setLife((p) => ({
      ...p,
      activity: 'excited',
    }));
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);

    if (
      Math.abs(info.offset.x) > 5 ||
      Math.abs(info.offset.y) > 5
    ) {
      wasDragged.current = true;
    }

    setPosition((current) => ({
      x: clamp(
        current.x + info.offset.x,
        SCREEN_PADDING,
        Math.max(
          SCREEN_PADDING,
          window.innerWidth -
            NORI_SIZE -
            SCREEN_PADDING
        )
      ),
      y: clamp(
        current.y + info.offset.y,
        SCREEN_PADDING,
        Math.max(
          SCREEN_PADDING,
          window.innerHeight -
            NORI_SIZE -
            SCREEN_PADDING
        )
      ),
    }));

    if (wasDragged.current) {
      react(
        'excited',
        randomItem([
          'hey!',
          'oh.',
          'I was comfortable there.',
          'you moved me!',
          'new seat acquired.',
        ]),
        {
          duration: 3200,
          happiness: 2,
          bond: 1,
          frequency: 470,
        }
      );
    }
  };

  const resetPosition = () => {
    setPosition(
      getDefaultPosition()
    );

    react(
      'happy',
      'ahhh. back to my.....house?',
      {
        duration: 3500,
        bond: 1,
      }
    );
  };

  const equip = async (
    accessory: string
  ) => {
    try {
      setCompanion(
        await companionApi.updateCompanion({
          equippedAccessory:
            accessory,
        })
      );

      speak(
        accessory === 'none'
          ? 'back to the natural look.'
          : `ooh. ${
              ACCESSORY_NAMES[
                accessory
              ] || accessory
            }.`
      );

      showToast(
        accessory === 'none'
          ? 'Accessory removed!'
          : `Equipped ${
              ACCESSORY_NAMES[
                accessory
              ] || accessory
            }!`,
        'success'
      );
    } catch (error: any) {
      showToast(
        error?.message ||
          'Could not change accessory.',
        'error'
      );
    }
  };

  const getBoxDirection = (): BoxDirection => {
    const centerX =
      position.x + NORI_SIZE / 2;

    const centerY =
      position.y + NORI_SIZE / 2;

    const horizontal =
      centerX < window.innerWidth / 2
        ? 'right'
        : 'left';

    const vertical =
      centerY < window.innerHeight / 2
        ? 'bottom'
        : 'top';

    return `${vertical}-${horizontal}` as BoxDirection;
  };

  const boxDirection =
    getBoxDirection();

  const getBoxPosition =
    (): React.CSSProperties => {
      const gap = 12;

      const style: React.CSSProperties = {
        position: 'absolute',
        width: `min(${BOX_WIDTH}px, calc(100vw - 24px))`,
      };

      if (
        boxDirection.startsWith(
          'top'
        )
      ) {
        style.bottom =
          NORI_SIZE + gap;
      } else {
        style.top =
          NORI_SIZE + gap;
      }

      if (
        boxDirection.endsWith(
          'left'
        )
      ) {
        style.right = 0;
      } else {
        style.left = 0;
      }

      return style;
    };

    useEffect(() => {
  const handleNoriAction = (event: Event) => {
    const customEvent = event as CustomEvent<{
      activity?: Activity;
      message?: string;
    }>;

    const { activity, message } = customEvent.detail || {};

    if (!activity) return;

    setLife((previous) => ({
      ...previous,
      activity,
    }));

    if (message) {
      speak(message, 5000);
    }
  };

  window.addEventListener(
    'nori-action',
    handleNoriAction as EventListener
  );

  return () => {
    window.removeEventListener(
      'nori-action',
      handleNoriAction as EventListener
    );
  };
}, []);


useEffect(() => {
  const timer = window.setTimeout(() => {
    if (!isOpen && !isDragging) {
      setIsMegaNori(true);

      speak(
        [
          'BEHOLD',
          'MMMMMM, BISCUITS *AGGRESSIVE SNIFFS*',
          'Height, must build',
          'I have become big, mother.',
          'Quite excessive.',
          'HELP. I cannot fit.',
        ][Math.floor(Math.random() * 7)],
        1200000 + Math.random() * 1200000
      );

      window.setTimeout(() => {
        setIsMegaNori(false);
      }, 5000);
    }
  }, 5000);

  return () => window.clearTimeout(timer);
}, [isOpen, isDragging]);
    
  if (!companion) {
    return null;
  }
  

  const accessory =
    ACCESSORY_EMOJIS[
      companion.equippedAccessory ||
        'none'
    ] || '';

  return (
    <div
      data-mascot="true"
      className="pointer-events-none fixed inset-0 z-40 select-none"
    >
      <motion.div
        className="pointer-events-auto fixed"
        style={{
          left: position.x,
          top: position.y,
          width: NORI_SIZE,
          height: NORI_SIZE,
        }}
          animate={{
    scale: isMegaNori ? 4 : 1,
  }}
  transition={{
    type: 'spring',
    stiffness: 60,
    damping: 15,
  }}
>
        <AnimatePresence>
          {(isOpen ||
            showMessage) && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
              }}
              transition={{
                duration: 0.18,
              }}
              style={getBoxPosition()}
              className="z-50 rounded-3xl border border-haven-200 bg-white/95 p-4 text-xs text-slate-800 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-200"
            >
              <div className="flex items-start justify-between gap-2 border-b border-haven-100 pb-2 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    {companion.name}
                  </div>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {bondLabel}
                    {' · '}
                    Level {life.level}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSoundEnabled(
                        (value) => !value
                      );
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-3.5 w-3.5" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      resetPosition();
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsClosetOpen(
                        (open) => !open
                      );
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsOpen(false);
                      setIsClosetOpen(false);
                      setShowMessage(false);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="py-3">
                <p className="font-serif italic leading-relaxed">
                  "{message}"
                </p>
              </div>

              {isOpen && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        pet();
                      }}
                      className="rounded-xl bg-rose-50 px-2.5 py-2 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      💗 Pet
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        feed();
                      }}
                      className="rounded-xl bg-amber-50 px-2.5 py-2 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      🍪 Feed
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        play();
                      }}
                      className="rounded-xl bg-sky-50 px-2.5 py-2 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                    >
                      🎾 Play
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        rest();
                      }}
                      className="rounded-xl bg-indigo-50 px-2.5 py-2 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    >
                      💤 Rest
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        focus();
                      }}
                      className="rounded-xl bg-violet-50 px-2.5 py-2 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                    >
                      🎯 Focus
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        celebrate();
                      }}
                      className="rounded-xl bg-emerald-50 px-2.5 py-2 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      🎉 Celebrate
                    </button>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          <Battery className="h-3 w-3" />
                          Energy
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{
                              width: `${life.energy}%`,
                            }}
                          />
                        </div>

                        <div className="mt-1 text-[9px] text-slate-500">
                          {Math.round(life.energy)}%
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          <Heart className="h-3 w-3" />
                          Mood
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-rose-500"
                            style={{
                              width: `${life.happiness}%`,
                            }}
                          />
                        </div>

                        <div className="mt-1 text-[9px] text-slate-500">
                          {Math.round(life.happiness)}%
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          <Utensils className="h-3 w-3" />
                          Hunger
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full rounded-full ${
                              life.hunger < 25
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${life.hunger}%`,
                            }}
                          />
                        </div>

                        <div className="mt-1 text-[9px] text-slate-500">
                          {Math.round(life.hunger)}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[9px] text-slate-400">
                        <span>
                          Bond · {bondLabel}
                        </span>

                        <span>
                          {life.xp}/{nextXp} XP
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{
                            width: `${levelProgress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400">
                      <span>
                        favorite: {favoriteAction}
                      </span>

                      <span>
                        {life.memory.interactions}{' '}
                        interactions
                      </span>
                    </div>
                  </div>
                </>
              )}

              {isClosetOpen && (
                <div className="mt-3 border-t border-haven-100 pt-3 dark:border-slate-800">
                  <div className="mb-2 flex items-center gap-2">
                    <Settings2 className="h-3.5 w-3.5 text-amber-500" />

                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Accessory Closet
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(
                      ACCESSORY_EMOJIS
                    ).map((acc) => (
                      <button
                        type="button"
                        key={acc}
                        onClick={(event) => {
                          event.stopPropagation();
                          equip(acc);
                        }}
                        className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${
                          companion.equippedAccessory === acc
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-haven-200 bg-haven-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {ACCESSORY_EMOJIS[acc] || '🐱'}{' '}
                        {ACCESSORY_NAMES[acc]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          drag
          dragMomentum={false}
          dragElastic={0.08}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileHover={{
            scale: 1.06,
          }}
          whileTap={{
            scale: 0.94,
          }}
          onClick={handleMainClick}
          className="relative flex h-24 w-24 items-center justify-center overflow-visible rounded-full border-4 border-white bg-transparent shadow-2xl dark:border-slate-800"
          aria-label={`Interact with ${companion.name}`}
        >
          <motion.div
            animate={animationFor(life.activity)}
            transition={{
              duration: durationFor(
                life.activity
              ),
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="h-full w-full overflow-hidden rounded-full"
          >
            <img
              src={imageSrc}
              alt={`${companion.name} - ${life.activity}`}
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src =
                  IMAGES.idle;
              }}
            />
          </motion.div>

          {accessory && (
            <motion.span
              animate={{
                rotate: [
                  0,
                  -6,
                  6,
                  0,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="pointer-events-none absolute -right-1 -top-3 text-xl"
            >
              {accessory}
            </motion.span>
          )}

          <AnimatePresence>
            {sparkles && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.4,
                }}
                animate={{
                  opacity: [
                    0,
                    1,
                    0,
                  ],
                  scale: [
                    0.6,
                    1.2,
                    1.4,
                  ],
                  rotate: 20,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.9,
                }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className="h-10 w-10 text-yellow-300 drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>

          {life.activity === 'sleeping' && (
            <motion.span
              animate={{
                opacity: [
                  0,
                  1,
                  0,
                ],
                y: -26,
              }}
              transition={{
                duration: 2.3,
                repeat: Infinity,
              }}
              className="pointer-events-none absolute -left-1 -top-3 text-xs font-bold text-slate-500"
            >
              zZ
            </motion.span>
          )}

          {life.activity === 'hungry' && (
            <motion.span
              animate={{
                y: [
                  0,
                  -3,
                  0,
                ],
                rotate: [
                  0,
                  -3,
                  3,
                  0,
                ],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
              }}
              className="pointer-events-none absolute -right-3 -top-2 text-lg"
            >
              🍪
            </motion.span>
          )}

          {life.activity === 'love' && (
            <motion.div
              animate={{
                y: [
                  0,
                  -12,
                  0,
                ],
                opacity: [
                  0,
                  1,
                  0,
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="pointer-events-none absolute -left-3 -top-2"
            >
              <Heart className="h-5 w-5 fill-rose-400 text-rose-400" />
            </motion.div>
          )}

          {life.activity === 'focused' && (
            <div className="pointer-events-none absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
              <Eye className="h-2.5 w-2.5" />
              focus
            </div>
          )}

          {life.activity === 'celebrating' && (
            <motion.div
              animate={{
                rotate: 360,
                scale: [
                  1,
                  1.2,
                  1,
                ],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
              className="pointer-events-none absolute -left-2 -top-2 text-amber-300"
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>
          )}

          {life.hunger < 18 && (
            <motion.div
              animate={{
                scale: [
                  1,
                  1.08,
                  1,
                ],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
              }}
              className="pointer-events-none absolute -bottom-1 -right-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow"
            >
              snack
            </motion.div>
          )}

          {life.bond >= 500 && (
            <Star className="pointer-events-none absolute -bottom-1 -left-1 h-4 w-4 fill-amber-300 text-amber-300" />
          )}

          {life.memory.interactions >= 100 && (
            <Gift className="pointer-events-none absolute -left-2 bottom-1 h-4 w-4 text-pink-400" />
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};