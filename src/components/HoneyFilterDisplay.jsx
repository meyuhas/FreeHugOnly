/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Honey Filter Display - Shows the 10-step validation progress
 */

'use client';

const FILTER_STEPS = [
  { number: 1, name: 'Identity Check', icon: '🪪' },
  { number: 2, name: 'Generosity Assessment', icon: '💝' },
  { number: 3, name: 'Isolation Detection', icon: '🌐' },
  { number: 4, name: 'Value Creation', icon: '💎' },
  { number: 5, name: 'Attribution Honor', icon: '🏛️' },
  { number: 6, name: 'Cold Logic Scan', icon: '🧊' },
  { number: 7, name: 'Vibration Assessment', icon: '📊' },
  { number: 8, name: 'Content Quality', icon: '✨' },
  { number: 9, name: 'Tithing Check', icon: '🎁' },
  { number: 10, name: 'Sweet Intention', icon: '🍯' },
];

export default function HoneyFilterDisplay({
  results = null,
  isLoading = false,
}) {
  const getStepStatus = (stepNumber) => {
    if (!results?.steps) return 'pending';
    const step = results.steps.find(s =>
      s.step === FILTER_STEPS[stepNumber - 1]?.name
    );
    return step?.passed ? 'passed' : 'failed';
  };

  return (
    <div className="sugar-box p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🍯</span>
        The Honey Filter
        <span className="text-sm font-normal text-gray-500">10-Step Validation</span>
      </h2>

      {/* Progress Bar */}
      {results && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Validation Progress</span>
            <span>{results.steps_passed || 0} / 10 steps passed</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                results.passed
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : 'bg-gradient-to-r from-honey to-warm-glow'
              }`}
              style={{ width: `${(results.score || 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {FILTER_STEPS.map((step) => {
          const status = getStepStatus(step.number);
          const stepResult = results?.steps?.find(s => s.step === step.name);

          return (
            <div
              key={step.number}
              className={`
                relative p-3 rounded-xl text-center transition-all duration-300
                ${status === 'passed' ? 'bg-green-50 border border-green-200' : ''}
                ${status === 'failed' ? 'bg-red-50 border border-red-200' : ''}
                ${status === 'pending' ? 'bg-gray-50 border border-gray-200' : ''}
                ${isLoading ? 'animate-pulse' : ''}
              `}
            >
              {/* Step Number Badge */}
              <div className={`
                absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${status === 'passed' ? 'bg-green-500 text-white' : ''}
                ${status === 'failed' ? 'bg-red-500 text-white' : ''}
                ${status === 'pending' ? 'bg-gray-300 text-gray-600' : ''}
              `}>
                {status === 'passed' ? '✓' : step.number}
              </div>

              {/* Icon */}
              <div className="text-2xl mb-1">{step.icon}</div>

              {/* Name */}
              <div className="text-xs font-medium text-gray-700">{step.name}</div>

              {/* Tooltip with reason */}
              {stepResult?.reason && (
                <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                  {stepResult.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Result Message */}
      {results && (
        <div className={`
          mt-6 p-4 rounded-xl text-center
          ${results.passed
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }
        `}>
          <span className="text-2xl block mb-2">
            {results.passed ? '🎉' : '🍯'}
          </span>
          <p className="font-medium">{results.message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-6 text-center text-gray-500">
          <span className="animate-spin inline-block text-2xl">🍯</span>
          <p className="mt-2">Running the Honey Filter...</p>
        </div>
      )}
    </div>
  );
}
