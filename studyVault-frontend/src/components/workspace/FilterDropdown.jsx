import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion as Motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * @typedef {Object} FilterOption
 * @property {string} label - Display label for the option
 * @property {string} value - Value passed to onChangeValue
 * @property {string} [description] - Optional subtitle shown below the label
 * @property {React.ComponentType} [Icon] - Optional icon rendered for the option
 */

/**
 * @typedef {Object} FilterGroup
 * @property {string} [label] - Optional group heading
 * @property {FilterOption[]} options - Options within this group
 */

/**
 * Accessible dropdown filter control with portal rendering, smart positioning,
 * keyboard dismissal, and click-outside handling.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.Icon - Icon shown in the trigger button
 * @param {string} props.label - Trigger button label (shown above active value)
 * @param {string} props.value - Currently selected value
 * @param {(value: string) => void} props.onChangeValue - Called when an option is selected
 * @param {FilterOption[]} [props.options=[]] - Flat option list (alternative to groups)
 * @param {FilterGroup[]} [props.groups=[]] - Grouped option list (overrides options)
 */
const FilterDropdown = ({ Icon, groups = [], label, onChangeValue, options = [], value }) => {
    const FilterIcon = Icon;
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const normalizedGroups = groups.length > 0 ? groups : [{ options }];
    const flatOptions = normalizedGroups.flatMap((g) => g.options || []);
    const activeOption = flatOptions.find((o) => o.value === value) || flatOptions[0];
    const optionCount = flatOptions.length;
    const groupCount = normalizedGroups.filter((g) => g.label).length;

    // Click-outside and Escape key dismissal
    useEffect(() => {
        if (!isOpen) return undefined;

        const handlePointerDown = (event) => {
            if (
                !buttonRef.current?.contains(event.target) &&
                !menuRef.current?.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Smart menu positioning (inlined to avoid stale-closure / hook-deps warnings)
    useLayoutEffect(() => {
        if (!isOpen) return undefined;

        const button = buttonRef.current;
        if (!button) return undefined;

        const compute = () => {
            const rect = button.getBoundingClientRect();
            const vp = 16;
            const w = Math.min(Math.max(rect.width, 280), window.innerWidth - vp * 2);
            const left = Math.min(Math.max(rect.left, vp), window.innerWidth - w - vp);
            const estH = Math.min(288, 18 + optionCount * 58 + groupCount * 28);
            const below = window.innerHeight - rect.bottom - vp;
            const above = rect.top - vp;
            const openUp = below < Math.min(estH, 220) && above > below;
            const maxHeight = Math.max(180, Math.min(288, openUp ? above - 8 : below - 8));
            const top = openUp ? Math.max(vp, rect.top - maxHeight - 8) : rect.bottom + 8;
            setMenuStyle({ left, maxHeight, top, width: w });
        };

        compute();
        window.addEventListener('resize', compute);
        window.addEventListener('scroll', compute, true);

        return () => {
            window.removeEventListener('resize', compute);
            window.removeEventListener('scroll', compute, true);
        };
    }, [isOpen, groupCount, optionCount]);

    const selectOption = (optVal) => {
        onChangeValue(optVal);
        setIsOpen(false);
    };

    const toggleMenu = () => setIsOpen((prev) => !prev);

    return (
        <div className="relative min-w-0">
            <button
                ref={buttonRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={toggleMenu}
                className={cn(
                    'group flex h-14 w-full min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/70 bg-white/72 px-3.5 text-left shadow-sm transition-all hover:border-brand-100 hover:bg-white hover:shadow-[0_18px_46px_-38px_rgba(45,44,47,0.5)] focus:outline-none focus:ring-2 focus:ring-brand-500/15',
                    isOpen && 'border-brand-100 bg-white shadow-[0_18px_48px_-34px_rgba(155,63,54,0.5)]',
                )}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                    <FilterIcon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        {label}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-extrabold text-slate-800">
                        {activeOption?.label || 'Select'}
                    </span>
                </span>
                <ChevronDown
                    size={16}
                    className={cn(
                        'shrink-0 text-slate-400 transition-transform',
                        isOpen && 'rotate-180 text-brand-600',
                    )}
                />
            </button>

            {typeof document !== 'undefined'
                ? createPortal(
                    <AnimatePresence>
                        {isOpen ? (
                            <Motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.16, ease: 'easeOut' }}
                                style={{
                                    left: menuStyle?.left ?? 0,
                                    maxHeight: menuStyle?.maxHeight ?? 288,
                                    top: menuStyle?.top ?? 0,
                                    width: menuStyle?.width ?? 320,
                                    visibility: menuStyle ? 'visible' : 'hidden',
                                }}
                                className="fixed z-[1000] overflow-hidden rounded-[1.35rem] border border-white/85 bg-white/95 p-2 shadow-[0_26px_76px_-36px_rgba(45,44,47,0.58)] backdrop-blur-xl"
                                role="listbox"
                            >
                                <div
                                    className="overflow-y-auto pr-1"
                                    style={{ maxHeight: Math.max((menuStyle?.maxHeight ?? 288) - 16, 160) }}
                                >
                                    {normalizedGroups.map((group, groupIndex) => {
                                        const groupOptions = group.options || [];
                                        if (groupOptions.length === 0) return null;

                                        return (
                                            <div
                                                key={group.label || `group-${groupIndex}`}
                                                className={groupIndex > 0 ? 'mt-2' : ''}
                                            >
                                                {group.label ? (
                                                    <p className="px-3 pb-1.5 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                                        {group.label}
                                                    </p>
                                                ) : null}

                                                <div className="space-y-1">
                                                    {groupOptions.map((option) => {
                                                        const selected = option.value === value;
                                                        const OptionIcon = option.Icon;

                                                        return (
                                                            <button
                                                                key={option.value || option.label}
                                                                type="button"
                                                                role="option"
                                                                aria-selected={selected}
                                                                onClick={() => selectOption(option.value)}
                                                                title={option.description || option.label}
                                                                className={cn(
                                                                    'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all',
                                                                    selected
                                                                        ? 'bg-brand-50 text-brand-700 shadow-sm'
                                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                                                                )}
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        'flex h-8 w-8 items-center justify-center rounded-full',
                                                                        selected
                                                                            ? 'bg-white text-brand-600'
                                                                            : 'bg-slate-50 text-slate-400',
                                                                    )}
                                                                >
                                                                    {OptionIcon ? <OptionIcon size={15} /> : <FilterIcon size={15} />}
                                                                </span>
                                                                <span className="min-w-0">
                                                                    <span className="block truncate text-sm font-extrabold">
                                                                        {option.label}
                                                                    </span>
                                                                    {option.description ? (
                                                                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">
                                                                            {option.description}
                                                                        </span>
                                                                    ) : null}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        'flex h-6 w-6 items-center justify-center rounded-full transition-all',
                                                                        selected
                                                                            ? 'bg-brand-600 text-white'
                                                                            : 'bg-white text-transparent ring-1 ring-slate-100',
                                                                    )}
                                                                >
                                                                    <Check size={13} />
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Motion.div>
                        ) : null}
                    </AnimatePresence>,
                    document.body,
                )
                : null}
        </div>
    );
};

export default FilterDropdown;
