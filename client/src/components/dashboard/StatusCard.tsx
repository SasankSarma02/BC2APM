type StatusCardProps = {
  title: string;
  count: number | string;
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  footer?: React.ReactNode;
};

export default function StatusCard({ 
  title, 
  count, 
  icon, 
  iconBgColor, 
  iconTextColor, 
  footer 
}: StatusCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${iconBgColor} ${iconTextColor}`}>
          <span className="material-icons">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-2xl font-semibold text-neutral-900">{count}</p>
        </div>
      </div>
      {footer && (
        <div className="mt-3 text-sm text-neutral-600">
          {footer}
        </div>
      )}
    </div>
  );
}
