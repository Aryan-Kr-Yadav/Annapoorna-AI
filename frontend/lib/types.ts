// Mirrors the backend's Pydantic schemas. Kept intentionally close to
// app/schemas/*.py in the backend so the two stay easy to reconcile.

export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  state: string;
  district: string;
  village_or_city: string | null;
  area: number;
  area_unit: "acre" | "hectare" | "bigha";
  soil_type: string | null;
  irrigation_type: "rainfed" | "canal" | "borewell" | "drip" | "sprinkler" | "other";
  latitude: number | null;
  longitude: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CropCycle {
  id: string;
  farm_id: string;
  crop_name: string;
  variety: string | null;
  season: "kharif" | "rabi" | "zaid" | "perennial";
  year: number;
  area: number | null;
  sowing_date: string;
  expected_harvest_date: string | null;
  actual_harvest_date: string | null;
  status: "planned" | "active" | "harvested" | "sold" | "archived";
}

export interface LifecycleStage {
  name: string;
  start_day: number;
  end_day: number;
  is_estimate: boolean;
}

export interface Lifecycle {
  crop_name: string;
  day_number: number;
  current_stage: string | null;
  next_stage: string | null;
  total_estimated_duration_days: number | null;
  stages: LifecycleStage[];
  progress_percentage: number | null;
  note?: string | null;
}

export interface CropTask {
  id: string;
  crop_cycle_id: string;
  title: string;
  description: string | null;
  task_type: "irrigation" | "fertilization" | "inspection" | "soil" | "harvest" | "custom";
  scheduled_date: string;
  status: "pending" | "completed" | "skipped";
  completed_at: string | null;
  priority: "low" | "medium" | "high";
  auto_generated: boolean;
}

export interface DashboardData {
  farm: { id: string; name: string };
  weather: any;
  weather_intelligence?: {
    farming_condition_score: number;
    rain_advisory: string;
    disease_risk: string;
    spraying_condition: string;
    stress_warning: string | null;
    best_farming_window: string;
    timeline: any[];
  } | null;
  active_crop: {
    crop_cycle_id: string;
    crop_name: string;
    season: string;
    day_number: number;
    current_stage: string | null;
    progress_percentage: number | null;
  } | null;
  todays_tasks: { id: string; title: string; task_type: string }[];
  irrigation: { estimated_next_date?: string; days_until_next: number | null; note: string } | null;
  expenses: { total: number; by_category: Record<string, number> } | null;
  alerts: { type: string; priority: string; title: string; message: string }[];
  unsold_harvests?: { crop_cycle_id: string; crop_name: string; remaining_quantity: number; unit: string }[];
  saved_plans_count?: number;
}

export interface ChatSessionT {
  id: string;
  user_id: string;
  farm_id: string | null;
  crop_cycle_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageT {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface Scheme {
  id: string;
  name: string;
  short_name?: string | null;
  description: string;
  category: string;
  scheme_type?: string;
  scope?: string;
  state?: string | null;
  target_beneficiaries?: string[] | null;
  applicable_crops?: string[] | null;
  benefits: string[];
  eligibility: string[] | Record<string, any>;
  documents_required?: string[];
  required_documents?: string[];
  application_process?: string[] | null;
  official_url?: string | null;
  source?: string | null;
  source_url?: string | null;
  ministry_or_department?: string | null;
  active_status?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  last_verified?: string | null;
  relevance_note?: string | null;
}

export interface SchemeMatchDetails {
  status: string;
  reasons: string[];
  missing_information: string[];
  relevance_score?: number | null;
}

export interface SchemeRecommendation {
  scheme: Scheme;
  match: SchemeMatchDetails;
}

export interface SchemeExplainResult {
  explanation: string;
  language: string;
  scheme_name: string;
  official_source?: string | null;
  official_url?: string | null;
  last_verified?: string | null;
  disclaimer: string;
}

export interface Expense {
  id: string;
  crop_cycle_id: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
}

export interface Diagnosis {
  id: string;
  crop_cycle_id: string;
  image_url: string | null;
  symptoms_reported: string | null;
  possible_condition: string | null;
  confidence_percentage: number | null;
  severity: "low" | "medium" | "high" | "unknown";
  recommendation: string | null;
  is_follow_up: boolean;
  created_at: string;
}
