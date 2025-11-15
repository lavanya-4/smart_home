import React from 'react';
import { Activity, Clock, TrendingUp, Signal, AlertTriangle } from 'lucide-react';

/**
 * Standalone visual example of the performance metrics overlay
 * Shows different states: Normal, Low FPS, High Latency
 */
const MetricsOverlayExamples = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Performance Metrics Overlay Examples
          </h1>
          <p className="text-slate-300">
            Visual reference for different performance states
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Example 1: Normal Performance */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Normal Performance
            </h2>
            <div className="bg-black aspect-video rounded-lg relative overflow-hidden">
              {/* Simulated video feed */}
              <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                [Video Feed]
              </div>
              
              {/* Normal Metrics Overlay */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="backdrop-blur-md rounded-lg p-3 border bg-slate-900/60 border-slate-700/50">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* FPS */}
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">FPS</div>
                        <div className="font-bold font-mono text-white">5.2</div>
                      </div>
                    </div>
                    
                    {/* Latency */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Latency</div>
                        <div className="font-bold font-mono text-white">143ms</div>
                      </div>
                    </div>
                    
                    {/* Total Frames */}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Frames</div>
                        <div className="font-bold font-mono text-white">156</div>
                      </div>
                    </div>
                    
                    {/* Dropped Frames */}
                    <div className="flex items-center gap-2">
                      <Signal className="h-4 w-4 text-yellow-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Dropped</div>
                        <div className="font-bold font-mono text-white">
                          42 <span className="text-slate-400 text-[10px]">(27%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Min/Max */}
                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Min: 98ms</span>
                      <span>Max: 287ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>✓ FPS within acceptable range (5.2 fps)</p>
              <p>✓ Latency normal (143ms)</p>
              <p>✓ No performance issues</p>
            </div>
          </div>

          {/* Example 2: Low FPS Warning */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Low FPS Warning
            </h2>
            <div className="bg-black aspect-video rounded-lg relative overflow-hidden">
              {/* Simulated video feed */}
              <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                [Video Feed]
              </div>
              
              {/* Low FPS Warning Overlay */}
              <div className="absolute bottom-3 left-3 right-3 space-y-2">
                <div className="backdrop-blur-md rounded-lg p-3 border bg-red-900/40 border-red-500/50">
                  {/* Warning Header */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-500/30">
                    <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                    <span className="text-red-300 text-xs font-semibold uppercase tracking-wide">
                      Performance Issue
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* FPS - RED */}
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">FPS</div>
                        <div className="font-bold font-mono text-red-300">
                          2.1 <span className="ml-1 text-red-400 text-[10px]">LOW</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Latency - NORMAL */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Latency</div>
                        <div className="font-bold font-mono text-white">156ms</div>
                      </div>
                    </div>
                    
                    {/* Total Frames */}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Frames</div>
                        <div className="font-bold font-mono text-white">89</div>
                      </div>
                    </div>
                    
                    {/* Dropped Frames */}
                    <div className="flex items-center gap-2">
                      <Signal className="h-4 w-4 text-yellow-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Dropped</div>
                        <div className="font-bold font-mono text-white">
                          12 <span className="text-slate-400 text-[10px]">(13%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Min: 102ms</span>
                      <span>Max: 234ms</span>
                    </div>
                  </div>
                </div>
                
                {/* Performance Tips */}
                <div className="bg-yellow-900/40 backdrop-blur-md border border-yellow-500/50 rounded-lg p-2">
                  <div className="text-[10px] text-yellow-200">
                    • Low FPS: Check network connection or reduce frame quality
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>⚠ FPS below threshold (2.1 {"<"} 3)</p>
              <p>✓ Latency acceptable (156ms)</p>
              <p>⚠ Red warning displayed</p>
            </div>
          </div>

          {/* Example 3: High Latency Warning */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              High Latency Warning
            </h2>
            <div className="bg-black aspect-video rounded-lg relative overflow-hidden">
              {/* Simulated video feed */}
              <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                [Video Feed]
              </div>
              
              {/* High Latency Warning Overlay */}
              <div className="absolute bottom-3 left-3 right-3 space-y-2">
                <div className="backdrop-blur-md rounded-lg p-3 border bg-red-900/40 border-red-500/50">
                  {/* Warning Header */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-500/30">
                    <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                    <span className="text-red-300 text-xs font-semibold uppercase tracking-wide">
                      Performance Issue
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* FPS - NORMAL */}
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">FPS</div>
                        <div className="font-bold font-mono text-white">4.8</div>
                      </div>
                    </div>
                    
                    {/* Latency - RED */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Latency</div>
                        <div className="font-bold font-mono text-red-300">
                          2341ms <span className="ml-1 text-red-400 text-[10px]">HIGH</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Total Frames */}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Frames</div>
                        <div className="font-bold font-mono text-white">203</div>
                      </div>
                    </div>
                    
                    {/* Dropped Frames */}
                    <div className="flex items-center gap-2">
                      <Signal className="h-4 w-4 text-yellow-400" />
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Dropped</div>
                        <div className="font-bold font-mono text-white">
                          67 <span className="text-slate-400 text-[10px]">(33%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Min: 1987ms</span>
                      <span>Max: 3124ms</span>
                    </div>
                  </div>
                </div>
                
                {/* Performance Tips */}
                <div className="bg-yellow-900/40 backdrop-blur-md border border-yellow-500/50 rounded-lg p-2">
                  <div className="text-[10px] text-yellow-200">
                    • High latency: Network delay detected (2341ms)
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>✓ FPS acceptable (4.8 fps)</p>
              <p>⚠ Latency too high (2341ms {">"} 2000ms)</p>
              <p>⚠ Red warning displayed</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Metrics Legend</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <strong>FPS (Frames Per Second)</strong>
                  <p className="text-slate-600 text-xs">Rolling average over last 10 frames</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <strong>Latency</strong>
                  <p className="text-slate-600 text-xs">Time from device capture to client display</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <strong>Total Frames</strong>
                  <p className="text-slate-600 text-xs">All frames received from device</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Signal className="h-5 w-5 text-yellow-600" />
                <div>
                  <strong>Dropped Frames</strong>
                  <p className="text-slate-600 text-xs">Frames skipped due to rate limiting</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Warning Thresholds</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-slate-700"><strong>Low FPS:</strong> {"<"} 3 fps</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-slate-700"><strong>High Latency:</strong> {">"} 2000ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsOverlayExamples;
