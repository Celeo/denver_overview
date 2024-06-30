/**
 * Get the METAR for KDEN.
 */
export async function getMetar(): Promise<string> {
  const response = await fetch("https://metar.vatsim.net/KDEN");
  return await response.text();
}

export type Conditions = "VFR" | "MVFR" | "IFR" | "LIFR";

export type WindDirection = number | "VRB";

export type WindMagnitude = [number, number | null];

export type AirportWeather = {
  conditions: Conditions;
  visibility: number;
  ceiling: number;
  windDirection: WindDirection;
  windMagnitude: WindMagnitude;
};

/**
 * Parse the given METAR, extracting information about the airport.
 */
export function parseWeather(metar: string): AirportWeather {
  const parts = metar.split(" ");
  let ceiling = 3_456;
  let windDirection: WindDirection = "VRB";
  let conditions: Conditions = "LIFR";
  let windMagnitude: WindMagnitude = [0, null];
  let visibility = 0;

  for (const part of parts) {
    if (part.startsWith("BKN") || part.startsWith("OVC")) {
      let buff = "";
      for (const char of part) {
        if (char.match(/[0-9]/)) {
          buff += char;
        }
      }
      ceiling = parseInt(buff) * 100;
    } else if (part.endsWith("KT")) {
      let winds = part.replace("KT", "");
      if (!winds.startsWith("VRB")) {
        windDirection = parseInt(winds.substring(0, 3));
      }
      if (winds.includes("G")) {
        const windParts = winds.substring(3).split("G");
        windMagnitude = [parseInt(windParts[0]!), parseInt(windParts[1]!)];
      } else {
        windMagnitude = [parseInt(winds.substring(3)), null];
      }
    }
  }

  for (const part of parts) {
    if (part.endsWith("SM")) {
      const vis = part.replace("SM", "");
      if (vis.includes("/")) {
        visibility = 0;
      } else {
        visibility = parseInt(vis);
      }
    }
  }

  if (visibility > 5 && ceiling > 3_000) {
    conditions = "VFR";
  } else if (visibility >= 3 && ceiling > 1_000) {
    conditions = "MVFR";
  } else if (visibility >= 1 && ceiling > 500) {
    conditions = "IFR";
  }

  return {
    ceiling,
    conditions,
    visibility,
    windDirection,
    windMagnitude,
  };
}

/**
 * Determine the recommended runway configuration based on winds.
 *
 * The CIC may have reason to not use this flow. No Honey Badger
 * recommendations are made here.
 */
export function getRecommendedFlow(weather: AirportWeather): string {
  const dir = weather.windDirection;
  const mag =
    weather.windMagnitude[1] === null
      ? weather.windMagnitude[0]
      : weather.windMagnitude[1];

  if (dir === "VRB") {
    return "North Calm";
  } else if (dir >= 260 && dir <= 79 && mag <= 10) {
    return "North Calm";
  } else if (dir >= 80 && dir <= 359 && mag <= 10) {
    return "South Calm";
  } else if (dir >= 350 && dir <= 79 && mag >= 11 && mag <= 25) {
    return "North East";
  } else if (dir >= 260 && dir <= 349 && mag >= 11 && mag <= 25) {
    return "North West";
  } else if (dir >= 80 && dir <= 169 && mag >= 11 && mag <= 25) {
    return "South East";
  } else if (dir >= 170 && dir <= 259 && mag >= 11 && mag <= 25) {
    return "South West";
  } else if (dir >= 300 && dir <= 39 && mag > 25) {
    return "North All";
  } else if (dir >= 120 && dir <= 219 && mag > 25) {
    return "South All";
  } else if (dir >= 40 && dir <= 119 && mag > 25) {
    return "East All";
  } else if (dir >= 220 && dir <= 299 && mag > 25) {
    return "West All";
  }
  return "Unknown";
}

/**
 * Runway numbers and their direction.
 */
const RUNWAY_DIRECTIONS: Record<string, number> = {
  "7": 82.6,
  "8": 82.6,
  "25": 262.2,
  "26": 262.7,
  "16L": 172.6,
  "16R": 172.6,
  "17L": 172.6,
  "17R": 172.6,
  "34L": 352.6,
  "34R": 352.6,
  "35L": 352.6,
  "35R": 352.6,
};
