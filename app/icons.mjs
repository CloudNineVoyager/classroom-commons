import { createElement } from 'react';
import { BookOpen, LayoutDashboard, CalendarRange, PackageCheck, Sparkles, Plus, FolderOpen, Download, Printer, FileDown, RotateCcw, Trash2, Check, Circle, ChevronRight, X, AlertTriangle, ShieldCheck, Users, Clock3, ClipboardCopy, ArrowRight, Save, LoaderCircle, FilePlus2, ListChecks, WifiOff, SlidersHorizontal } from 'lucide-react';

const icons = { book: BookOpen, overview: LayoutDashboard, flow: CalendarRange, fit: PackageCheck, ai: Sparkles, plus: Plus, open: FolderOpen, export: Download, print: Printer, portable: FileDown, sample: RotateCcw, remove: Trash2, check: Check, circle: Circle, chevron: ChevronRight, close: X, warning: AlertTriangle, shield: ShieldCheck, groups: Users, clock: Clock3, copy: ClipboardCopy, next: ArrowRight, save: Save, working: LoaderCircle, new: FilePlus2, tasks: ListChecks, offline: WifiOff, settings: SlidersHorizontal };
export function Icon({ name, size = 18, className = '' }) {
  return createElement(icons[name] || Circle, { size, strokeWidth: 1.8, 'aria-hidden': true, 'data-icon': name, className: `icon ${className}`, focusable: false });
}
