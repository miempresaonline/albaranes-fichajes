import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function SearchableSelect({ options, value, onValueChange, placeholder = "Seleccionar...", disabled = false }: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    // Filter options
    const filteredOptions = React.useMemo(() => {
        if (!search) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, options]);

    const selectedLabel = options.find((opt) => opt.value === value)?.label;

    // Handle click outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (selectedValue: string) => {
        onValueChange(selectedValue);
        setOpen(false);
        setSearch("");
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
            >
                {value ? selectedLabel : <span className="text-muted-foreground">{placeholder}</span>}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white text-slate-900 shadow-md outline-none animate-in fade-in-0 zoom-in-95 overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center border-b px-3 bg-white">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* List */}
                    <div className="max-h-[200px] overflow-y-auto p-1 bg-white">
                        {filteredOptions.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">No se encontraron resultados.</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        value === option.value && "bg-slate-100 font-medium"
                                    )}
                                    onMouseDown={(e) => {
                                        // Use onMouseDown to prevent blur before click registers
                                        e.preventDefault();
                                        handleSelect(option.value);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
