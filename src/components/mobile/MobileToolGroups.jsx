import MobileGroupedRow from '@/components/mobile/MobileGroupedRow';

export default function MobileToolGroups({ categories, onOpen }) {
  return (
    <div className="ios-navigation space-y-6">
      {categories.map((category) => (
        <section key={category.label} aria-label={category.label}>
          <h3 className="ios-section-title">{category.label}</h3>
          <div className="ios-group">
            {category.tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <MobileGroupedRow
                  key={tool.page}
                  title={tool.name}
                  subtitle={tool.description}
                  onClick={() => onOpen(tool.page)}
                  leading={<span className={`ios-row-icon ${tool.color}`}><Icon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" /></span>}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}