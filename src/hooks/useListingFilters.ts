import { useCallback, useMemo, useState } from "react";
import type { ListingFilters } from "../services/listings";
import type { SellerType } from "../types";
import type { StatusFilter } from "../utils/listingDisplay";
import type { SortConfig } from "../utils/sorting";
import type { QuickFilterType } from "../utils/quickFilters";
import type { SavedViewFilter } from "../utils/savedViews";
import type { SavedFilter } from "../utils/savedFilters";
import type { NeighborhoodFilter } from "../utils/neighborhoods";
import { useDebouncedValue } from "./useDebouncedValue";

export type DateRange = "all" | "24h" | "3d" | "7d";
export type TransactionTypeFilter = "all" | "sale" | "rent";

/** Toată starea de filtrare/sortare a panoului de anunțuri, într-un singur loc. */
export function useListingFilters() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [sellerFilter, setSellerFilter] = useState<SellerType | "all">("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionTypeFilter>("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<NeighborhoodFilter>("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minSqm, setMinSqm] = useState<number | "">("");
  const [maxSqm, setMaxSqm] = useState<number | "">("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "date_scraped", order: "desc" });
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const queryFilters = useMemo<ListingFilters>(() => ({
    search: debouncedSearch,
    status: statusFilter,
    sellerType: sellerFilter,
    transactionType: transactionTypeFilter,
    neighborhood: neighborhoodFilter,
    minPrice: minPrice === "" ? null : minPrice,
    maxPrice: maxPrice === "" ? null : maxPrice,
    minSqm: minSqm === "" ? null : minSqm,
    maxSqm: maxSqm === "" ? null : maxSqm,
    dateRange,
    hideDuplicates,
    sortField: sortConfig.field,
    sortOrder: sortConfig.order,
  }), [debouncedSearch, statusFilter, sellerFilter, transactionTypeFilter, neighborhoodFilter, minPrice, maxPrice, minSqm, maxSqm, dateRange, hideDuplicates, sortConfig]);

  const resetRangeFilters = useCallback(() => {
    setNeighborhoodFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setMinSqm("");
    setMaxSqm("");
    setDateRange("all");
  }, []);

  const applySavedView = useCallback((view: SavedViewFilter) => {
    setSearch(view.location ?? "");
    setMaxPrice(view.maxPrice ?? "");
    setSellerFilter(
      view.sellerType && ["owner", "agency", "developer", "unknown"].includes(view.sellerType)
        ? (view.sellerType as SellerType)
        : "all"
    );
    setTransactionTypeFilter(
      view.transactionType === "sale" || view.transactionType === "rent" ? view.transactionType : "all"
    );
  }, []);

  const applySavedFilter = useCallback((sf: SavedFilter) => {
    setStatusFilter(sf.statusFilter as StatusFilter);
    setTransactionTypeFilter(sf.transactionType as TransactionTypeFilter);
    setSearch(sf.searchQuery);
    setMinPrice(sf.minPrice ? Number(sf.minPrice) : "");
    setMaxPrice(sf.maxPrice ? Number(sf.maxPrice) : "");
    setMinSqm(sf.minSqm ? Number(sf.minSqm) : "");
    setMaxSqm(sf.maxSqm ? Number(sf.maxSqm) : "");
    setDateRange(sf.dateRange as DateRange);
  }, []);

  return {
    statusFilter, setStatusFilter,
    search, setSearch, debouncedSearch,
    sellerFilter, setSellerFilter,
    transactionTypeFilter, setTransactionTypeFilter,
    neighborhoodFilter, setNeighborhoodFilter,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    minSqm, setMinSqm,
    maxSqm, setMaxSqm,
    dateRange, setDateRange,
    hideDuplicates, setHideDuplicates,
    sortConfig, setSortConfig,
    quickFilter, setQuickFilter,
    showFavoritesOnly, setShowFavoritesOnly,
    showAdvancedFilters, setShowAdvancedFilters,
    queryFilters,
    resetRangeFilters,
    applySavedView,
    applySavedFilter,
  };
}

export type ListingFiltersState = ReturnType<typeof useListingFilters>;
