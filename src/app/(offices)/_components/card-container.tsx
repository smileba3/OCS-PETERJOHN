export default function CardContainer({
  title,
  children,
}: {
  title?: string|JSX.Element;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 min-w-[250px]">
      <div className="rounded-t text-blue-800 font-semibold p-3">{title}</div>
      <div className="text-gray-600 text-sm py-4 p-3 border-t border-blue-800 rounded-b">
        {children}
      </div>
    </div>
  )
}