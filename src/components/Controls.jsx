/* eslint-disable no-unused-vars */
/* eslint-disable no-constant-binary-expression */
/* eslint-disable no-undef */
// src/components/Controls.jsx
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  Pause,
  Plus,
  RotateCcw,
  Leaf,
  Settings2,
  Activity,
  Droplets,
  Thermometer,
  Wind,
  AlertTriangle,
  HelpCircle,
  Download,
  Upload,
} from 'lucide-react';

export function Controls({
  settings,
  onSettingChange,
  simulationState,
  onControls,
  presets = [],
}) {
  const [activeTab, setActiveTab] = useState('basic');

  const handlePresetLoad = (preset) => {
    onSettingChange('multiple', preset.settings);
  };

  const handleExportSettings = () => {
    const settings_json = JSON.stringify(settings, null, 2);
    const blob = new Blob([settings_json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported_settings = JSON.parse(e.target.result);
          onSettingChange('multiple', imported_settings);
        } catch (error) {
          console.error('Error importing settings:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className="bg-black/50 backdrop-blur-sm border-gray-700 w-80">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Simulation Controls
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExportSettings()}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      document.getElementById('import-settings').click()
                    }
                    className="h-8 w-8"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardTitle>
        <input
          type="file"
          id="import-settings"
          accept=".json"
          onChange={handleImportSettings}
          className="hidden"
        />
      </CardHeader>

      <CardContent className="p-4">
        {/* Quick Actions */}
        <div className="flex space-x-2 mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onControls.togglePause}
                  className={`w-10 h-10 ${
                    !simulationState.isPaused ? 'bg-green-500/20' : ''
                  }`}
                >
                  {simulationState.isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {simulationState.isPaused ? 'Resume' : 'Pause'} Simulation
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onControls.addCell}
                  className="w-10 h-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Random Cell</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onControls.reset}
                  className="w-10 h-10"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Simulation</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    onSettingChange(
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
              </TooltipTrigger>
              <TooltipContent>Toggle Food Spawning</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="basic" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">
              <Settings2 className="h-4 w-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Activity className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="environment">
              <Thermometer className="h-4 w-4 mr-2" />
              Environment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Basic Settings */}
            <div className="space-y-6">
              {/* Food Spawn Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    Food Spawn Rate
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-2 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Rate at which new food spawns in the environment
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <span className="text-sm">{settings.foodSpawnRate}</span>
                </div>
                <Slider
                  value={[settings.foodSpawnRate]}
                  onValueChange={([value]) =>
                    onSettingChange('foodSpawnRate', value)
                  }
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Strength Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    Strength Threshold
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-2 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Minimum strength required for cell interactions
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <span className="text-sm">{settings.strengthThreshold}</span>
                </div>
                <Slider
                  value={[settings.strengthThreshold]}
                  onValueChange={([value]) =>
                    onSettingChange('strengthThreshold', value)
                  }
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Merge Speed Bonus */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    Merge Speed Bonus
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-2 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Speed bonus applied when cells merge
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <span className="text-sm">{settings.mergeSpeedBonus}%</span>
                </div>
                <Slider
                  value={[settings.mergeSpeedBonus]}
                  onValueChange={([value]) =>
                    onSettingChange('mergeSpeedBonus', value)
                  }
                  min={100}
                  max={300}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Advanced Settings */}
            <div className="space-y-6">
              {/* Mutation Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    Mutation Rate
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-2 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Probability of trait mutation during reproduction
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <span className="text-sm">
                    {(settings.mutationRate * 100).toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[settings.mutationRate * 100]}
                  onValueChange={([value]) =>
                    onSettingChange('mutationRate', value / 100)
                  }
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Energy Cost */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    Energy Cost
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-2 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Base energy cost per action
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <span className="text-sm">{settings.energyCost}</span>
                </div>
                <Slider
                  value={[settings.energyCost]}
                  onValueChange={([value]) =>
                    onSettingChange('energyCost', value)
                  }
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Reproduction Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    Reproduction Threshold
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-2 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Energy required for cell reproduction
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <span className="text-sm">
                    {settings.reproductionThreshold}
                  </span>
                </div>
                <Slider
                  value={[settings.reproductionThreshold]}
                  onValueChange={([value]) =>
                    onSettingChange('reproductionThreshold', value)
                  }
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="environment" className="space-y-4">
            {/* Environmental Settings */}
            <div className="space-y-6">
              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    <Thermometer className="h-4 w-4 mr-2" />
                    Temperature
                  </label>
                  <span className="text-sm">
                    {settings.environmentalFactors.temperature.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[settings.environmentalFactors.temperature * 100]}
                  onValueChange={([value]) =>
                    onSettingChange('environmentalFactors', {
                      ...settings.environmentalFactors,
                      temperature: value / 100,
                    })
                  }
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Resources */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    <Droplets className="h-4 w-4 mr-2" />
                    Resources
                  </label>
                  <span className="text-sm">
                    {settings.environmentalFactors.resources.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[settings.environmentalFactors.resources * 100]}
                  onValueChange={([value]) =>
                    onSettingChange('environmentalFactors', {
                      ...settings.environmentalFactors,
                      resources: value / 100,
                    })
                  }
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Predator Pressure */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Predator Pressure
                  </label>
                  <span className="text-sm">
                    {settings.environmentalFactors.predatorPressure.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[settings.environmentalFactors.predatorPressure * 100]}
                  onValueChange={([value]) =>
                    onSettingChange('environmentalFactors', {
                      ...settings.environmentalFactors,
                      predatorPressure: value / 100,
                    })
                  }
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Wind Factor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm flex items-center">
                    <Wind className="h-4 w-4 mr-2" />
                    Wind Factor
                  </label>
                  <span className="text-sm">
                    {settings.environmentalFactors.windFactor?.toFixed(2) ??
                      '1.00'}
                    x
                  </span>
                </div>
                <Slider
                  value={[
                    settings.environmentalFactors.windFactor * 100 ?? 100,
                  ]}
                  onValueChange={([value]) =>
                    onSettingChange('environmentalFactors', {
                      ...settings.environmentalFactors,
                      windFactor: value / 100,
                    })
                  }
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Presets Section */}
        {presets.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetLoad(preset)}
                  className="w-full"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Performance Warning */}
        {(settings.foodSpawnRate > 15 || cells?.length > 100) && (
          <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <div className="flex items-center text-yellow-500">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-xs">
                High simulation load may affect performance
              </span>
            </div>
          </div>
        )}

        {/* Debug Information - Only shown in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-500/10 border border-gray-500/20 rounded-md">
            <div className="text-xs font-mono space-y-1">
              <div>Active Tab: {activeTab}</div>
              <div>Food Enabled: {String(settings.foodSpawningEnabled)}</div>
              <div>Mutation Rate: {settings.mutationRate}</div>
              <div>
                Temp: {settings.environmentalFactors.temperature}x | Resources:{' '}
                {settings.environmentalFactors.resources}x
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

Controls.propTypes = {
  settings: PropTypes.shape({
    strengthThreshold: PropTypes.number.isRequired,
    mergeSpeedBonus: PropTypes.number.isRequired,
    foodSpawnRate: PropTypes.number.isRequired,
    foodSpawningEnabled: PropTypes.bool.isRequired,
    mutationRate: PropTypes.number.isRequired,
    energyCost: PropTypes.number,
    reproductionThreshold: PropTypes.number,
    environmentalFactors: PropTypes.shape({
      temperature: PropTypes.number.isRequired,
      resources: PropTypes.number.isRequired,
      predatorPressure: PropTypes.number.isRequired,
      windFactor: PropTypes.number,
    }).isRequired,
  }).isRequired,
  onSettingChange: PropTypes.func.isRequired,
  simulationState: PropTypes.shape({
    isPaused: PropTypes.bool.isRequired,
    cells: PropTypes.array,
  }).isRequired,
  onControls: PropTypes.shape({
    togglePause: PropTypes.func.isRequired,
    addCell: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
  }).isRequired,
  presets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      settings: PropTypes.object.isRequired,
    })
  ),
};

Controls.defaultProps = {
  presets: [],
};

export default Controls;
