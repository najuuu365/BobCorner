import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { motion } from 'framer-motion';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

import { useToast } from '../context/ToastContext';

import {
  Flower2,
  Droplets,
  Plus,
  Trash2,
  Sparkles,
  Sprout,
  Timer,
} from 'lucide-react';

import { gardenApi } from '../services/gardenApi';

import {
  GardenPlant,
  GardenDecoration,
} from '../types';

import confetti from 'canvas-confetti';
import { PerformancePanel } from '../components/ui/PerformancePanel';

const PLANT_STAGE_EMOJIS: Record<
  string,
  Record<number, string>
> = {
  SUNFLOWER: {
    1: '🌰',
    2: '🌱',
    3: '🌿',
    4: '🌻',
  },

  MONSTERA: {
    1: '🌰',
    2: '🌱',
    3: '🌿',
    4: '🪴',
  },

  ROSES: {
    1: '🌰',
    2: '🌱',
    3: '🌿',
    4: '🌹',
  },

  TULIPS: {
    1: '🌰',
    2: '🌱',
    3: '🌿',
    4: '🌷',
  },

  SUCCULENT: {
    1: '🌰',
    2: '🌱',
    3: '🌿',
    4: '🌵',
  },
};

const WATER_COOLDOWN = 10;
const DECORATION_OPTIONS = [
  { key: 'BENCH', label: 'Bench', emoji: '🪑' },
  { key: 'FOUNTAIN', label: 'Fountain', emoji: '⛲' },
  { key: 'LANTERN', label: 'Lantern', emoji: '🏮' },
  { key: 'FENCE', label: 'Fence', emoji: '🪵' },
];

export const GardenPage: React.FC = () => {
  const { showToast } = useToast();

  const [plants, setPlants] = useState<
    GardenPlant[]
  >([]);

  const [decorations, setDecorations] = useState<
    GardenDecoration[]
  >([]);

  const [isPlantModalOpen, setIsPlantModalOpen] =
    useState(false);

  const [selectedPlantType, setSelectedPlantType] =
    useState('SUNFLOWER');

  const [cooldowns, setCooldowns] = useState<
    Record<string, number>
  >({});

  const [removingPlantId, setRemovingPlantId] =
    useState<string | null>(null);
  const [visitorMet, setVisitorMet] = useState(false);

  const loadGarden = useCallback(async () => {
    try {
      const res =
        await gardenApi.getGardenState();

      setPlants(res.plants);
      setDecorations(res.decorations);
      const restoredCooldowns: Record<string, number> = {};
      res.plants.forEach((plant) => {
        if (plant.lastWateredAt) {
          const remaining = Math.ceil(10 - (Date.now() - new Date(plant.lastWateredAt).getTime()) / 1000);
          if (remaining > 0) restoredCooldowns[plant.id] = remaining;
        }
      });
      setCooldowns(restoredCooldowns);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadGarden();
  }, [loadGarden]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns((previous) => {
        const updated: Record<string, number> = {};
        let hasChanges = false;

        Object.entries(previous).forEach(
          ([plantId, seconds]) => {
            if (seconds > 1) {
              updated[plantId] = seconds - 1;
              hasChanges = true;
            } else {
              hasChanges = true;
            }
          }
        );

        return hasChanges ? updated : previous;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleWater = async (
    plant: GardenPlant
  ) => {
    if (plant.stage >= 4) {
      showToast(
        'This plant is already living its best life 🌻',
        'info'
      );

      return;
    }

    if (cooldowns[plant.id]) {
      return;
    }

    try {
      const previousStage = plant.stage;

      const updated =
        await gardenApi.waterPlant(plant.id);

      setPlants((previous) =>
        previous.map((p) =>
          p.id === plant.id
            ? updated
            : p
        )
      );

      setCooldowns((previous) => ({
        ...previous,
        [plant.id]: WATER_COOLDOWN,
      }));

      if (updated.stage > previousStage) {
        if (updated.stage === 4) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: {
              y: 0.6,
            },
          });

          showToast(
            '🌻 FULL BLOOM! Your plant made it!!',
            'success'
          );
        } else {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: {
              y: 0.7,
            },
          });

          showToast(
            `🌱 Your plant grew to Stage ${updated.stage}!`,
            'success'
          );
        }
      } else {
        showToast(
          'gulp gulp... hydration acquired 💧',
          'success'
        );
      }
    } catch (error: any) {
      showToast(
        error.message ||
          'Something went wrong while watering.',
        'error'
      );
    }
  };

  const handleRemovePlant = async () => {
    if (!removingPlantId) {
      return;
    }

    try {
      await gardenApi.removePlant(
        removingPlantId
      );

      setPlants((previous) =>
        previous.filter(
          (plant) =>
            plant.id !== removingPlantId
        )
      );

      setRemovingPlantId(null);

      showToast(
        'The plant has been removed 🌱',
        'success'
      );
    } catch (error: any) {
      showToast(
        error.message ||
          'Could not remove plant.',
        'error'
      );
    }
  };

  const handlePlantSeed = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      const newPlant =
        await gardenApi.plantSeed(
          selectedPlantType
        );

      setPlants((previous) => [
        ...previous,
        newPlant,
      ]);

      showToast(
        'A tiny new life has entered the garden 🌱',
        'success'
      );

      setIsPlantModalOpen(false);
    } catch (error: any) {
      showToast(
        error.message ||
          'Could not plant seed.',
        'error'
      );
    }
  };

  const handleVisitor = async () => {
    try {
      const result = await gardenApi.interactWithVisitor();
      setVisitorMet(true);
      showToast(result.alreadyMet ? 'Your visitor has already said hello today.' : `The ${result.visitor} left you ${result.reward} XP!`, result.alreadyMet ? 'info' : 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The visitor scampered away.', 'error');
    }
  };

  const handlePlaceDecoration = async (itemKey: string) => {
    try {
      const decoration = await gardenApi.placeDecoration(itemKey, decorations.length % 4, Math.floor(decorations.length / 4));
      setDecorations((previous) => [...previous, decoration]);
      showToast('A new garden detail has been placed.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not place decoration.', 'error');
    }
  };

  const handleRemoveDecoration = async (decorationId: string) => {
    if (!window.confirm('Remove this garden decoration?')) return;
    await gardenApi.removeDecoration(decorationId);
    setDecorations((previous) => previous.filter((decoration) => decoration.id !== decorationId));
  };

  const getStageLabel = (stage: number) => {
    if (stage === 4) {
      return 'Full Bloom';
    }

    if (stage === 3) {
      return 'Growing';
    }

    if (stage === 2) {
      return 'Sprout';
    }

    return 'Seed';
  };

  const getWaterProgress = (
    waterPoints: number,
    stage: number
  ) => {
    if (stage >= 4) {
      return 100;
    }

    const currentStageStart =
      (stage - 1) * 30;

    return Math.min(
      100,
      ((waterPoints -
        currentStageStart) /
        30) *
        100
    );
  };

  const gardenXp = plants.reduce((total, plant) => total + plant.waterPoints, 0) + plants.filter((plant) => plant.stage === 4).length * 25;
  const gardenLevel = Math.floor(gardenXp / 100) + 1;
  const visitors = ['🐸 Frog visitor', '🦋 Butterfly visitor', '🐝 Bee visitor', '🐞 Ladybug visitor', '🐌 Snail visitor'];
  const dailyVisitor = visitors[new Date().getDate() % visitors.length];
  const hour = new Date().getHours();
  const isNight = hour < 7 || hour >= 19;
  const weather = ['Clear skies', 'Soft rain', 'Breezy', 'Golden afternoon'][new Date().getDate() % 4];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">

            Virtual Garden Sanctuary

            <Flower2 className="w-6 h-6 text-emerald-600" />

          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            A tiny place where your plants grow with you 🌱
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() =>
            setIsPlantModalOpen(true)
          }
          icon={
            <Plus className="w-4 h-4" />
          }
        >
          Plant New Seed
        </Button>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50">
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Garden level</span>
          <p className="text-2xl font-mono font-bold text-emerald-900 dark:text-emerald-100 mt-1">{gardenLevel}</p>
          <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">{gardenXp} growth XP</p>
        </Card>
        <Card className="bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50">
          <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">Today's visitor</span>
          <p className="font-serif font-bold text-sky-900 dark:text-sky-100 mt-2">{dailyVisitor}</p>
          <div className="flex items-center justify-between gap-2 mt-2">
            <p className="text-xs text-sky-700/70 dark:text-sky-300/70">Come back tomorrow for a new guest.</p>
            <Button size="sm" variant="outline" disabled={visitorMet} onClick={handleVisitor}>{visitorMet ? 'Visited' : 'Say hello'}</Button>
          </div>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Bloom count</span>
          <p className="text-2xl font-mono font-bold text-amber-900 dark:text-amber-100 mt-1">{plants.filter((plant) => plant.stage === 4).length}</p>
          <p className="text-xs text-amber-700/70 dark:text-amber-300/70">full-grown plants</p>
        </Card>
      </div>

      <Card className={`${isNight ? 'bg-indigo-950/20 border-indigo-300/40' : 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50'} flex flex-wrap items-center justify-between gap-3`}>
        <div><span className="text-[10px] uppercase font-bold text-slate-500">Garden ambience</span><p className="font-serif font-semibold text-slate-900 dark:text-white mt-1">{isNight ? '🌙 Night garden' : '☀️ Day garden'} · {weather}</p></div>
        <span className="text-xs text-slate-500">{isNight ? 'The flowers are resting.' : 'A good time to tend the beds.'}</span>
      </Card>
      <PerformancePanel title="Garden performance report" subtitle="Growth and care progress from your planted beds." metrics={[
        { label: 'Growth XP', value: gardenXp, detail: `level ${gardenLevel}`, tone: 'emerald' },
        { label: 'Plants', value: plants.length, detail: 'currently planted', tone: 'sky' },
        { label: 'Blooms', value: plants.filter((plant) => plant.stage === 4).length, detail: 'full-grown', tone: 'amber' },
        { label: 'Details', value: decorations.length, detail: 'decorations placed', tone: 'violet' },
      ]} />

      <Card className="space-y-4">
        <div>
          <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Garden details</h3>
          <p className="text-xs text-slate-500 mt-1">Place small comforts around your growing space.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DECORATION_OPTIONS.map((option) => (
            <Button key={option.key} size="sm" variant="outline" onClick={() => handlePlaceDecoration(option.key)} icon={<span>{option.emoji}</span>}>Add {option.label}</Button>
          ))}
        </div>
        {decorations.length > 0 && <div className="flex flex-wrap gap-2 border-t border-haven-100 dark:border-slate-800 pt-3">
          {decorations.map((decoration) => {
            const option = DECORATION_OPTIONS.find((item) => item.key === decoration.itemKey);
            return <button key={decoration.id} onClick={() => handleRemoveDecoration(decoration.id)} className="px-3 py-1.5 rounded-lg bg-haven-100 dark:bg-slate-800 text-xs font-semibold" title="Remove decoration">{option?.emoji} {option?.label || decoration.itemKey}</button>;
          })}
        </div>}
      </Card>

      <div className="p-6 rounded-3xl border border-emerald-500/20 shadow-xl space-y-6 bg-gradient-to-b from-emerald-900/10 via-amber-900/10 to-emerald-950/20 dark:from-slate-900 dark:to-slate-900">

        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">

          <Badge variant="success">
            🌱 Garden Plants ({plants.length})
          </Badge>

          <span className="text-xs font-mono text-slate-500">
            Water them, but don't drown them.
          </span>

        </div>

        {plants.length === 0 ? (

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="py-16 text-center space-y-4"
          >

            <div className="text-7xl">
              🪴
            </div>

            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                Your garden is waiting...
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Plant something and give this
                little place some life.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() =>
                setIsPlantModalOpen(true)
              }
              icon={
                <Sprout className="w-4 h-4" />
              }
            >
              Plant Your First Seed
            </Button>

          </motion.div>

        ) : (

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">

            {plants.map((plant) => {
              const emojis =
                PLANT_STAGE_EMOJIS[
                  plant.plantType
                ] ||
                PLANT_STAGE_EMOJIS.SUNFLOWER;

              const currentEmoji =
                emojis[plant.stage] ||
                '🌱';

              const isBloom =
                plant.stage === 4;

              const cooldown =
                cooldowns[plant.id] || 0;

              const progress =
                getWaterProgress(
                  plant.waterPoints,
                  plant.stage
                );

              return (

                <motion.div
                  key={plant.id}
                  layout
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  whileHover={{
                    scale: 1.03,
                  }}
                >

                  <Card className="p-4 text-center space-y-3 relative overflow-hidden bg-white/90 dark:bg-slate-900/90 border-emerald-200 dark:border-slate-800">

                    {isBloom && (

                      <motion.div
                        animate={{
                          opacity: [
                            0.2,
                            0.8,
                            0.2,
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                        className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-emerald-200/20 pointer-events-none"
                      />

                    )}

                    <button
                      onClick={() =>
                        setRemovingPlantId(
                          plant.id
                        )
                      }
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remove plant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <motion.div
                      animate={
                        isBloom
                          ? {
                              y: [
                                0,
                                -3,
                                0,
                              ],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 flex items-center justify-center text-4xl shadow-inner"
                    >
                      {currentEmoji}
                    </motion.div>

                    <div>

                      <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white capitalize">
                        {plant.plantType.toLowerCase()}
                      </h3>

                      <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">

                        Stage {plant.stage}:{' '}

                        {getStageLabel(
                          plant.stage
                        )}

                      </span>

                    </div>

                    <div className="space-y-1">

                      <div className="flex justify-between text-[10px] font-semibold text-slate-500">

                        <span>
                          Growth
                        </span>

                        <span>
                          {plant.waterPoints} / 90
                        </span>

                      </div>

                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">

                        <motion.div
                          className="h-full bg-gradient-to-r from-sky-400 to-emerald-500 rounded-full"
                          animate={{
                            width: `${progress}%`,
                          }}
                        />

                      </div>

                    </div>

                    {isBloom ? (

                      <div className="py-2 text-xs font-bold text-amber-600 flex items-center justify-center gap-1">

                        <Sparkles className="w-3.5 h-3.5" />

                        Fully Grown!

                      </div>

                    ) : (

                      <Button
                        size="sm"
                        variant="primary"
                        disabled={cooldown > 0}
                        onClick={() =>
                          handleWater(plant)
                        }
                        className="w-full"
                        icon={
                          cooldown > 0 ? (
                            <Timer className="w-3.5 h-3.5" />
                          ) : (
                            <Droplets className="w-3.5 h-3.5 text-sky-400" />
                          )
                        }
                      >

                        {cooldown > 0
                          ? `Resting... ${cooldown}s`
                          : 'Water Plant'}

                      </Button>

                    )}

                  </Card>

                </motion.div>

              );
            })}

          </div>

        )}

      </div>

      <Modal
        isOpen={isPlantModalOpen}
        onClose={() =>
          setIsPlantModalOpen(false)
        }
        title="Plant a New Seed"
      >

        <form
          onSubmit={handlePlantSeed}
          className="space-y-4"
        >

          <div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Select Seed
            </label>

            <select
              value={selectedPlantType}
              onChange={(e) =>
                setSelectedPlantType(
                  e.target.value
                )
              }
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
            >

              <option value="SUNFLOWER">
                🌻 Sunflower
              </option>

              <option value="MONSTERA">
                🪴 Monstera
              </option>

              <option value="ROSES">
                🌹 Rose Bush
              </option>

              <option value="TULIPS">
                🌷 Tulips
              </option>

              <option value="SUCCULENT">
                🌵 Succulent
              </option>

            </select>

          </div>

          <div className="flex justify-end gap-2 pt-2">

            <Button
              variant="ghost"
              type="button"
              onClick={() =>
                setIsPlantModalOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
            >
              Plant Seed 🌱
            </Button>

          </div>

        </form>

      </Modal>

      <Modal
        isOpen={
          removingPlantId !== null
        }
        onClose={() =>
          setRemovingPlantId(null)
        }
        title="Remove this plant?"
      >

        <div className="space-y-5">

          <div className="text-center text-5xl">
            🥺🌱
          </div>

          <p className="text-sm text-slate-500 text-center">
            Are you sure you want to remove this
            plant from your garden?
          </p>

          <div className="flex justify-end gap-2">

            <Button
              variant="ghost"
              onClick={() =>
                setRemovingPlantId(null)
              }
            >
              Keep It
            </Button>

            <Button
              variant="primary"
              onClick={handleRemovePlant}
              icon={
                <Trash2 className="w-4 h-4" />
              }
            >
              Remove Plant
            </Button>

          </div>

        </div>

      </Modal>

    </div>
  );
};