interface ProgressBarProps {
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export default function ProgressBar({ progress, completedLessons, totalLessons }: ProgressBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Ваш прогресс</h3>
        <span className="text-sm text-gray-600">
          {completedLessons} из {totalLessons} уроков
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-center">
        <span className="text-2xl font-bold text-blue-600">{progress}%</span>
      </div>
    </div>
  );
}
