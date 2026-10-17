import React from 'react';
import { Gamepad2, Smartphone, Bot, Cpu, Wrench, Package } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  count?: number;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  count,
  isSelected,
  onSelect,
}) => {
  const getIcon = () => {
    switch (name) {
      case 'PC Games':
        return <Gamepad2 className="w-4 h-4" />;
      case 'Mobile Games':
        return <Smartphone className="w-4 h-4" />;
      case 'Bots':
        return <Bot className="w-4 h-4" />;
      case 'Special APKs':
        return <Cpu className="w-4 h-4" />;
      case 'Tools':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <button
      onClick={() => onSelect(name)}
      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border whitespace-nowrap cursor-pointer ${
        isSelected
          ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-900/30'
          : 'bg-[#141721] border-white/10 text-zinc-300 hover:border-white/20 hover:text-white'
      }`}
    >
      <span className={isSelected ? 'text-white' : 'text-violet-400'}>
        {getIcon()}
      </span>
      <span>{name}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            isSelected ? 'bg-violet-800 text-violet-200' : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
