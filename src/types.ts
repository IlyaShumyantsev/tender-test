export interface Tender {
  id: string;
  title: string;
  organization: string;
  category: TenderCategory;
  status: TenderStatus;
  budget: number;
  currency: string;
  region: string;
  publishDate: string;
  deadline: string;
  description: string;
  requirements: string[];
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  isFavorite: boolean;
  isNew: boolean;
  viewsCount: number;
  participantsCount: number;
}

export type TenderCategory =
  | 'construction'
  | 'it'
  | 'medical'
  | 'transport'
  | 'education'
  | 'energy'
  | 'food'
  | 'consulting';

export type TenderStatus = 'active' | 'upcoming' | 'closed' | 'evaluation';

export type SortBy = 'date' | 'budget' | 'deadline' | 'name';
export type ViewMode = 'grid' | 'list';

export interface FilterState {
  search: string;
  categories: TenderCategory[];
  statuses: TenderStatus[];
  regions: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  sortBy: SortBy;
  onlyFavorites: boolean;
  onlyNew: boolean;
}
