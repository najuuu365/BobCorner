import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, Bot, Building2, Cat, Coins, Crown, Factory,
  Lock, Rocket, Sparkles, TrendingUp, Trophy, Zap
} from 'lucide-react';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { gamesApi } from '../../services/gamesApi';

type BusinessId =
  | 'lemonade'
  | 'bookshop'
  | 'cafe'
  | 'flowerfarm'
  | 'arcade'
  | 'corporation'
  | 'space'
  | 'dreamarchive'
  | 'moonresort'
  | 'timemuseum'
  | 'multiverse';

type ResearchId = 'marketing' | 'logistics' | 'automation' | 'quantum';

type Business = {
  id: BusinessId;
  name: string;
  icon: string;
  level: number;
  baseRate: number;
  baseCost: number;
  unlockAt: number;
  automated: boolean;
};

type EventType = 'frog' | 'cat' | 'frenzy' | null;

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

type TycoonState = {
  coins: number;
  businesses: Business[];
  totalCoinsEarned: number;
  prestige: number;
  achievements: Achievement[];
  lastCollectedAt: number;
  dimensions: number;
  research: ResearchId[];
};

const BUSINESS_TEMPLATES: Omit<Business, 'level' | 'automated'>[] = [
  { id: 'lemonade', name: 'Lemonade Stand', icon: '🍋', baseRate: 1, baseCost: 15, unlockAt: 0 },
  { id: 'bookshop', name: 'Bobb Bookshop', icon: '📚', baseRate: 6, baseCost: 120, unlockAt: 100 },
  { id: 'cafe', name: 'Bobb Café', icon: '☕', baseRate: 30, baseCost: 750, unlockAt: 600 },
  { id: 'flowerfarm', name: 'Flower Farm', icon: '🌻', baseRate: 150, baseCost: 4000, unlockAt: 3000 },
  { id: 'arcade', name: 'Bobb Arcade', icon: '🕹️', baseRate: 800, baseCost: 22000, unlockAt: 15000 },
  { id: 'corporation', name: 'Bobb Corporation', icon: '🏢', baseRate: 4000, baseCost: 120000, unlockAt: 80000 },
  { id: 'space', name: 'Space Mining', icon: '🚀', baseRate: 25000, baseCost: 750000, unlockAt: 500000 },
  { id: 'dreamarchive', name: 'Dream Archive', icon: '💭', baseRate: 150000, baseCost: 5000000, unlockAt: 3500000 },
  { id: 'moonresort', name: 'Moon Resort', icon: '🌙', baseRate: 900000, baseCost: 35000000, unlockAt: 25000000 },
  { id: 'timemuseum', name: 'Time Museum', icon: '⌛', baseRate: 6000000, baseCost: 250000000, unlockAt: 180000000 },
  { id: 'multiverse', name: 'Multiverse HQ', icon: '🌌', baseRate: 50000000, baseCost: 2000000000, unlockAt: 1500000000 },
];

const RESEARCH = [
  { id: 'marketing' as ResearchId, name: 'Cozy Marketing', description: '+25% total production', cost: 500, multiplier: 1.25 },
  { id: 'logistics' as ResearchId, name: 'Better Logistics', description: '+50% total production', cost: 5000, multiplier: 1.5 },
  { id: 'automation' as ResearchId, name: 'Smart Automation', description: '+100% total production', cost: 50000, multiplier: 2 },
  { id: 'quantum' as ResearchId, name: 'Quantum Accounting', description: '+300% total production', cost: 500000, multiplier: 4 },
];

const ACHIEVEMENT_TEMPLATES: Achievement[] = [
  { id: 'first', title: 'First Dollar', description: 'Earn 100 coins total', icon: '🌱', unlocked: false },
  { id: 'serious', title: 'Getting Serious', description: 'Earn 10,000 coins total', icon: '💸', unlocked: false },
  { id: 'industrialist', title: 'Industrialist', description: 'Reach level 1 on 5 businesses', icon: '🏭', unlocked: false },
  { id: 'frogfriend', title: 'Frog Friend', description: 'Click the frog', icon: '🐸', unlocked: false },
  { id: 'catvictim', title: 'Cat Victim', description: 'Get visited by the cat', icon: '😼', unlocked: false },
  { id: 'millionaire', title: 'Capitalist Nightmare', description: 'Earn 1,000,000 coins total', icon: '🤑', unlocked: false },
  { id: 'dimension', title: 'Across the Veil', description: 'Unlock a second dimension', icon: '🌀', unlocked: false },
  { id: 'researcher', title: ' Boblar', description: 'Complete every research project', icon: '🔬', unlocked: false },
];

const createDefaultState = (): TycoonState => ({
  coins: 0,
  businesses: BUSINESS_TEMPLATES.map((business) => ({
    ...business,
    level: business.unlockAt === 0 ? 1 : 0,
    automated: false,
  })),
  totalCoinsEarned: 0,
  prestige: 0,
  achievements: ACHIEVEMENT_TEMPLATES.map((achievement) => ({ ...achievement })),
  lastCollectedAt: Date.now(),
  dimensions: 1,
  research: [],
});

const format = (value: number) => Math.floor(value).toLocaleString();

const getBusinessCost = (business: Business) =>
  Math.floor(business.baseCost * Math.pow(1.16, business.level));

const getBulkCost = (business: Business, quantity: number) => Array.from({ length: quantity }, (_, index) => business.baseCost * Math.pow(1.16, business.level + index)).reduce((total, cost) => total + Math.floor(cost), 0);

const getBusinessRate = (business: Business) =>
  business.level * business.baseRate * Math.pow(2, Math.floor(business.level / 10));

const getVisibleBusinesses = (businesses: Business[], totalCoinsEarned: number) => {
  const firstLockedIndex = businesses.findIndex((business) => business.level === 0 && totalCoinsEarned < business.unlockAt);
  return firstLockedIndex < 0 ? businesses : businesses.slice(0, firstLockedIndex + 1);
};

export const IdleTycoonGame: React.FC = () => {
  const [state, setState] = useState<TycoonState>(createDefaultState);
  const [loaded, setLoaded] = useState(false);
  const [offlineReward, setOfflineReward] = useState(0);
  const [event, setEvent] = useState<EventType>(null);
  const [eventMultiplier, setEventMultiplier] = useState(1);
  const [eventSeconds, setEventSeconds] = useState(0);
  const [message, setMessage] = useState('Bobbb is your Boss, work for him');
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const productionRate = useMemo(() => {
    const base = state.businesses.reduce(
      (total, business) => total + getBusinessRate(business),
      0
    );

    const researchMultiplier = state.research.reduce((total, id) => total * (RESEARCH.find((item) => item.id === id)?.multiplier || 1), 1);
    return base * (1 + state.prestige * 0.1) * state.dimensions * researchMultiplier * eventMultiplier;
  }, [state.businesses, state.prestige, state.dimensions, state.research, eventMultiplier]);

  useEffect(() => {
    gamesApi.getScores()
      .then(({ stats }) => {
        const saved = stats.find((item) => item.gameKey === 'idle_tycoon');

        if (saved?.extraStatsJson) {
          try {
            const parsed = JSON.parse(saved.extraStatsJson) as Partial<TycoonState>;
            const fallback = createDefaultState();

            const restoredBusinesses = fallback.businesses.map((business) => {
              const savedBusiness = parsed.businesses?.find(
                (item) => item.id === business.id
              );
              return savedBusiness
                ? { ...business, ...savedBusiness }
                : business;
            });

            const restoredAchievements = fallback.achievements.map((achievement) => {
              const savedAchievement = parsed.achievements?.find(
                (item) => item.id === achievement.id
              );
              return savedAchievement
                ? { ...achievement, ...savedAchievement }
                : achievement;
            });

            const previous: TycoonState = {
              ...fallback,
              ...parsed,
              businesses: restoredBusinesses,
              achievements: restoredAchievements,
              dimensions: parsed.dimensions || 1,
              research: parsed.research || [],
            };

            const previousRate = previous.businesses.reduce(
              (total, business) => total + getBusinessRate(business),
              0
            ) * (1 + previous.prestige * 0.1) * previous.dimensions * previous.research.reduce((total, id) => total * (RESEARCH.find((item) => item.id === id)?.multiplier || 1), 1);

            const elapsedSeconds = Math.min(
              8 * 60 * 60,
              Math.max(0, Math.floor((Date.now() - previous.lastCollectedAt) / 1000))
            );

            const offlineCoins = Math.floor(previousRate * elapsedSeconds);

            setState({
              ...previous,
              coins: previous.coins + offlineCoins,
              totalCoinsEarned: previous.totalCoinsEarned + offlineCoins,
              lastCollectedAt: Date.now(),
            });

            if (offlineCoins > 0) setOfflineReward(offlineCoins);
          } catch {
            setState(createDefaultState());
          }
        }

        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || offlineReward > 0) return;

    const interval = window.setInterval(() => {
      setState((previous) => {
        const baseRate = previous.businesses.reduce(
          (total, business) => total + getBusinessRate(business),
          0
        );

        const researchMultiplier = previous.research.reduce((total, id) => total * (RESEARCH.find((item) => item.id === id)?.multiplier || 1), 1);
        const rate = baseRate * (1 + previous.prestige * 0.1) * previous.dimensions * researchMultiplier * eventMultiplier;

        return {
          ...previous,
          coins: previous.coins + rate,
          totalCoinsEarned: previous.totalCoinsEarned + rate,
          lastCollectedAt: Date.now(),
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [loaded, offlineReward, eventMultiplier]);

  useEffect(() => {
    if (!loaded) return;

    const timeout = window.setTimeout(() => {
      const current = stateRef.current;
      gamesApi.saveScore(
        'idle_tycoon',
        Math.floor(current.coins),
        false,
        undefined,
        {
          ...current,
          lastCollectedAt: Date.now(),
        }
      ).catch(() => {});
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [state, loaded]);

  useEffect(() => {
    if (!loaded || offlineReward > 0 || event) return;

    const timeout = window.setTimeout(() => {
      const roll = Math.random();

      if (roll < 0.4) {
        setEvent('frog');
        setMessage('🐸 A suspiciously rich thavala has appeared!');
      } else if (roll < 0.75) {
        setEvent('cat');
        setMessage('😼 The Bob enemy cat is plotting something...');
      } else {
        setEvent('frenzy');
        setEventMultiplier(3);
        setEventSeconds(30);
        setMessage('🔥 PRODUCTION FRENZY — 3× income!');
      }
    }, 20000 + Math.random() * 25000);

    return () => window.clearTimeout(timeout);
  }, [loaded, offlineReward, event]);

  useEffect(() => {
    if (event !== 'frenzy' || eventSeconds <= 0) return;

    const interval = window.setInterval(() => {
      setEventSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [event, eventSeconds]);

  useEffect(() => {
    if (event === 'frenzy' && eventSeconds <= 0) {
      setEvent(null);
      setEventMultiplier(1);
      setMessage('The production frenzy ended.');
    }
  }, [event, eventSeconds]);

  const unlockAchievement = (id: string) => {
    setState((previous) => ({
      ...previous,
      achievements: previous.achievements.map((achievement) =>
        achievement.id === id
          ? { ...achievement, unlocked: true }
          : achievement
      ),
    }));
  };

  useEffect(() => {
    const current = stateRef.current;
    if (current.totalCoinsEarned >= 100) unlockAchievement('first');
    if (current.totalCoinsEarned >= 10000) unlockAchievement('serious');
    if (current.totalCoinsEarned >= 1000000) unlockAchievement('millionaire');

    if (current.businesses.filter((business) => business.level > 0).length >= 5) {
      unlockAchievement('industrialist');
    }
  }, [state.totalCoinsEarned, state.businesses]);

  const buyBusiness = (id: BusinessId, quantity = 1) => {
    setState((previous) => {
      const business = previous.businesses.find((item) => item.id === id);
      if (!business) return previous;

      const unlocked =
        previous.totalCoinsEarned >= business.unlockAt || business.level > 0;

      const cost = getBulkCost(business, quantity);

      if (!unlocked || previous.coins < cost) return previous;

      const nextBusinesses = previous.businesses.map((item) =>
        item.id === id ? { ...item, level: item.level + quantity } : item
      );

      setMessage(`${business.icon} ${business.name} upgraded ${quantity} level${quantity === 1 ? '' : 's'}!`);

      return {
        ...previous,
        coins: previous.coins - cost,
        businesses: nextBusinesses,
      };
    });
  };

  const buyManager = (id: BusinessId) => {
    setState((previous) => {
      const business = previous.businesses.find((item) => item.id === id);
      if (!business || business.level <= 0 || business.automated) return previous;

      const cost = Math.floor(getBusinessCost(business) * 5);

      if (previous.coins < cost) return previous;

      setMessage(`🤖 ${business.name} now has a manager!`);

      return {
        ...previous,
        coins: previous.coins - cost,
        businesses: previous.businesses.map((item) =>
          item.id === id ? { ...item, automated: true } : item
        ),
      };
    });
  };

  const collectBonus = () => {
    const bonus = Math.max(10, Math.floor(productionRate * 10));

    setState((previous) => ({
      ...previous,
      coins: previous.coins + bonus,
      totalCoinsEarned: previous.totalCoinsEarned + bonus,
    }));

    setMessage(`💰 Collected ${format(bonus)} bonus coins!`);
  };

  const dimensionCost = state.dimensions * state.dimensions * 250000;
  const buyDimension = () => {
    if (state.coins < dimensionCost || state.dimensions >= 10) return;
    setState((previous) => ({ ...previous, coins: previous.coins - dimensionCost, dimensions: previous.dimensions + 1 }));
    unlockAchievement('dimension');
    setMessage(`🌀 Dimension ${state.dimensions + 1} opened. Production multiplied.`);
  };

  const buyResearch = (researchId: ResearchId) => {
    const project = RESEARCH.find((item) => item.id === researchId);
    if (!project || state.research.includes(researchId) || state.coins < project.cost) return;
    setState((previous) => ({ ...previous, coins: previous.coins - project.cost, research: [...previous.research, researchId] }));
    if (state.research.length + 1 === RESEARCH.length) unlockAchievement('researcher');
    setMessage(`🔬 Research complete: ${project.name}.`);
  };

  const clickFrog = () => {
    const reward = Math.max(100, Math.floor(productionRate * 30));

    setState((previous) => ({
      ...previous,
      coins: previous.coins + reward,
      totalCoinsEarned: previous.totalCoinsEarned + reward,
      achievements: previous.achievements.map((achievement) =>
        achievement.id === 'frogfriend'
          ? { ...achievement, unlocked: true }
          : achievement
      ),
    }));

    setEvent(null);
    setMessage(`🐸 Frog Investor gave you ${format(reward)} coins!`);
  };

  const clickCat = () => {
    const loss = Math.min(state.coins, Math.max(25, Math.floor(productionRate * 10)));

    setState((previous) => ({
      ...previous,
      coins: Math.max(0, previous.coins - loss),
      achievements: previous.achievements.map((achievement) =>
        achievement.id === 'catvictim'
          ? { ...achievement, unlocked: true }
          : achievement
      ),
    }));

    setEvent(null);
    setMessage(`😼 The cat stole ${format(loss)} coins. Typical.`);
  };

  const prestigeCost = 1000000;
  const canPrestige = state.totalCoinsEarned >= prestigeCost;
  const visibleBusinesses = getVisibleBusinesses(state.businesses, state.totalCoinsEarned);
  const hiddenBusinessCount = state.businesses.length - visibleBusinesses.length;
  const spaceUnlocked = state.businesses.find((business) => business.id === 'space')?.level ? true : state.totalCoinsEarned >= 500000;
  const visibleResearch = RESEARCH.filter((project, index) => state.research.includes(project.id) || index === state.research.length);

  const prestige = () => {
    if (!canPrestige) return;

    const stars = Math.max(1, Math.floor(state.totalCoinsEarned / prestigeCost));

    setState((previous) => ({
      ...previous,
      coins: 0,
      businesses: BUSINESS_TEMPLATES.map((business) => ({
        ...business,
        level: business.unlockAt === 0 ? 1 : 0,
        automated: false,
      })),
      prestige: previous.prestige + stars,
      totalCoinsEarned: 0,
      lastCollectedAt: Date.now(),
    }));

    setMessage(`✨ Empire rebuilt! You gained ${stars} Bobbb Star${stars === 1 ? '' : 's'}.`);
  };

  const acceptOfflineReward = () => {
    setOfflineReward(0);
    setMessage('Welcome back. Your empire kept working.');
  };

  if (!loaded) {
    return (
      <Card className="max-w-5xl mx-auto p-10 text-center">
        Loading your tiny empire...
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 relative">
      {offlineReward > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-8 space-y-5">
            <div className="text-6xl">💤</div>
            <div>
              <h2 className="text-2xl font-serif font-bold">While you were gone...</h2>
              <p className="text-sm text-slate-500 mt-2">
                Your doppleganger kept working.
              </p>
            </div>
            <p className="text-4xl font-mono font-bold text-amber-500">
              +{format(offlineReward)} 🪙
            </p>
            <Button variant="primary" className="w-full" onClick={acceptOfflineReward}>
              Collect earnings
            </Button>
          </Card>
        </div>
      )}

      <Card className="bg-gradient-to-br from-slate-950 via-amber-950 to-emerald-950 text-white border-none overflow-hidden relative">
        <div className="absolute -right-10 -top-10 text-[180px] opacity-10">🏭</div>

        <div className="relative space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <Badge variant="primary">Idle Empire</Badge>
              <h2 className="text-3xl font-serif font-bold mt-2">Bobbb Tycoon</h2>
              <p className="text-xs text-amber-100/70 mt-1">
                Build increasingly ridiculous businesses and become unnecessarily rich.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-3">
              <Crown className="w-5 h-5 text-amber-300" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-100/60">Bobbb Stars</p>
                <p className="font-bold">{state.prestige} · +{state.prestige * 10}% forever</p>
              </div>
            </div>
          </div>

          <div className="text-center py-3">
            <p className="text-5xl sm:text-6xl font-mono font-bold text-amber-300">
              {format(state.coins)}
            </p>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60 mt-2">
              Mark Coins · +{format(productionRate)}/sec
            </p>
          </div>

          <div className="rounded-2xl bg-black/20 border border-white/10 p-3 text-center text-xs">
            {event === 'frenzy'
              ? `🔥 3× PRODUCTION FRENZY — ${eventSeconds}s remaining`
              : message}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" className="flex-1" onClick={collectBonus}>
              <Coins className="w-4 h-4 mr-2" />
              Collect Bonus
            </Button>

            <Button
              variant="primary"
              className="flex-1"
              disabled={!canPrestige}
              onClick={prestige}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Rebuild his hut
            </Button>
          </div>

          {!canPrestige && (
            <p className="text-center text-[10px] text-amber-100/50">
              Prestige unlocks at {format(prestigeCost)} total coins.
            </p>
          )}
        </div>
      </Card>

      {spaceUnlocked && <Card className="space-y-4 border-indigo-200 dark:border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><Badge variant="primary">Multiverse Lab</Badge><h3 className="font-serif font-bold text-xl mt-2">Dimensions & research</h3><p className="text-xs text-slate-500 mt-1">Build in a straight line: unlock businesses, fund research, then open new dimensions.</p></div><div className="text-right"><p className="text-xs text-slate-500">Dimension multiplier</p><p className="text-2xl font-mono font-bold text-indigo-600">×{state.dimensions}</p></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-4 space-y-2"><div className="flex items-center justify-between"><span className="font-semibold text-sm">Open next dimension</span><span className="text-xs text-slate-500">{state.dimensions}/10</span></div><p className="text-xs text-slate-500">Each dimension multiplies all production. Costs increase with every opening.</p><Button size="sm" variant="primary" disabled={state.coins < dimensionCost || state.dimensions >= 10} onClick={buyDimension}>{state.dimensions >= 10 ? 'All dimensions open' : `Open dimension · ${format(dimensionCost)}`}</Button></div>
          <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 p-4"><div className="flex items-center justify-between"><span className="font-semibold text-sm">Research output</span><span className="text-xs font-mono">{state.research.length}/{RESEARCH.length} complete</span></div><p className="text-xs text-slate-500 mt-2">Permanent multipliers survive prestige.</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">{visibleResearch.map((project) => { const complete = state.research.includes(project.id); return <button key={project.id} disabled={complete || state.coins < project.cost} onClick={() => buyResearch(project.id)} className={`text-left rounded-xl border p-3 ${complete ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'}`}><div className="flex justify-between gap-2"><span className="text-xs font-bold">{project.name}</span><span>{complete ? '✓' : '🔬'}</span></div><p className="text-[10px] text-slate-500 mt-1">{project.description}</p><p className="text-[10px] font-mono text-indigo-600 mt-2">{complete ? 'Complete' : format(project.cost)}</p></button>; })}</div>
      </Card>}

      {event === 'frog' && (
        <Card className="border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Bot className="w-10 h-10 text-emerald-500 animate-bounce" />
            <div>
              <h3 className="font-bold">Frog Investor!</h3>
              <p className="text-xs text-slate-500">Click him before he hops away.</p>
            </div>
          </div>
          <Button variant="primary" onClick={clickFrog}>INVEST 🐸</Button>
        </Card>
      )}

      {event === 'cat' && (
        <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Cat className="w-10 h-10 text-amber-500" />
            <div>
              <h3 className="font-bold">The Cat Tax</h3>
              <p className="text-xs text-slate-500">Click the cat. Something will probably happen.</p>
            </div>
          </div>
          <Button variant="outline" onClick={clickCat}>😼 Pet Cat?</Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleBusinesses.map((business) => {
          const unlocked =
            state.totalCoinsEarned >= business.unlockAt || business.level > 0;

          const cost = getBusinessCost(business);
          const managerCost = Math.floor(cost * 5);
          const rate = getBusinessRate(business);

          return (
            <Card
              key={business.id}
              className={`p-5 space-y-4 ${!unlocked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{business.icon}</div>
                  <div>
                    <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                      {business.name}
                      {business.automated && (
                        <Bot className="w-4 h-4 text-emerald-500" />
                      )}
                    </h3>

                    {unlocked ? (
                      <p className="text-xs text-slate-500">
                        Level {business.level} · {format(rate)}/sec
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Unlock at {format(business.unlockAt)} total coins
                      </p>
                    )}
                  </div>
                </div>

                {business.level > 0 && (
                  <Badge variant="primary">
                    Lv. {business.level}
                  </Badge>
                )}
              </div>

              {unlocked && (
                <>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, (business.level % 10) * 10)}%` }}
                    />
                  </div>

                    <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={state.coins < cost}
                      onClick={() => buyBusiness(business.id)}
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      Upgrade · {format(cost)}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        business.level <= 0 ||
                        business.automated ||
                        state.coins < managerCost
                      }
                      onClick={() => buyManager(business.id)}
                    >
                      <Bot className="w-3.5 h-3.5 mr-1" />
                      {business.automated
                        ? 'Managed'
                        : `Manager · ${format(managerCost)}`}
                    </Button>
                  </div>
                    <div className="flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-[10px] text-slate-400 self-center mr-1">Bulk:</span>{[2, 20, 100].map((quantity) => { const bulkCost = getBulkCost(business, quantity); return <button key={quantity} disabled={state.coins < bulkCost} onClick={() => buyBusiness(business.id, quantity)} className="rounded-lg border border-amber-200 dark:border-amber-900/50 px-2 py-1 text-[10px] font-bold text-amber-700 disabled:opacity-40">×{quantity} · {format(bulkCost)}</button>; })}</div>

                  {business.level > 0 && business.level % 10 === 0 && (
                    <p className="text-[10px] text-emerald-600 font-bold">
                      ⚡ Level milestone! Production doubled.
                    </p>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>

      {hiddenBusinessCount > 0 && <Card className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40"><div className="flex items-center gap-3"><Lock className="w-5 h-5 text-slate-400" /><div><h3 className="font-serif font-semibold">More of his kingdomee is ahead</h3><p className="text-xs text-slate-500 mt-1">{hiddenBusinessCount} later {hiddenBusinessCount === 1 ? 'business' : 'businesses'} unlock in order as your total earnings grow. Current next milestone: {format(visibleBusinesses[visibleBusinesses.length - 1]?.unlockAt || 0)} coins.</p></div></div></Card>}

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-serif font-bold">Your Achievements</h3>
          <span className="ml-auto text-xs text-slate-500">
            {state.achievements.filter((achievement) => achievement.unlocked).length}
            /{state.achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {state.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`rounded-xl border p-3 flex gap-3 ${
                achievement.unlocked
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 opacity-45 grayscale'
              }`}
            >
              <span className="text-2xl">{achievement.icon}</span>
              <div>
                <p className="text-xs font-bold">{achievement.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {achievement.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <Factory className="w-5 h-5 mx-auto text-amber-500" />
          <p className="text-xs text-slate-500 mt-1">Businesses</p>
          <p className="font-bold">{state.businesses.filter((business) => business.level > 0).length}</p>
        </div>
        <div>
          <Coins className="w-5 h-5 mx-auto text-emerald-500" />
          <p className="text-xs text-slate-500 mt-1">Total Earned</p>
          <p className="font-bold">{format(state.totalCoinsEarned)}</p>
        </div>
        <div>
          <Trophy className="w-5 h-5 mx-auto text-sky-500" />
          <p className="text-xs text-slate-500 mt-1">Achievements</p>
          <p className="font-bold">{state.achievements.filter((achievement) => achievement.unlocked).length}</p>
        </div>
        <div>
          <Rocket className="w-5 h-5 mx-auto text-purple-500" />
          <p className="text-xs text-slate-500 mt-1">Prestige</p>
          <p className="font-bold">{state.prestige}</p>
        </div>
      </Card>
    </div>
  );
};