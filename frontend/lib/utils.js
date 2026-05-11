import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDistance = (km) => {
  return new Intl.NumberFormat("it-IT").format(Math.round(km)) + " km";
};

export const formatSpeed = (kmh) => {
  return new Intl.NumberFormat("it-IT").format(Math.round(kmh)) + " km/h";
};

export const formatDiameter = (min, max) => {
  return ((min + max) / 2).toFixed(3) + " km";
};

export const getLastWeekRange = () => {
  const date = new Date();
  const endDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const startDateObj = new Date();
  startDateObj.setDate(date.getDate() - 7);
  const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, "0")}-${String(startDateObj.getDate()).padStart(2, "0")}`;
  return { startDate, endDate };
};

export const getToday = () => new Date().toISOString().split("T")[0];