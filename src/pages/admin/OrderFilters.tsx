import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type StatusFilter =
  | "all"
  | "needs_attention"
  | "payment_received"
  | "pending_admin_review"
  | "approved"
  | "email_sent";

interface OrderFiltersProps {
  statusFilter: StatusFilter;
  searchQuery: string;
  onStatusChange: (value: StatusFilter) => void;
  onSearchChange: (value: string) => void;
}

export function OrderFilters({
  statusFilter,
  searchQuery,
  onStatusChange,
  onSearchChange,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[240px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Orders</SelectItem>
          <SelectItem value="needs_attention">⚠️ Needs Attention</SelectItem>
          <SelectItem value="payment_received">Payment Received</SelectItem>
          <SelectItem value="pending_admin_review">Pending Review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="email_sent">Completed</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or hero name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
