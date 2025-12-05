import './components.css';
import { DEFAULT_CATEGORY_OPTIONS, type CategoryOption } from '../types/news';

type CategoryTabsProps = {
  selected: string;
  onSelect: (key: string) => void;
  categories?: CategoryOption[];
};

export default function CategoryTabs({
  selected,
  onSelect,
  categories = DEFAULT_CATEGORY_OPTIONS,
}: CategoryTabsProps) {
  return (
    <div className="category-tabs">
      {categories.map((category) => (
        <div
          key={category.key}
          className={`category-item ${selected === category.key ? 'active' : ''}`}
          onClick={() => onSelect(category.key)}
        >
          {category.label}
        </div>
      ))}
    </div>
  );
}

