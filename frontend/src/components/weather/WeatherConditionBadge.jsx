import React from "react";
import {
  CloudRain,
  Sun,
  CloudSun,
  CloudLightning,
  CloudFog,
  Wind,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "../common/Badge";

export function WeatherConditionBadge({ code, condition = "" }) {
  let Icon = CloudSun;
  let label = condition || "Partly Cloudy";
  let variant = "primary";

  if (code === 0 || code === 1) {
    Icon = Sun;
    label = "Sunny / Clear";
    variant = "warning";
  } else if (code >= 51 && code <= 67) {
    Icon = CloudRain;
    label = "Rain Forecasted";
    variant = "blue";
  } else if (code >= 80 && code <= 99) {
    Icon = CloudLightning;
    label = "Stormy / Showers";
    variant = "danger";
  } else if (code === 45 || code === 48) {
    Icon = CloudFog;
    label = "Foggy / Mist";
    variant = "neutral";
  }

  return (
    <Badge variant={variant} className="gap-1.5 px-3 py-1">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Badge>
  );
}

export default WeatherConditionBadge;
