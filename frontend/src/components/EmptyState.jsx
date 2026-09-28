export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 px-6 py-16 text-center dark:border-gray-800">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
        <Icon size={26} />
      </div>
      <h3 className="font-display text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
      <p className="max-w-sm text-sm text-gray-400">{description}</p>
      {action}
    </div>
  );
}
