import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputProps } from './input';
import { Button } from './button';
import { cn } from '../utils/cn';

export interface SearchInputProps extends Omit<InputProps, 'type'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, showClearButton = true, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          type="search"
          className={cn('pl-9 pr-9', className)}
          value={value}
          {...props}
        />
        {showClearButton && hasValue && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={onClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';