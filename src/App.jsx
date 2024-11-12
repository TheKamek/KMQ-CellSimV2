/* eslint-disable no-unused-vars */
// src/App.jsx
import { useState, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from './components/ui/card';
import { Slider } from './components/ui/slider';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Play, Pause, Plus, Ban, RotateCcw, Leaf } from 'lucide-react';
import { useSimulation } from './hooks/useSimulation';

export default function App() {
  const [settings, setSettings] = useState({
    strengthThreshold: 60,
    mergeSpeedBonus: 150,
    foodSpawnRate: 5,
    foodSpawningEnabled: true,
    mutationRate: 0.1,
    environmentalFactors: {
      temperature: 1,
      resources: 1,
      predatorPressure: 1,
    },
  });

  const [statsHistory, setStatsHistory] = useState([]);

  const { canvasRef, stats, selectedCell, isRunning, isPaused, controls } =
    useSimulation(settings);

  // Update stats history for charts
  const updateStatsHistory = useCallback((currentStats) => {
    setStatsHistory((prev) => {
      const newHistory = [
        ...prev,
        {
          time: Date.now(),
          cells: currentStats.cells,
          food: currentStats.food,
          avgEnergy: currentStats.averageEnergy,
          dominantTrait: currentStats.dominantTrait,
        },
      ].slice(-50); // Keep last 50 data points
      return newHistory;
    });
  }, []);

  // Settings handlers
  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleEnvironmentalFactorChange = (factor, value) => {
    setSettings((prev) => ({
      ...prev,
      environmentalFactors: {
        ...prev.environmentalFactors,
        [factor]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-900 text-white">
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onClick={controls.handleCellClick}
        className="absolute inset-0"
        width={600} // Add these two lines
        height={300} // with your desired dimensions
        style={{ background: '#1a1a1a', width: '60%', height: '60%' }}
      />

      {/* Control Panel */}
      <div className="fixed top-4 left-4 w-80 space-y-4">
        <Card className="bg-black/50 backdrop-blur-sm border-gray-700">
          <CardContent className="p-4 space-y-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={controls.togglePause}
                className="w-10 h-10"
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={controls.addCell}
                className="w-10 h-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => controls.toggleSimulation()}
                className="w-10 h-10"
              >
                <Ban className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={controls.reset}
                className="w-10 h-10"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleSettingChange(
                    'foodSpawningEnabled',
                    !settings.foodSpawningEnabled
                  )
                }
                className={`w-10 h-10 ${
                  settings.foodSpawningEnabled ? 'bg-green-500/20' : ''
                }`}
              >
                <Leaf className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Strength Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Strength Threshold</label>
                  <span className="text-sm">{settings.strengthThreshold}</span>
                </div>
                <Slider
                  value={[settings.strengthThreshold]}
                  onValueChange={([value]) =>
                    handleSettingChange('strengthThreshold', value)
                  }
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {/* Merge Speed Bonus */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Merge Speed Bonus</label>
                  <span className="text-sm">{settings.mergeSpeedBonus}%</span>
                </div>
                <Slider
                  value={[settings.mergeSpeedBonus]}
                  onValueChange={([value]) =>
                    handleSettingChange('mergeSpeedBonus', value)
                  }
                  min={100}
                  max={300}
                  step={5}
                />
              </div>

              {/* Food Spawn Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Food Spawn Rate</label>
                  <span className="text-sm">{settings.foodSpawnRate}</span>
                </div>
                <Slider
                  value={[settings.foodSpawnRate]}
                  onValueChange={([value]) =>
                    handleSettingChange('foodSpawnRate', value)
                  }
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              {/* Mutation Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Mutation Rate</label>
                  <span className="text-sm">
                    {(settings.mutationRate * 100).toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[settings.mutationRate * 100]}
                  onValueChange={([value]) =>
                    handleSettingChange('mutationRate', value / 100)
                  }
                  min={0}
                  max={50}
                  step={1}
                />
              </div>

              {/* Environmental Factors */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Environmental Factors</h3>
                {Object.entries(settings.environmentalFactors).map(
                  ([factor, value]) => (
                    <div key={factor} className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm capitalize">{factor}</label>
                        <span className="text-sm">{value.toFixed(2)}x</span>
                      </div>
                      <Slider
                        value={[value * 100]}
                        onValueChange={([newValue]) =>
                          handleEnvironmentalFactorChange(
                            factor,
                            newValue / 100
                          )
                        }
                        min={0}
                        max={200}
                        step={5}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Panel */}
      <div className="fixed top-4 right-4 w-80 space-y-4">
        <Card className="bg-black/50 backdrop-blur-sm border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Cells</span>
                <span>{stats.cells}</span>
              </div>
              <div className="flex justify-between">
                <span>Food</span>
                <span>{stats.food}</span>
              </div>
              <div className="flex justify-between">
                <span>FPS</span>
                <span>{stats.fps}</span>
              </div>
              <div className="flex justify-between">
                <span>Generation</span>
                <span>{stats.generation}</span>
              </div>
              <div className="flex justify-between">
                <span>Births</span>
                <span>{stats.totalBirths}</span>
              </div>
              <div className="flex justify-between">
                <span>Deaths</span>
                <span>{stats.totalDeaths}</span>
              </div>
              <div className="flex justify-between">
                <span>Dominant Trait</span>
                <span>{stats.dominantTrait}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Population Chart */}
        <Card className="bg-black/50 backdrop-blur-sm border-gray-700">
          <CardContent className="p-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000',
                      border: 'none',
                      borderRadius: '4px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cells"
                    stroke="#8884d8"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="food"
                    stroke="#82ca9d"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Cell Info */}
      {selectedCell && (
        <div className="fixed bottom-4 left-4 w-80">
          <Card className="bg-black/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-2">Selected Cell</h3>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  {selectedCell.traits.map((trait) => (
                    <span
                      key={trait}
                      className="px-2 py-1 rounded text-sm"
                      style={{
                        backgroundColor: `${
                          selectedCell.traits.includes(trait)
                            ? 'rgba(255,255,255,0.1)'
                            : 'transparent'
                        }`,
                      }}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Energy</span>
                    <span>{selectedCell.energy.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strength</span>
                    <span>{selectedCell.strength.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed</span>
                    <span>{selectedCell.speed.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size</span>
                    <span>{selectedCell.radius.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energy Loss</span>
                    <span>{selectedCell.energyLoss.toFixed(3)}/tick</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
